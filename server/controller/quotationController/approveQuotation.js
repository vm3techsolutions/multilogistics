const pool = require('../../config/db');



const sanitizeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return isNaN(value) ? null : Number(value);
};

// const approveQuotation = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const quotationId = sanitizeNumber(req.params.id);
//     const adminId = req.user?.id; // assuming your auth middleware sets req.user

//     if (!quotationId) {
//       return res.status(400).json({ success: false, message: "Invalid quotation ID" });
//     }

//     await client.query('BEGIN');

//     // Check if quotation exists
//     const { rows } = await client.query(
//       `SELECT id, status FROM courier_export_quotations WHERE id=$1`,
//       [quotationId]
//     );
//     if (rows.length === 0) {
//       await client.query('ROLLBACK');
//       return res.status(404).json({ success: false, message: "Quotation not found" });
//     }

//     if (rows[0].status === "approved") {
//       await client.query('ROLLBACK');
//       return res.status(400).json({ success: false, message: "Quotation is already approved" });
//     }

//     // Update status + approved_by + approved_at
//     await client.query(
//       `UPDATE courier_export_quotations 
//        SET status=$1, approved_by=$2, approved_at=NOW(), updated_at=NOW()
//        WHERE id=$3`,
//       ["approved", adminId, quotationId]
//     );

//     await client.query('COMMIT');

//     res.json({
//       success: true,
//       message: "Quotation approved successfully",
//       data: { quotationId }
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error(error);
//     res.status(500).json({ success: false, message: "Error approving quotation", error: error.message });
//   } finally {
//     client.release();
//   }
// };



// change approveQuotation into updateQuotationStatus


const updateQuotationStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    const adminId = req.user?.id; // from JWT middleware
    const { status } = req.body; // "approved" or "rejected"

    if (!quotationId || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID or status (must be 'approved' or 'rejected')"
      });
    }

    await client.query('BEGIN');

    // Check if quotation exists
    const { rows } = await client.query(
      `SELECT id, status FROM courier_export_quotations WHERE id = $1`,
      [quotationId]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    const currentStatus = rows[0].status;
    if (currentStatus === status) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Quotation is already ${status}`
      });
    }

    // Update quotation status
    await client.query(
      `UPDATE courier_export_quotations
       SET status = $1,
           status_updated_by = $2,
           status_updated_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [status, adminId, quotationId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Quotation ${status} successfully`,
      data: { quotationId, status }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating quotation:", error);
    res.status(500).json({
      success: false,
      message: "Error updating quotation status",
      error: error.message
    });
  } finally {
    client.release();
  }
};



module.exports = { updateQuotationStatus };