const pool = require('../../config/db');
const dayjs = require('dayjs');

async function generateQuoteNumber() {
  const today = dayjs().format('YYYY-MM-DD');
  const { rows } = await pool.query(
    `SELECT quote_no FROM courier_export_quotations
     WHERE DATE(created_at) = $1
     ORDER BY id DESC
     LIMIT 1`, 
    [today]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastQuote = rows[0].quote_no; // QTN-YYYYMMDD-XXX
    const lastSeq = parseInt(lastQuote.split('-')[2], 10);
    sequence = lastSeq + 1;
  }

  const datePart = dayjs().format('YYYYMMDD');
  return `QTN-${datePart}-${String(sequence).padStart(3, '0')}`;
}

const sanitizeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return isNaN(value) ? null : Number(value);
};

const createQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      subject,
      customer_id,
      agent_id,
      address,
      origin,
      destination,
      actual_weight,
      created_by,
      packages = [], // array of { length, width, height, weight }
      charges = []   // array of { charge_name, type, amount, description }
    } = req.body;

    // Auto-calculate volume weight
    const volumeFactor = 5000; // adjust as needed
    let totalVolumeWeight = packages.reduce((sum, pkg) => {
      const l = sanitizeNumber(pkg.length) || 0;
      const w = sanitizeNumber(pkg.width) || 0;
      const h = sanitizeNumber(pkg.height) || 0;
      return sum + (l * w * h) / volumeFactor;
    }, 0);

    const packages_count = packages.length;

    // Step 1: Generate quote number
    const quote_no = await generateQuoteNumber();

    await client.query('BEGIN');

    // Step 2: Insert into quotations
    const insertQuotationQuery = `
      INSERT INTO courier_export_quotations 
      (quote_no, subject, customer_id, agent_id, address, origin, destination, actual_weight, volume_weight, packages_count, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `;
    const quotationValues = [
      quote_no,
      subject || null,
      sanitizeNumber(customer_id),
      sanitizeNumber(agent_id),
      address || null,
      origin || null,
      destination || null,
      sanitizeNumber(actual_weight),
      sanitizeNumber(totalVolumeWeight),
      sanitizeNumber(packages_count),
      sanitizeNumber(created_by)
    ];
    const quotationResult = await client.query(insertQuotationQuery, quotationValues);
    const quotationId = quotationResult.rows[0].id;

    // Step 3: Insert packages
    for (let pkg of packages) {
      await client.query(
        `INSERT INTO courier_export_quotation_packages (quotation_id, length, width, height, weight)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          quotationId,
          sanitizeNumber(pkg.length),
          sanitizeNumber(pkg.width),
          sanitizeNumber(pkg.height),
          sanitizeNumber(pkg.weight)
        ]
      );
    }

    // Step 4: Insert charges
    for (let chg of charges) {
      await client.query(
        `INSERT INTO courier_export_quotation_charges (quotation_id, charge_name, type, amount, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          quotationId,
          chg.charge_name || null,
          chg.type || null,
          sanitizeNumber(chg.amount),
          chg.description || null
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Quotation created successfully",
      data: { quotationId, quote_no, totalVolumeWeight, packages_count }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating quotation", error: error.message });
  } finally {
    client.release();
  }
};

// ✅ Get all quotations
const getAllQuotations = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationsQuery = `
      SELECT q.id, q.quote_no, q.subject, q.customer_id, q.agent_id, q.address, 
             q.origin, q.destination, q.actual_weight, q.volume_weight, 
             q.packages_count, q.created_by, q.created_at, q.updated_at
      FROM courier_export_quotations q
      ORDER BY q.created_at DESC
    `;
    const { rows: quotations } = await client.query(quotationsQuery);

    // Optionally fetch packages & charges for each quotation
    for (let quotation of quotations) {
      const { rows: packages } = await client.query(
        `SELECT id, length, width, height, weight 
         FROM courier_export_quotation_packages 
         WHERE quotation_id = $1`,
        [quotation.id]
      );
      quotation.packages = packages;

      const { rows: charges } = await client.query(
        `SELECT id, charge_name, type, amount, description
         FROM courier_export_quotation_charges 
         WHERE quotation_id = $1`,
        [quotation.id]
      );
      quotation.charges = charges;
    }

    res.json({
      success: true,
      message: "Quotations fetched successfully",
      data: quotations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching quotations", error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {createQuotation,  getAllQuotations};
