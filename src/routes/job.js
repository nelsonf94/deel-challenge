const express = require('express');
const { sequelize } = require('../model');
const { Op } = require('sequelize');
const { isClientProfile } = require('../middleware/isClientProfile');

const router = express.Router();

/**
 * GET /jobs/unpaid
 * Retrieves a list of unpaid jobs associated with contracts belonging to a user (client or contractor).
 * The list should only contain non-terminated contracts.
 *
 * @returns {JSON} List of unpaid jobs associated with non-terminated contracts.
 *               If successful, returns a JSON array of jobs.
 *               If an error occurs, returns a JSON error response.
 */
router.get('/unpaid', async (req, res) => {
  try {
    const { Contract, Job } = req.app.get('models');
    const { profile } = req;

    const contracts = await Contract.findAll({
      where: {
        // Contracts where the profile is either the contractor or client
        [Op.or]: [{ ContractorId: profile.id }, { ClientId: profile.id }],
        // Exclude terminated contracts
        status: { [Op.not]: 'terminated' }
      },
      include: [{
        model: Job,
        where: {
          // Unpaid jobs
          paid: { [Op.not]: true }
        }
      }]
    });

    const unpaidJobs = contracts.flatMap(contract => contract.Jobs);

    res.json(unpaidJobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
* POST /jobs/:job_id/pay
* Pay for a job. A client can only pay if their balance is >= the amount to pay.
* The amount is moved from the client's balance to the contractor's balance.
*
* @returns {JSON} Payment status.
*               If successful, returns a JSON object with job details.
*               If an error occurs, returns a JSON error response.
*/
router.post('/:job_id/pay', isClientProfile, async (req, res) => {
  try {
    const { Job, Contract, Profile } = req.app.get('models');
    const { job_id } = req.params;
    const { profile } = req;

    // Find the job with the provided job_id
    const job = await Job.findByPk(job_id, {
      include: [{
        model: Contract,
        include: [{
          model: Profile, as: 'Contractor'
        }]
      }]
    });

    if (!job) {
      return res.status(404).end();
    }

    const { Contract: contract } = job;

    if (contract.ClientId !== profile.id) {
      return res.status(403).json({ error: 'Forbidden - Access restricted: Contract does not belong to the current user.' });
    }

    if (job.paid) {
      return res.status(401).json({ error: 'Unauthorized - The job is already paid' });
    }

    if (profile.balance < job.price) {
      return res.status(401).json({ error: 'Unauthorized - Insufficient funds to make the payment for the job.' });
    }

    const { Contractor } = contract;

    await sequelize.transaction(async t => {
      await profile.update({ balance: (profile.balance - job.price) }, { transaction: t });
      await Contractor.update({ balance: (Contractor.balance + job.price) }, { transaction: t });
      await job.update({ paid: true, paymentDate: new Date() }, { transaction: t });
    })

    res.json(job);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;