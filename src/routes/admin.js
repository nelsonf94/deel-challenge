const { QueryTypes } = require('sequelize');

const express = require('express');
const { sequelize } = require('../model');
const router = express.Router();

/**
 * GET /admin/best-profession
 * Returns the profession that earned the most money (sum of jobs paid) for any contractor that worked in the query time range.
 * @param {string} start - The start date of the time range in the format 'YYYY-MM-DD'.
 * @param {string} end - The end date of the time range in the format 'YYYY-MM-DD'.
 * @returns {JSON} The best profession within the specified time range. If successful, returns a JSON object with the bestProfession property. If an error occurs, returns a JSON error response.
 */
router.get('/best-profession', async (req, res) => {
  try {
    const { start, end } = req.query;

    // Find the best profession based on the sum of jobs paid within the specified time range
    const result = await sequelize.query(
      `SELECT 
          SUM("Job"."price") as total, 
          "Contractor"."profession" as profession 
        FROM "Jobs" AS "Job"
        INNER JOIN "Contracts" AS "Contract" ON "Job"."ContractId" = "Contract"."id"
        INNER JOIN "Profiles" AS "Contractor" ON "Contract"."ContractorId" = "Contractor"."id"
        WHERE "Job"."paid" = true
        AND "Job"."paymentDate" BETWEEN :start AND :end
        GROUP BY "Contract.Contractor"."profession"
        ORDER BY total DESC
        LIMIT 1`,
      {
        replacements: {
          start: start,
          end: end,
        },
        type: QueryTypes.SELECT,
      }
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'No data found in the specified time range' });
    }

    const bestProfession = result[0].profession;

    return res.status(200).json({ bestProfession });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * GET /admin/best-clients
 * Returns the clients that paid the most for jobs in the query time period.
 * @param {string} start - The start date of the time range in the format 'YYYY-MM-DD'.
 * @param {string} end - The end date of the time range in the format 'YYYY-MM-DD'.
 * @param {number} [limit=2] - The maximum number of clients to return. Defaults to 2 if not provided.
 * @returns {JSON} An array of objects containing client information, including ClientId, totalPaid, clientFirstName, and clientLastName. If successful, returns a JSON array. If an error occurs, returns a JSON error response.
 */
router.get('/best-clients', async (req, res) => {
  const { start, end, limit } = req.query;

  try {
    const result = await sequelize.query(
      `SELECT
          "Contract"."ClientId" as id,
          "Profile"."firstName" || " " || "Profile"."lastName" as fullName,
          SUM("Job"."price") AS paid
        FROM "Jobs" AS "Job"
        INNER JOIN "Contracts" AS "Contract" ON "Job"."ContractId" = "Contract"."id"
        INNER JOIN "Profiles" AS "Profile" ON "Contract"."ClientId" = "Profile"."id"
        WHERE "Job"."paid" = true
        AND "Job"."paymentDate" BETWEEN :start AND :end
        GROUP BY "Contract"."ClientId", "Profile"."firstName", "Profile"."lastName"
        ORDER BY paid DESC
        LIMIT :limit`,
      {
        replacements: {
          start: start,
          end: end,
          limit: limit || 2, // default limit is 2
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;