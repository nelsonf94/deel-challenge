const { Op } = require('sequelize');

const express = require('express');
const router = express.Router();

/**
 * GET /contracts/
 * Retrieves a list of contracts belonging to a user (client or contractor), the list should only contain non terminated contracts.
 * @returns {JSON} List of contracts belonging to the user. If successful, returns a JSON array of contracts. If an error occurs, returns a JSON error response.
 */
router.get('/', async (req, res) => {
  try {
    const { Contract } = req.app.get('models');
    const { profile } = req;

    const contracts = await Contract.findAll({
      where: {
        // Contracts where the profile is either the contractor or client
        [Op.or]: [{ ContractorId: profile.id }, { ClientId: profile.id }],
        // Exclude terminated contracts
        status: { [Op.not]: 'terminated' }
      },
    });

    res.json(contracts);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /contracts/:id
 * Retrieves a contract by its ID, ensuring it belongs to the calling profile.
 *
 * @returns {JSON} Contract details if authorized; otherwise, returns an error response.
 */
router.get('/:id', async (req, res) => {
  try {
    const { Contract } = req.app.get('models');
    const { id } = req.params;
    const { profile } = req;

    const contract = await Contract.findOne({ where: { id } });

    if (!contract) return res.status(404).end();

    if (contract.ContractorId === profile.id || contract.ClientId === profile.id)
      return res.status(200).json(contract);

    return res.status(403).json({ error: 'Forbidden - Contract does not belong to the calling profile.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;