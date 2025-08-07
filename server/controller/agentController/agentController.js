const bcrypt = require('bcrypt');
const db = require('../config/db');

// @desc Register a new agent
// @route POST /api/agents/register
exports.registerAgent = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  db.query('SELECT * FROM agents WHERE email = ?', [email], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    if (result.length > 0) {
      return res.status(409).json({ message: 'Agent already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO agents (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, phone],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to register agent', error: err });

        res.status(201).json({ message: 'Agent registered successfully' });
      }
    );
  });
};
