const express = require('express');
const router = express.Router();

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

    const contract = await Contract.findOne({ where: { id } });

    if (!contract) return res.status(404).end();

    const { profile } = req;

    if (contract.ContractorId === profile.id || contract.ClientId === profile.id)
      return res.status(200).json(contract);


    return res.status(403).json({ error: 'Forbidden - Contract does not belong to the calling profile.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;