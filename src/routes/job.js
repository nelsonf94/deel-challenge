const express = require('express');
const { Op } = require('sequelize');
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

module.exports = router;