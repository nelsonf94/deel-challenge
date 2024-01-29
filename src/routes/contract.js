const express = require('express');
const router = express.Router();

// /**
//  * FIX ME!
//  * @returns contract by id
//  */
// app.get('/contracts/:id', getProfile, async (req, res) => {
//     const { Contract } = req.app.get('models')
//     const { id } = req.params
//     const contract = await Contract.findOne({ where: { id } })
//     if (!contract) return res.status(404).end()
//     res.json(contract)
// });

module.exports = router;