const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin Signup
/**
 * Handles admin signup by validating input, checking for existing admin by email,
 * hashing the password, and inserting a new admin record into the database.
 * Responds with appropriate status and message based on the outcome.
 *
 * @async
 * @function adminSignUp
 * @param {import('express').Request} req - Express request object containing admin details in req.body
 * @param {import('express').Response} res - Express response object used to send the response
 * @returns {Promise<void>} Sends a JSON response with status and message or admin data
 */

const adminSignUp = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate role
  const validRoles = ['superadmin', 'staff', 'sales', 'finance'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const checkSql = 'SELECT * FROM admins WHERE email = $1';
    const existing = await db.query(checkSql, [email]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Admin already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO admins (name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, created_at
    `;

    const result = await db.query(insertSql, [name, email, phone, hashedPassword, role]);

    return res.status(201).json({
      message: 'Admin signup successful',
      admin: result.rows[0],
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Unexpected server error', error: err.message });
  }
};


/**
 * Handles admin login by validating credentials, checking for admin existence,
 * verifying password, and generating a JWT token upon successful authentication.
 * Responds with appropriate status and message based on the outcome.
 *
 * @async
 * @function adminLogin
 * @param {import('express').Request} req - Express request object containing login credentials in req.body
 * @param {import('express').Response} res - Express response object used to send the response
 * @returns {Promise<void>} Sends a JSON response with status, token, and admin data
 */


const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const sql = 'SELECT * FROM admins WHERE email = $1';
    const result = await db.query(sql, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/**
 * Retrieves admin data for the authenticated admin.
 * Ensures that the requested admin ID matches the logged-in admin's ID for authorization.
 * Responds with the admin's data or an error message.
 *
 * @async
 * @function getAdminData
 * @param {import('express').Request} req - Express request object containing params and user info
 * @param {import('express').Response} res - Express response object used to send the response
 * @returns {Promise<void>} Sends a JSON response with admin data or error message
 */

const getAdminData = async (req, res) => {
  const requestedId = parseInt(req.params.id);
  const loggedInAdminId = req.user.id;

  if (requestedId !== loggedInAdminId) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }

  try {
    const sql = 'SELECT id, name, email, phone, role, created_at FROM admins WHERE id = $1';
    const result = await db.query(sql, [requestedId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ admin: result.rows[0] });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { adminSignUp, adminLogin, getAdminData };
