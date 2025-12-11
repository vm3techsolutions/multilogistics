const pool = require('../../config/db');
const { sendQuotationMail } = require("../../utils/sendQuotationMail");


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


/**
 * Admin triggers sending quotation email manually
 */
const triggerQuotationEmail = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    const adminId = req.user?.id; // from JWT middleware
    if (!quotationId) return res.status(400).json({ success: false, message: "Invalid quotation ID" });

    // Fetch quotation with packages and charges
    const { rows } = await client.query(
      `SELECT q.id, q.quote_no, q.subject, q.origin, q.destination, q.actual_weight, q.status, 
              q.total, q.final_total, q.total_freight_amount,
              c.id AS customer_id, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address,
              a.id AS agent_id, a.name AS agent_name, a.email AS agent_email
       FROM courier_export_quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN agents a ON q.agent_id = a.id
       WHERE q.id=$1`,
      [quotationId]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: "Quotation not found" });

    const quotation = rows[0];
    // normalize total fields for email
    quotation.total = quotation.total || null;
    quotation.total_freight_amount = quotation.total_freight_amount || null;
    // prefer camelCase finalTotal for email template
    quotation.finalTotal = quotation.final_total || quotation.finalTotal || null;

    if (quotation.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft quotations can be emailed.",
      });
    }


    // Fetch packages
    const { rows: packages } = await client.query(
      `SELECT length, width, height, same_size 
       FROM courier_export_quotation_packages 
       WHERE quotation_id=$1`,
      [quotationId]
    );
    quotation.packages = packages;

    // Fetch charges
    const { rows: charges } = await client.query(
      `SELECT charge_name, type, amount, description, rate_per_kg, weight_kg
       FROM courier_export_quotation_charges
       WHERE quotation_id=$1`,
      [quotationId]
    );
    quotation.charges = charges;

    // Send email asynchronously
    // await sendQuotationMail(quotation.customer_email, quotation.agent_email, quotation);
    await sendQuotationMail(quotation.customer_email, quotation);

    await client.query(
      `UPDATE courier_export_quotations 
       SET status='pending', status_updated_by=$1, status_updated_at=NOW()
       WHERE id=$2`,
      [adminId ,quotationId]
    );

    res.json({
      success: true,
      message: "Quotation email triggered successfully",
      data: { quotationId },
    });
  } catch (error) {
    console.error("Error triggering quotation email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger quotation email",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = { updateQuotationStatus, triggerQuotationEmail };