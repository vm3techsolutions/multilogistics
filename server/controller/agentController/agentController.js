const db = require('../../config/db');


// POST /api/admin/agents
/**
 * Creates a new agent in the database.
 *
 * Expects the following fields in the request body:
 * - name: string (required)
 * - email: string (required)
 * - contact_person_name: string (required)
 * - phone: string (required)
 * - country: string (required)
 * - type: string ('import' or 'export', required)
 *
 * Requires authenticated user information in req.user.id (from JWT middleware).
 *
 * Validates input fields and agent type.
 * Checks for existing agent with the same email.
 * Inserts the new agent into the database if validation passes.
 *
 * @async
 * @function createAgent
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends a JSON response with the created agent or an error message.
 */


const createAgent = async (req, res) => {
  const { name, email, contact_person_name, phone, country, type } = req.body;
  const createdBy = req.user.id; // From JWT middleware

  if (!name || !email || !contact_person_name || !phone || !country || !type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  console.log(`Creating agent: ${name}, Email: ${email}, Type: ${type}, Created By: ${createdBy}, Phone: ${phone}, Country: ${country}`);
  

  const validTypes = ['import', 'export'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid agent type' });
  }

  try {
    // Check if agent with same email already exists
    const checkSql = `SELECT * FROM agents WHERE email = $1`;
    const existing = await db.query(checkSql, [email]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Agent already exists with this email' });
    }

    const insertSql = `
      INSERT INTO agents (name, email, contact_person_name, phone, country, type, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(insertSql, [
      name,
      email,
      contact_person_name,
      phone,
      country,
      type,
      createdBy,
    ]);

    return res.status(201).json({
      message: 'Agent created successfully',
      agent: result.rows[0],
    });

  } catch (err) {
    console.error('Create Agent Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


module.exports = {
  createAgent,
};