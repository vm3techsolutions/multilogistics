const db = require("../../config/db");

const getRecentShipmentsController = (req, res) => {
  const sql = `
    SELECT 
      awb_number AS awb_no, 
      place_of_delivery AS destination, 
      created_at
    FROM courier_exports
    ORDER BY created_at DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching recent shipments:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results.rows);
  });
};

module.exports = { getRecentShipmentsController };
