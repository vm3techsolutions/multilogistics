const pool = require('../../config/db');
const { sendQuotationMail } = require('../../utils/sendQuotationMail');

const sanitizeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return isNaN(value) ? null : Number(value);
};

// Change/update sea quotation status (approve/reject)
const updateSeaQuotationStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    const adminId = req.user?.id;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!quotationId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid sea quotation ID or status (must be 'approved' or 'rejected')" });
    }

    await client.query('BEGIN');

    const { rows } = await client.query(`SELECT id, status FROM sea_export_quotations WHERE id = $1`, [quotationId]);
    if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Sea quotation not found' }); }

    const currentStatus = rows[0].status;
    if (currentStatus === status) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: `Sea quotation is already ${status}` }); }

    await client.query(`UPDATE sea_export_quotations SET status=$1, status_updated_by=$2, status_updated_at=NOW(), updated_at=NOW() WHERE id=$3`, [status, adminId, quotationId]);

    await client.query('COMMIT');
    res.json({ success: true, message: `Sea quotation ${status} successfully`, data: { quotationId, status } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating sea quotation status:', error);
    res.status(500).json({ success: false, message: 'Error updating sea quotation status', error: error.message });
  } finally {
    client.release();
  }
};

// Admin triggers sending sea quotation email manually
const triggerSeaQuotationEmail = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    const adminId = req.user?.id;
    if (!quotationId) return res.status(400).json({ success: false, message: 'Invalid sea quotation ID' });

    const { rows } = await client.query(
      `SELECT q.id, q.quote_no, q.subject, q.pol, q.pod, q.incoterms, q.actual_weight, q.status, q.final_total, q.total_ocean_freight_currency,
              c.id AS customer_id, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address
       FROM sea_export_quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       WHERE q.id=$1`,
      [quotationId]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Sea quotation not found' });

    const quotation = rows[0];

    if (quotation.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft sea quotations can be emailed.' });
    }

    const { rows: packages } = await client.query(`SELECT length, width, height, same_size FROM sea_export_quotation_packages WHERE quotation_id=$1`, [quotationId]);
    quotation.packages = packages;

    const { rows: charges } = await client.query(`SELECT charge_name, type, amount, rate_per_kg, weight_kg, currency, exchange_rate, remarks FROM sea_export_quotation_charges WHERE quotation_id=$1`, [quotationId]);
    quotation.charges = charges;

    await sendQuotationMail(quotation.customer_email, quotation);

    await client.query(`UPDATE sea_export_quotations SET status = 'sent', status_updated_by = $1, status_updated_at = NOW(), updated_at = NOW() WHERE id = $2`, [adminId, quotationId]);

    res.json({ success: true, message: 'Sea quotation email triggered successfully', data: { quotationId } });
  } catch (error) {
    console.error('Error triggering sea quotation email:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger sea quotation email', error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { updateSeaQuotationStatus, triggerSeaQuotationEmail };
