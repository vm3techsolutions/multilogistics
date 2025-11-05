const db = require('../../config/db');

// ======================== CREATE AGENT ========================
/**
 * Creates a new agent in the database.
 *
 * Expects:
 * - name: string (required)
 * - email: string (required)
 * - contact_person_name: string (required)
 * - phone: string (required)
 * - country: string (required)
 * - type: string ('import' or 'export', required)
 *
 * Requires authenticated user info in req.user.id (from JWT middleware).
 */
const createAgent = async (req, res) => {
  const { name, email, contact_person_name, phone, country, type } = req.body;
  const createdBy = req.user.id; // From JWT middleware

  if (!name || !email || !contact_person_name || !phone || !country || !type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  console.log(
    `Creating agent: ${name}, Email: ${email}, Type: ${type}, Created By: ${createdBy}, Phone: ${phone}, Country: ${country}`
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


const editAgent = async (req, res) => {
 
  const { id } = req.params;
  const { name, email, contact_person_name, phone, country, type } = req.body;
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
    // Update agent
    const updateSql = `
      UPDATE agents SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        contact_person_name = COALESCE($3, contact_person_name),
        phone = COALESCE($4, phone),
        country = COALESCE($5, country),
        type = COALESCE($6, type),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    const result = await db.query(updateSql, [
      name,
      email,
      contact_person_name,
      phone,
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
