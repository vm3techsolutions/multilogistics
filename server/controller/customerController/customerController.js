const db = require('../../config/db');

/**
 * Creates a new customer in the database.
 *
 * Expects the following fields in the request body:
 * - name: string (required)
 * - company_name: string (required)
 * - email: string (required)
 * - phone: string (required)
 * - address: string (required)
 *
 * Requires authenticated user information in req.user.id (from JWT middleware).
 *
 * Validates input fields.
 * Checks for existing customer with the same email.
 * Inserts the new customer into the database if validation passes.
 *
 * @async
 * @function createCustomer
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends a JSON response with the created customer or an error message.
 */
const createCustomer = async (req, res) => {
  const { name, company_name, email, phone, address } = req.body;

  // Validate required fields
  if (!name || !company_name || !email || !phone || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  console.log(`Creating customer: ${name}, Email: ${email}, Company: ${company_name}`);

  try {
    // Check if customer already exists
    const checkSql = `SELECT * FROM customers WHERE email = $1`;
    const existing = await db.query(checkSql, [email]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Customer already exists with this email' });
    }

    // Insert new customer
    const insertSql = `
      INSERT INTO customers (name, company_name, email, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(insertSql, [
      name,
      company_name,
      email,
      phone,
      address
    ]);

    return res.status(201).json({
      message: 'Customer created successfully',
      customer: result.rows[0],
    });

  } catch (err) {
    console.error('Create Customer Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createCustomer,
};
