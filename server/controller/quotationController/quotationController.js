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

    // ✅ Validation for required fields
    const errors = [];
    
    if (!subject || subject.trim() === '') {
      errors.push('Subject is required');
    }
    
    if (!customer_id || sanitizeNumber(customer_id) === null) {
      errors.push('Customer ID is required and must be a valid number');
    }
    
    if (!agent_id || sanitizeNumber(agent_id) === null) {
      errors.push('Agent ID is required and must be a valid number');
    }
    
    if (!address || address.trim() === '') {
      errors.push('Address is required');
    }
    
    if (!origin || origin.trim() === '') {
      errors.push('Origin is required');
    }
    
    if (!destination || destination.trim() === '') {
      errors.push('Destination is required');
    }
    
    if (!actual_weight || sanitizeNumber(actual_weight) === null || sanitizeNumber(actual_weight) <= 0) {
      errors.push('Actual weight is required and must be a positive number');
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

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
      if (pkg.length || pkg.width || pkg.height || pkg.weight) {
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
    }

    // Step 4: Insert charges
    for (let chg of charges) {
      if (chg.charge_name || chg.amount) {
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
             q.packages_count, q.created_by, q.status, q.created_at, q.updated_at
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

// Get QUotation by ID
const getQuotationById = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) {
      return res.status(400).json({ success: false, message: "Invalid quotation ID" });
    }

    const { rows: quotations } = await client.query(
      `SELECT id, quote_no, subject, customer_id, agent_id, address, origin, destination, 
              actual_weight, volume_weight, packages_count, created_by, created_at, updated_at
       FROM courier_export_quotations
       WHERE id = $1`,
      [quotationId]
    );

    if (quotations.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }

    const quotation = quotations[0];

    const { rows: packages } = await client.query(
      `SELECT id, length, width, height, weight 
       FROM courier_export_quotation_packages
       WHERE quotation_id = $1`,
      [quotationId]
    );
    quotation.packages = packages;

    const { rows: charges } = await client.query(
      `SELECT id, charge_name, type, amount, description 
       FROM courier_export_quotation_charges
       WHERE quotation_id = $1`,
      [quotationId]
    );
    quotation.charges = charges;

    res.json({
      success: true,
      message: "Quotation fetched successfully",
      data: quotation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching quotation", error: error.message });
  } finally {
    client.release();
  }
};

// Update Quotation
// const updateQuotation = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const quotationId = sanitizeNumber(req.params.id);
//     if (!quotationId) {
//       return res.status(400).json({ success: false, message: "Invalid quotation ID" });
//     }

//     const {
//       subject,
//       customer_id,
//       agent_id,
//       address,
//       origin,
//       destination,
//       actual_weight,
//       packages = [],
//       charges = []
//     } = req.body;

//     const volumeFactor = 5000;
//     let totalVolumeWeight = packages.reduce((sum, pkg) => {
//       const l = sanitizeNumber(pkg.length) || 0;
//       const w = sanitizeNumber(pkg.width) || 0;
//       const h = sanitizeNumber(pkg.height) || 0;
//       return sum + (l * w * h) / volumeFactor;
//     }, 0);

//     const packages_count = packages.length;

//     await client.query('BEGIN');

//     // Update main quotation
//     const updateQuotationQuery = `
//       UPDATE courier_export_quotations
//       SET subject = $1,
//           customer_id = $2,
//           agent_id = $3,
//           address = $4,
//           origin = $5,
//           destination = $6,
//           actual_weight = $7,
//           volume_weight = $8,
//           packages_count = $9,
//           updated_at = NOW()
//       WHERE id = $10
//     `;
//     await client.query(updateQuotationQuery, [
//       subject || null,
//       sanitizeNumber(customer_id),
//       sanitizeNumber(agent_id),
//       address || null,
//       origin || null,
//       destination || null,
//       sanitizeNumber(actual_weight),
//       sanitizeNumber(totalVolumeWeight),
//       sanitizeNumber(packages_count),
//       quotationId
//     ]);

//     // Delete existing packages & insert new ones
//     await client.query(`DELETE FROM courier_export_quotation_packages WHERE quotation_id = $1`, [quotationId]);
//     for (let pkg of packages) {
//       if (pkg.length || pkg.width || pkg.height || pkg.weight) {
//         await client.query(
//           `INSERT INTO courier_export_quotation_packages (quotation_id, length, width, height, weight)
//            VALUES ($1, $2, $3, $4, $5)`,
//           [
//             quotationId,
//             sanitizeNumber(pkg.length),
//             sanitizeNumber(pkg.width),
//             sanitizeNumber(pkg.height),
//             sanitizeNumber(pkg.weight)
//           ]
//         );
//       }
//     }

//     // Delete existing charges & insert new ones
//     await client.query(`DELETE FROM courier_export_quotation_charges WHERE quotation_id = $1`, [quotationId]);
//     for (let chg of charges) {
//       if (chg.charge_name || chg.amount) {
//         await client.query(
//           `INSERT INTO courier_export_quotation_charges (quotation_id, charge_name, type, amount, description)
//            VALUES ($1, $2, $3, $4, $5)`,
//           [
//             quotationId,
//             chg.charge_name || null,
//             chg.type || null,
//             sanitizeNumber(chg.amount),
//             chg.description || null
//           ]
//         );
//       }
//     }

//     await client.query('COMMIT');

//     res.json({
//       success: true,
//       message: "Quotation updated successfully",
//       data: { quotationId, totalVolumeWeight, packages_count }
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error(error);
//     res.status(500).json({ success: false, message: "Error updating quotation", error: error.message });
//   } finally {
//     client.release();
//   }
// };

const updateQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) {
      return res.status(400).json({ success: false, message: "Invalid quotation ID" });
    }

    const {
      subject,
      customer_id,
      agent_id,
      address,
      origin,
      destination,
      actual_weight,
      packages,
      charges  
    } = req.body;

    await client.query('BEGIN');

    // --- 1. Update only provided fields ---
    const fields = [];
    const values = [];
    let idx = 1;

    if (subject !== undefined) { fields.push(`subject=$${idx++}`); values.push(subject); }
    if (customer_id !== undefined) { fields.push(`customer_id=$${idx++}`); values.push(sanitizeNumber(customer_id)); }
    if (agent_id !== undefined) { fields.push(`agent_id=$${idx++}`); values.push(sanitizeNumber(agent_id)); }
    if (address !== undefined) { fields.push(`address=$${idx++}`); values.push(address); }
    if (origin !== undefined) { fields.push(`origin=$${idx++}`); values.push(origin); }
    if (destination !== undefined) { fields.push(`destination=$${idx++}`); values.push(destination); }
    if (actual_weight !== undefined) { fields.push(`actual_weight=$${idx++}`); values.push(sanitizeNumber(actual_weight)); }

    if (fields.length > 0) {
      fields.push(`updated_at=NOW()`);
      values.push(quotationId);
      await client.query(
        `UPDATE courier_export_quotations SET ${fields.join(", ")} WHERE id=$${idx}`,
        values
      );
    }

    // --- 2. Update packages only if provided ---
    if (Array.isArray(packages)) {
      // recalc volume + package count
      const volumeFactor = 5000;
      const totalVolumeWeight = packages.reduce((sum, pkg) => {
        const l = sanitizeNumber(pkg.length) || 0;
        const w = sanitizeNumber(pkg.width) || 0;
        const h = sanitizeNumber(pkg.height) || 0;
        return sum + (l * w * h) / volumeFactor;
      }, 0);

      const packages_count = packages.length;

      // delete + insert fresh
      await client.query(`DELETE FROM courier_export_quotation_packages WHERE quotation_id=$1`, [quotationId]);
      for (let pkg of packages) {
        if (pkg.length || pkg.width || pkg.height || pkg.weight) {
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
      }

      // update volume + count in quotation
      await client.query(
        `UPDATE courier_export_quotations SET volume_weight=$1, packages_count=$2 WHERE id=$3`,
        [sanitizeNumber(totalVolumeWeight), sanitizeNumber(packages_count), quotationId]
      );
    }

    // --- 3. Update charges only if provided ---
    if (Array.isArray(charges)) {
      await client.query(`DELETE FROM courier_export_quotation_charges WHERE quotation_id=$1`, [quotationId]);
      for (let chg of charges) {
        if (chg.charge_name || chg.amount) {
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
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Quotation updated successfully",
      data: { quotationId }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating quotation", error: error.message });
  } finally {
    client.release();
  }
};


module.exports = {createQuotation,  getAllQuotations, getQuotationById, updateQuotation};
