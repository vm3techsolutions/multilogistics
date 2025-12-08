const db = require('../../config/db');

// ======================== CREATE AGENT ========================
/**
 * Creates a new agent in the database.
 *
 * Expects:
 * - name: string (required)
 * - email: string (required, primary email)
 * - email1: string (optional, secondary email)
 * - email2: string (optional, tertiary email)
 * - email3: string (optional, quaternary email)
 * - contact_person_name: string (required)
 * - phone: string (required, primary phone)
 * - phone1: string (optional, secondary phone)
 * - country: string (required)
 * - type: string ('import' or 'export', required)
 *
 * Requires authenticated user info in req.user.id (from JWT middleware).
 */
const createAgent = async (req, res) => {
  const { name, email, email1, email2, email3, contact_person_name, phone, phone1, country, type } = req.body;
  const createdBy = req.user.id; // From JWT middleware

  if (!name || !email || !contact_person_name || !phone || !country || !type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  console.log(
    `Creating agent: ${name}, Email: ${email}, Email1: ${email1}, Email2: ${email2}, Email3: ${email3}, Type: ${type}, Created By: ${createdBy}, Phone: ${phone}, Phone1: ${phone1}, Country: ${country}`
  );

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
      INSERT INTO agents (name, email, email1, email2, email3, contact_person_name, phone, phone1, country, type, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(insertSql, [
      name,
      email,
      email1 || null,
      email2 || null,
      email3 || null,
      contact_person_name,
      phone,
      phone1 || null,
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


const editAgent = async (req, res) => {
 
  const { id } = req.params;
  const { name, email, email1, email2, email3, contact_person_name, phone, phone1, country, type } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Agent ID is required' });
  }
  try {
    // Check if agent exists
    const checkSql = `SELECT * FROM agents WHERE id = $1`;
    const existing = await db.query(checkSql, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    // Update agent with new email and phone columns
    const updateSql = `
      UPDATE agents SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        email1 = COALESCE($3, email1),
        email2 = COALESCE($4, email2),
        email3 = COALESCE($5, email3),
        contact_person_name = COALESCE($6, contact_person_name),
        phone = COALESCE($7, phone),
        phone1 = COALESCE($8, phone1),
        country = COALESCE($9, country),
        type = COALESCE($10, type),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;
    const result = await db.query(updateSql, [
      name,
      email,
      email1,
      email2,
      email3,
      contact_person_name,
      phone,
      phone1,
      country,
      type,
      id,
    ]);
    return res.status(200).json({
      message: 'Agent updated successfully',
      agent: result.rows[0],
    });
  } catch (err) {
    console.error('Edit Agent Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ======================== GET ALL AGENTS ========================
/**
 * Fetches all agents from the database.
 *
 * @async
 * @function getAllAgents
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllAgents = async (req, res) => {
  try {
    const sql = `SELECT * FROM agents ORDER BY created_at DESC`;
    const result = await db.query(sql);

    return res.status(200).json({
      message: 'Agents fetched successfully',
      agents: result.rows,
    });
  } catch (err) {
    console.error('Get All Agents Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateAgentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // expect true or false

  if (!id) return res.status(400).json({ message: "Agent ID is required" });
  if (typeof status !== "boolean")
    return res.status(400).json({ message: "Status must be true or false" });

  try {
    // Check if agent exists
    const checkSql = `SELECT * FROM agents WHERE id = $1`;
    const existing = await db.query(checkSql, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const currentStatus = existing.rows[0].is_active;

    // ✅ Prevent duplicate status update
    if (currentStatus === status) {
      return res.status(400).json({
        message: `Agent is already ${status ? "Active" : "Inactive"}`,
      });
    }

    // ✅ Update status
    const updateSql = `
      UPDATE agents
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await db.query(updateSql, [status, id]);

    res.status(200).json({
      message: `Agent status updated to ${status ? "Active" : "Inactive"}`,
      agent: result.rows[0],
    });
  } catch (err) {
    console.error("Update Agent Status Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createAgent,
  getAllAgents,
  editAgent,
  updateAgentStatus
};
