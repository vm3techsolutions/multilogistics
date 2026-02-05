const pool = require('../../config/db');
const dayjs = require('dayjs');

async function generateCargoQuoteNumber() {
  const today = dayjs().format('YYYY-MM-DD');
  const { rows } = await pool.query(
    `SELECT quote_no FROM cargo_export_quotations
     WHERE DATE(created_at) = $1
     ORDER BY id DESC
     LIMIT 1`,
    [today]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastQuote = rows[0].quote_no; // CARGO-YYYYMMDD-XXX
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

// Create Cargo Quotation
const createCargoQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      subject,
      customer_id,
      agent_id,
      address,
      attention,
      pol, // Port of Loading
      pod, // Port of Discharge
      incoterms,
      actual_weight,
      created_by,
      packages = [], // [{length, width, height, same_size}]
      charges = []   // [{charge_name, type, rate_per_kg, weight_kg, amount, description}]
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

    if (!pol || pol.trim() === '') {
      errors.push('Port of Loading (POL) is required');
    }

    if (!pod || pod.trim() === '') {
      errors.push('Port of Discharge (POD) is required');
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

    // --- Step 1: Calculate total volumetric weight ---
    const volumeFactor = 6000;
    let totalVolumeWeight = 0;
    for (let pkg of packages) {
      const l = sanitizeNumber(pkg.length);
      const w = sanitizeNumber(pkg.width);
      const h = sanitizeNumber(pkg.height);
      const sameSize = sanitizeNumber(pkg.same_size || 1);

      const volWeight = (l * w * h) / volumeFactor;
      const totalPkgWeight = volWeight * sameSize;

      totalVolumeWeight += totalPkgWeight;
    }

    // --- Step 2: Determine chargeable weight (max of actual and volumetric) ---
    let chargeable_weight = Math.max(sanitizeNumber(actual_weight), totalVolumeWeight);
    chargeable_weight = Number(chargeable_weight.toFixed(2)); // ✅ Rounded

    // --- Step 3: Calculate Freight charges ---
    let totalFreight = 0;
    let destinationCharge = 0;
    let clearanceCharge = 0;
  
    for (const chg of charges) {
      if (chg.type === 'freight') {
        const rate = sanitizeNumber(chg.rate_per_kg);
        chg.amount = chargeable_weight * rate;
        totalFreight += chg.amount;
      }
      else if (chg.type === 'destination') {
        destinationCharge += sanitizeNumber(chg.amount);
      }
      else if (chg.type === 'clearance') {
        clearanceCharge += sanitizeNumber(chg.amount);
      }
    }

    /* ================================
   Step 4: Apply CCF (2%)
================================ */
    const CCF_PERCENTAGE = 2;
    const ccfAmount = Number(((totalFreight * CCF_PERCENTAGE) / 100).toFixed(2));

    const totalFreightWithCCF = totalFreight + ccfAmount;

    /* ================================
          Step 5: Total Before GST
       ================================ */
    const total = totalFreightWithCCF + destinationCharge + clearanceCharge;

    // Step 6: Apply GST (18%)
    const gstPercentage = 18;
    const gstAmount = (total * gstPercentage) / 100;
    const finalTotal = total + gstAmount;

    const packages_count = packages.length;
    const quote_no = await generateCargoQuoteNumber();

    await client.query('BEGIN');

    // --- Insert quotation ---
    const insertQuotationQuery = `
     INSERT INTO cargo_export_quotations 
  (quote_no, subject, customer_id, agent_id, address, attention, pol, pod, incoterms, actual_weight, volume_weight, chargeable_weight, packages_count, total_freight_amount, total, final_total, created_by, created_at, updated_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
  RETURNING id;
    `;
    const quotationValues = [
      quote_no,
      subject,
      sanitizeNumber(customer_id),
      sanitizeNumber(agent_id),
      address,
      attention || null,
      pol,
      pod,
      incoterms || null,
      sanitizeNumber(actual_weight),
      totalVolumeWeight,
      chargeable_weight,
      packages_count,
      totalFreightWithCCF,
      total,
      finalTotal,
      sanitizeNumber(created_by),
    ];
    const { rows } = await client.query(insertQuotationQuery, quotationValues);
    const quotationId = rows[0].id;

    // --- Insert packages ---
    for (let pkg of packages) {
      await client.query(
        `INSERT INTO cargo_export_quotation_packages (quotation_id, length, width, height, same_size)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          quotationId,
          sanitizeNumber(pkg.length),
          sanitizeNumber(pkg.width),
          sanitizeNumber(pkg.height),
          sanitizeNumber(pkg.same_size)
        ]
      );
    }

    // --- Insert charges (freight + destination + clearance) ---
    for (let chg of charges) {
      const chargeName = (chg.charge_name || "").trim().toLowerCase();

      await client.query(
        `INSERT INTO cargo_export_quotation_charges
         (quotation_id, charge_name, type, rate_per_kg, weight_kg, amount, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          quotationId,
          chg.charge_name || null,
          chg.type || null,
          sanitizeNumber(chg.rate_per_kg),
          chargeable_weight,
          sanitizeNumber(chg.amount),
          chg.description || null
        ]
      );
    }

    // --- Insert CCF charge ---
    if (ccfAmount > 0) {
      await client.query(
        `INSERT INTO cargo_export_quotation_charges
         (quotation_id, charge_name, type, rate_per_kg, weight_kg, amount, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          quotationId,
          'CCF',
          'freight',
          null,
          null,
          ccfAmount,
          'Cargo Consolidation Fee (2%)'
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Cargo quotation created successfully",
      data: {
        quotationId,
        quote_no,
        actual_weight,
        totalVolumeWeight,
        chargeable_weight,
        totalFreightWithCCF,
        total,
        finalTotal
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating cargo quotation", error: error.message });
  } finally {
    client.release();
  }
};

// Get Cargo Quotation by Quote Number
const getCargoQuotationByQuoteNo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { quote_no } = req.params;
    if (!quote_no) {
      return res.status(400).json({ success: false, message: "Quotation number is required" });
    }

    // ✅ FETCH quotation + customer info
    const { rows: quotations } = await client.query(
      `SELECT q.id, q.quote_no, q.subject, q.customer_id, q.agent_id, q.address, 
              q.attention, q.pol, q.pod, q.incoterms, q.actual_weight, q.volume_weight, q.chargeable_weight,
              q.packages_count, q.created_by, q.status, q.total_freight_amount, q.total, q.final_total, q.created_at,
              q.status_updated_by, q.status_updated_at, q.updated_at,
              c.name AS customer_name,
              c.email AS customer_email,
              c.phone AS customer_phone,
              c.address AS customer_address
       FROM cargo_export_quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       WHERE q.quote_no = $1`,
      [quote_no]
    );

    if (quotations.length === 0) {
      return res.status(404).json({ success: false, message: "Cargo quotation not found" });
    }

    const quotation = quotations[0];

    // ✅ FETCH packages
    const { rows: packages } = await client.query(
      `SELECT id, length, width, height, same_size 
       FROM cargo_export_quotation_packages
       WHERE quotation_id = $1`,
      [quotation.id]
    );
    quotation.packages = packages;

    // ✅ FETCH charges
    const { rows: charges } = await client.query(
      `SELECT id, charge_name, type, rate_per_kg, weight_kg, amount, description 
       FROM cargo_export_quotation_charges
       WHERE quotation_id = $1`,
      [quotation.id]
    );
    quotation.charges = charges;

    // ✅ Attach customer object
    quotation.customer = {
      name: quotation.customer_name,
      email: quotation.customer_email,
      phone: quotation.customer_phone,
      address: quotation.customer_address
    };

    res.json({
      success: true,
      message: "Cargo quotation fetched successfully by quote number",
      data: quotation,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching cargo quotation by quote number",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Get all Cargo Quotations
const getAllCargoQuotations = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationsQuery = `
      SELECT q.id, q.quote_no, q.subject, q.customer_id, q.agent_id, q.address, 
             q.attention, q.pol, q.pod, q.incoterms, q.actual_weight, q.volume_weight, q.chargeable_weight,
             q.packages_count, q.created_by, q.status, q.total_freight_amount, q.total, q.final_total, 
             q.created_at, q.updated_at, q.status_updated_at
      FROM cargo_export_quotations q
      ORDER BY q.created_at DESC
    `;
    const { rows: quotations } = await client.query(quotationsQuery);

    // Optionally fetch packages & charges for each quotation
    for (let quotation of quotations) {
      const { rows: packages } = await client.query(
        `SELECT id, length, width, height, same_size 
         FROM cargo_export_quotation_packages 
         WHERE quotation_id = $1`,
        [quotation.id]
      );
      quotation.packages = packages;

      const { rows: charges } = await client.query(
        `SELECT id, charge_name, type, rate_per_kg, weight_kg, amount, description
         FROM cargo_export_quotation_charges 
         WHERE quotation_id = $1`,
        [quotation.id]
      );
      quotation.charges = charges;
    }

    res.json({
      success: true,
      message: "Cargo quotations fetched successfully",
      data: quotations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching cargo quotations", error: error.message });
  } finally {
    client.release();
  }
};

// Get Cargo Quotation by ID
const getCargoQuotationById = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) {
      return res.status(400).json({ success: false, message: "Invalid cargo quotation ID" });
    }

    const { rows: quotations } = await client.query(
      `SELECT id, quote_no, subject, customer_id, agent_id, address, attention,
              pol, pod, incoterms, actual_weight, volume_weight, chargeable_weight, packages_count, 
              total_freight_amount, total, final_total, created_by, status, status_updated_by, 
              status_updated_at, created_at, updated_at
       FROM cargo_export_quotations
       WHERE id = $1`,
      [quotationId]
    );

    if (quotations.length === 0) {
      return res.status(404).json({ success: false, message: "Cargo quotation not found" });
    }

    const quotation = quotations[0];

    const { rows: packages } = await client.query(
      `SELECT id, length, width, height, same_size 
       FROM cargo_export_quotation_packages
       WHERE quotation_id = $1`,
      [quotationId]
    );
    quotation.packages = packages;

    const { rows: charges } = await client.query(
      `SELECT id, charge_name, type, rate_per_kg, weight_kg, amount, description 
       FROM cargo_export_quotation_charges
       WHERE quotation_id = $1`,
      [quotationId]
    );
    quotation.charges = charges;

    res.json({
      success: true,
      message: "Cargo quotation fetched successfully",
      data: quotation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching cargo quotation", error: error.message });
  } finally {
    client.release();
  }
};

// Update Cargo Quotation
const updateCargoQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) {
      return res.status(400).json({ success: false, message: "Invalid cargo quotation ID" });
    }

    const {
      subject,
      customer_id,
      agent_id,
      address,
      attention,
      pol,
      pod,
      incoterms,
      actual_weight,
      packages = [],
      charges = []
    } = req.body;

    // Use authenticated user for updated_by
    const updated_by = req.user && req.user.id ? req.user.id : null;

    // --- Validation ---
    const errors = [];
    if (!subject || subject.trim() === '') errors.push("Subject is required");
    if (!customer_id) errors.push("Customer ID is required");
    if (!agent_id) errors.push("Agent ID is required");
    if (!address || address.trim() === '') errors.push("Address is required");
    if (!pol || pol.trim() === '') errors.push("Port of Loading (POL) is required");
    if (!pod || pod.trim() === '') errors.push("Port of Discharge (POD) is required");
    if (!actual_weight || sanitizeNumber(actual_weight) <= 0) errors.push("Actual weight is required");
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // --- Step 1: Calculate total volumetric weight ---
    const volumeFactor = 6000;
    let totalVolumeWeight = 0;
    for (let pkg of packages) {
      const l = sanitizeNumber(pkg.length);
      const w = sanitizeNumber(pkg.width);
      const h = sanitizeNumber(pkg.height);
      const sameSize = sanitizeNumber(pkg.same_size || 1);

      const volWeight = (l * w * h) / volumeFactor;
      const totalPkgWeight = volWeight * sameSize;

      totalVolumeWeight += totalPkgWeight;
    }

    // --- Step 2: Determine chargeable weight ---
    let chargeable_weight = Math.max(sanitizeNumber(actual_weight), totalVolumeWeight);
    chargeable_weight = Number(chargeable_weight.toFixed(2));

    // --- Step 3: Calculate charges ---
    let totalFreight = 0;
    let destinationCharge = 0;
    let clearanceCharge = 0;

    for (let chg of charges) {
      const chargeName = (chg.charge_name || "").toLowerCase();



      if (chg.type === 'freight') {
        const rate = sanitizeNumber(chg.rate_per_kg);
        const freightAmount = chargeable_weight * rate;
        chg.amount = freightAmount;
        totalFreight += freightAmount;
      } else if (chg.type === 'destination') {
        destinationCharge += sanitizeNumber(chg.amount);
      } else if (chg.type === 'clearance') {
        clearanceCharge += sanitizeNumber(chg.amount);
      }
    }

    const CCF_PERCENTAGE = 2;
    const ccfAmount = Number(((totalFreight * CCF_PERCENTAGE) / 100).toFixed(2));
    const totalFreightWithCCF = totalFreight + ccfAmount;
    const total = totalFreightWithCCF + destinationCharge + clearanceCharge;
    const gstPercentage = 18;
    const gstAmount = (total * gstPercentage) / 100;
    const finalTotal = total + gstAmount;

    const packages_count = packages.length;

    await client.query('BEGIN');

    // Update main quotation (also set status back to 'draft' when edited)
    const updateQuotationQuery = `
      UPDATE cargo_export_quotations
      SET subject = $1,
          customer_id = $2,
          agent_id = $3,
          address = $4,
          attention = $5,
          pol = $6,
          pod = $7,
          incoterms = $8,
          actual_weight = $9,
          volume_weight = $10,
          chargeable_weight = $11,
          packages_count = $12,
          total_freight_amount = $13,
          total = $14,
          final_total = $15,
          status = 'draft',
          status_updated_by = $16,
          status_updated_at = NOW(),
          updated_by = $17,
          updated_at = NOW()
      WHERE id = $18
    `;
    await client.query(updateQuotationQuery, [
      subject || null,
      sanitizeNumber(customer_id),
      sanitizeNumber(agent_id),
      address || null,
      attention || null,
      pol || null,
      pod || null,
      incoterms || null,
      sanitizeNumber(actual_weight),
      totalVolumeWeight,
      chargeable_weight,
      packages_count,
      totalFreightWithCCF,
      total,
      finalTotal,
      sanitizeNumber(updated_by),
      sanitizeNumber(updated_by),
      quotationId
    ]);

    // Delete existing packages & insert new ones
    await client.query(`DELETE FROM cargo_export_quotation_packages WHERE quotation_id = $1`, [quotationId]);
    for (let pkg of packages) {
      await client.query(
        `INSERT INTO cargo_export_quotation_packages (quotation_id, length, width, height, same_size)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          quotationId,
          sanitizeNumber(pkg.length),
          sanitizeNumber(pkg.width),
          sanitizeNumber(pkg.height),
          sanitizeNumber(pkg.same_size)
        ]
      );
    }

    // Delete existing charges & insert new ones
    await client.query(`DELETE FROM cargo_export_quotation_charges WHERE quotation_id = $1`, [quotationId]);
    for (let chg of charges) {
      const chargeName = (chg.charge_name || "").trim().toLowerCase();

      await client.query(
        `INSERT INTO cargo_export_quotation_charges (quotation_id, charge_name, type, rate_per_kg, weight_kg, amount, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          quotationId,
          chg.charge_name || null,
          chg.type || null,
          sanitizeNumber(chg.rate_per_kg),
          chargeable_weight,
          sanitizeNumber(chg.amount),
          chg.description || null
        ]
      );
    }

    if (ccfAmount > 0) {
      await client.query(
        `INSERT INTO cargo_export_quotation_charges
         (quotation_id, charge_name, type, rate_per_kg, weight_kg, amount, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          quotationId,
          'CCF',
          'freight',
          null,
          null,
          ccfAmount,
          'Cargo Consolidation Fee (2%)'
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Cargo quotation updated successfully",
      data: {
        quotationId,
        actual_weight,
        totalVolumeWeight,
        chargeable_weight,
        totalFreightWithCCF,
        total,
        finalTotal,
        status: 'draft'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating cargo quotation", error: error.message });
  } finally {
    client.release();
  }
};


// Delete Cargo Quotation
const deleteCargoQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) {
      return res.status(400).json({ success: false, message: "Invalid cargo quotation ID" });
    }

    await client.query('BEGIN');

    // Delete packages
    await client.query(`DELETE FROM cargo_export_quotation_packages WHERE quotation_id = $1`, [quotationId]);

    // Delete charges
    await client.query(`DELETE FROM cargo_export_quotation_charges WHERE quotation_id = $1`, [quotationId]);

    // Delete quotation
    const deleteQuery = `
      DELETE FROM cargo_export_quotations
      WHERE id = $1
      RETURNING id, quote_no
    `;

    const result = await client.query(deleteQuery, [quotationId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Cargo quotation not found" });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Cargo quotation deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting cargo quotation", error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  createCargoQuotation,
  getCargoQuotationByQuoteNo,
  getAllCargoQuotations,
  getCargoQuotationById,
  updateCargoQuotation,
  
};
