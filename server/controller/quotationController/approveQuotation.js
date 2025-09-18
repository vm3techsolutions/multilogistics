const pool = require('../../config/db');



const sanitizeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return isNaN(value) ? null : Number(value);
};

const approveQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    const adminId = req.user?.id; // assuming your auth middleware sets req.user

    if (!quotationId) {
      return res.status(400).json({ success: false, message: "Invalid quotation ID" });
    }

    await client.query('BEGIN');

    // Check if quotation exists
    const { rows } = await client.query(
      `SELECT id, status FROM courier_export_quotations WHERE id=$1`,
      [quotationId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }

    if (rows[0].status === "approved") {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: "Quotation is already approved" });
    }

    // Update status + approved_by + approved_at
    await client.query(
      `UPDATE courier_export_quotations 
       SET status=$1, approved_by=$2, approved_at=NOW(), updated_at=NOW()
       WHERE id=$3`,
      ["approved", adminId, quotationId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Quotation approved successfully",
      data: { quotationId }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error approving quotation", error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { approveQuotation };