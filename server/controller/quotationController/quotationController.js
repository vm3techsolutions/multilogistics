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

// const createQuotation = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const {
//       subject,
//       customer_id,
//       agent_id,
//       address,
//       origin,
//       destination,
//       actual_weight,
//       created_by,
//       packages = [], // array of { length, width, height, weight }
//       charges = []   // array of { charge_name, type, amount, description }
//     } = req.body;

//     // ✅ Validation for required fields
//     const errors = [];

//     if (!subject || subject.trim() === '') {
//       errors.push('Subject is required');
//     }

//     if (!customer_id || sanitizeNumber(customer_id) === null) {
//       errors.push('Customer ID is required and must be a valid number');
//     }

//     if (!agent_id || sanitizeNumber(agent_id) === null) {
//       errors.push('Agent ID is required and must be a valid number');
//     }

//     if (!address || address.trim() === '') {
//       errors.push('Address is required');
//     }

//     if (!origin || origin.trim() === '') {
//       errors.push('Origin is required');
//     }

//     if (!destination || destination.trim() === '') {
//       errors.push('Destination is required');
//     }

//     if (!actual_weight || sanitizeNumber(actual_weight) === null || sanitizeNumber(actual_weight) <= 0) {
//       errors.push('Actual weight is required and must be a positive number');
//     }

//     // Return validation errors if any
//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors
//       });
//     }

//     // Auto-calculate volume weight
//     const volumeFactor = 5000; // adjust as needed
//     let totalVolumeWeight = packages.reduce((sum, pkg) => {
//       const l = sanitizeNumber(pkg.length) || 0;
//       const w = sanitizeNumber(pkg.width) || 0;
//       const h = sanitizeNumber(pkg.height) || 0;
//       return sum + (l * w * h) / volumeFactor;
//     }, 0);

//     const packages_count = packages.length;

//     // Step 1: Generate quote number
//     const quote_no = await generateQuoteNumber();

//     await client.query('BEGIN');

//     // Step 2: Insert into quotations
//     const insertQuotationQuery = `
//       INSERT INTO courier_export_quotations 
//       (quote_no, subject, customer_id, agent_id, address, origin, destination, actual_weight, volume_weight, packages_count, created_by, created_at, updated_at)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
//       RETURNING id
//     `;
//     const quotationValues = [
//       quote_no,
//       subject || null,
//       sanitizeNumber(customer_id),
//       sanitizeNumber(agent_id),
//       address || null,
//       origin || null,
//       destination || null,
//       sanitizeNumber(actual_weight),
//       sanitizeNumber(totalVolumeWeight),
//       sanitizeNumber(packages_count),
//       sanitizeNumber(created_by)
//     ];
//     const quotationResult = await client.query(insertQuotationQuery, quotationValues);
//     const quotationId = quotationResult.rows[0].id;

//     // Step 3: Insert packages
//     for (let pkg of packages) {
//       if (pkg.length || pkg.width || pkg.height || pkg.weight) {
//       await client.query(
//         `INSERT INTO courier_export_quotation_packages (quotation_id, length, width, height, weight)
//          VALUES ($1, $2, $3, $4, $5)`,
//         [
//           quotationId,
//           sanitizeNumber(pkg.length),
//           sanitizeNumber(pkg.width),
//           sanitizeNumber(pkg.height),
//           sanitizeNumber(pkg.weight)
//         ]
//       );
//     }
//     }

//     // Step 4: Insert charges
//     for (let chg of charges) {
//       if (chg.charge_name || chg.amount) {
//       await client.query(
//         `INSERT INTO courier_export_quotation_charges (quotation_id, charge_name, type, amount, description)
//          VALUES ($1, $2, $3, $4, $5)`,
//         [
//           quotationId,
//           chg.charge_name || null,
//           chg.type || null,
//           sanitizeNumber(chg.amount),
//           chg.description || null
//         ]
//       );
//     }
//     }

//     await client.query('COMMIT');

//     res.json({
//       success: true,
//       message: "Quotation created successfully",
//       data: { quotationId, quote_no, totalVolumeWeight, packages_count }
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error(error);
//     res.status(500).json({ success: false, message: "Error creating quotation", error: error.message });
//   } finally {
//     client.release();
//   }
// };


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
      packages = [], // [{length,width,height,same_size}]
      charges = []   // [{charge_name,type,rate_per_kg,weight_kg,amount,description}]
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


    // --- Step 1: Calculate total volumetric weight ---
    const volumeFactor = 5000;
    let totalVolumeWeight = 0;
    for (let pkg of packages) {
      const l = sanitizeNumber(pkg.length);
      const w = sanitizeNumber(pkg.width);
      const h = sanitizeNumber(pkg.height);
      const sameSize = sanitizeNumber(pkg.same_size || 1); //1

      const volWeight = (l * w * h) / volumeFactor;
      const totalPkgWeight = volWeight * sameSize; //2

      // totalVolumeWeight += volWeight;
      totalVolumeWeight += totalPkgWeight;
    }

    // --- Step 2: Determine chargeable weight (max of actual and volumetric) ---
    let chargeable_weight = Math.max(sanitizeNumber(actual_weight), totalVolumeWeight);
    chargeable_weight = Number(chargeable_weight.toFixed(2)); // ✅ Rounded


    // --- Step 3: Calculate Freight charges ---
    // Only charges with type = 'freight' will be multiplied by chargeable_weight
    let totalFreight = 0;
    let destinationCharge = 0;
    let fscPercentage = 0;

    for (let chg of charges) {
      const chargeName = (chg.charge_name || "").toLowerCase();

      // --- Handle FSC separately ---
      if (chargeName === "fsc") {
        // FSC may be provided as either "rate_per_kg" or "amount" (percentage)
        fscPercentage = sanitizeNumber(chg.rate_per_kg || chg.amount || 0);
        continue; // skip inserting now; we will insert FSC later with computed amount
      }
      if (chg.type === 'freight') {
        const rate = sanitizeNumber(chg.rate_per_kg);
        const freightAmount = chargeable_weight * rate;
        chg.amount = freightAmount;
        totalFreight += freightAmount;
      } else if (chg.type === 'destination') {
        destinationCharge += sanitizeNumber(chg.amount);
      }

    }

    // Step 4: Add FSC (Fuel Surcharge) - 20% of total freight
    // const fscPercentage = 23.50;
    // const fscAmount = (totalFreight * fscPercentage) / 100;
    if (fscPercentage > 0) {
      fscAmount = (totalFreight * fscPercentage) / 100;
    }


    // Total freight including FSC (but NOT destination)
    const totalFreightWithFSC = totalFreight + fscAmount;

    // Step 5: Add destination charge to get total before GST
    const total = totalFreightWithFSC + destinationCharge;

    // Step 6: Apply GST (18%)
    const gstPercentage = 18;
    const gstAmount = (total * gstPercentage) / 100;
    const finalTotal = total + gstAmount;

    const packages_count = packages.length;
    const quote_no = await generateQuoteNumber();

    await client.query('BEGIN');


    // --- Insert quotation ---
    const insertQuotationQuery = `
     INSERT INTO courier_export_quotations 
  (quote_no, subject, customer_id, agent_id, address, origin, destination, actual_weight, volume_weight, chargeable_weight, packages_count, total_freight_amount, total, final_total, created_by, created_at, updated_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
  RETURNING id;
    `;
    const quotationValues = [
      quote_no,
      subject,
      sanitizeNumber(customer_id),
      sanitizeNumber(agent_id),
      address,
      origin,
      destination,
      sanitizeNumber(actual_weight),
      totalVolumeWeight,
      chargeable_weight,
      packages_count,
      totalFreightWithFSC,
      total,
      finalTotal,
      sanitizeNumber(created_by),
    ];
    const { rows } = await client.query(insertQuotationQuery, quotationValues);
    const quotationId = rows[0].id;

    // --- Insert packages ---
    for (let pkg of packages) {
      await client.query(
        `INSERT INTO courier_export_quotation_packages (quotation_id, length, width, height, same_size)
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

    // --- Insert charges (freight + destination) ---
    for (let chg of charges) {
      const chargeName = (chg.charge_name || "").trim().toLowerCase();
      if (chargeName === "fsc") continue; // skip, we’ll insert manually

      await client.query(
        `INSERT INTO courier_export_quotation_charges
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


    // --- Insert FSC charge separately ---
    if (fscPercentage > 0) {
      await client.query(
        `INSERT INTO courier_export_quotation_charges
     (quotation_id, charge_name, type, weight_kg, amount, description)
     VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          quotationId,
          "FSC",
          "freight",
          chargeable_weight,
          fscPercentage,
          "Fuel Surcharge (" + fscPercentage + "%)"
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Quotation created successfully",
      data: {
        quotationId,
        quote_no,
        actual_weight,
        totalVolumeWeight,
        chargeable_weight,
        totalFreightWithFSC,
        total,
        finalTotal
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating quotation", error: error.message });
  } finally {
    client.release();
  }
};
// ✅ Get quotation by quote number (for export auto-fill)
const getQuotationByQuoteNo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { quote_no } = req.params;
    if (!quote_no) {
      return res.status(400).json({ success: false, message: "Quotation number is required" });
    }

    // ✅ FETCH quotation + customer info
    const { rows: quotations } = await client.query(
      `SELECT q.id, q.quote_no, q.subject, q.customer_id, q.agent_id, q.address, 
              q.origin, q.destination, q.actual_weight, q.volume_weight, 
              q.packages_count, q.created_by, q.status, q.created_at,
              c.name AS customer_name,
              c.email AS customer_email,
              c.phone AS customer_phone,
              c.address AS customer_address
       FROM courier_export_quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       WHERE q.quote_no = $1`,
      [quote_no]
    );

    if (quotations.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }

    const quotation = quotations[0];

    // ✅ FETCH packages
    const { rows: packages } = await client.query(
      `SELECT id, length, width, height, same_size 
       FROM courier_export_quotation_packages
       WHERE quotation_id = $1`,
      [quotation.id]
    );
    quotation.packages = packages;

    // ✅ FETCH charges
    const { rows: charges } = await client.query(
      `SELECT id, charge_name, type, amount, description 
       FROM courier_export_quotation_charges
       WHERE quotation_id = $1`,
      [quotation.id]
    );
    quotation.charges = charges;

    // ✅ Attach customer object
    quotation.customer = {
      name: quotation.customer_name,
      email: quotation.customer_email,
      mobile: quotation.customer_mobile,
      address: quotation.customer_address
    };

    res.json({
      success: true,
      message: "Quotation fetched successfully by quote number",
      data: quotation,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching quotation by quote number",
      error: error.message,
    });
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
        `SELECT id, length, width, height, same_size 
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
      `SELECT id, length, width, height, same_size 
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
  const updated_by = req.user.id;

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
      packages = [],
      charges = []
    } = req.body;

    // --- Validation ---
    const errors = [];
    if (!subject || subject.trim() === '') errors.push("Subject is required");
    if (!customer_id) errors.push("Customer ID is required");
    if (!agent_id) errors.push("Agent ID is required");
    if (!address || address.trim() === '') errors.push("Address is required");
    if (!origin || origin.trim() === '') errors.push("Origin is required");
    if (!destination || destination.trim() === '') errors.push("Destination is required");
    if (!actual_weight || sanitizeNumber(actual_weight) <= 0) errors.push("Actual weight is required");
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    await client.query('BEGIN');

    // --- Step 1: Calculate volumetric weight ---
    const volumeFactor = 5000;
    let totalVolumeWeight = 0;
    for (let pkg of packages) {
      const l = sanitizeNumber(pkg.length);
      const w = sanitizeNumber(pkg.width);
      const h = sanitizeNumber(pkg.height);
      const sameSize = sanitizeNumber(pkg.same_size || 1);
      const volWeight = (l * w * h) / volumeFactor;
      totalVolumeWeight += volWeight * sameSize;
    }

    // --- Step 2: Chargeable weight ---
    let chargeable_weight = Math.max(sanitizeNumber(actual_weight), totalVolumeWeight);
    chargeable_weight = Number(chargeable_weight.toFixed(2));

    // --- Step 3: Calculate Charges ---
    let totalFreight = 0;
    let destinationCharge = 0;
    let fscPercentage = 0;

    for (let chg of charges) {
      const chargeName = (chg.charge_name || "").toLowerCase();
      if (chargeName === "fsc") {
        fscPercentage = sanitizeNumber(chg.rate_per_kg || chg.amount || 0);
        continue;
      }
      if (chg.type === "freight") {
        const rate = sanitizeNumber(chg.rate_per_kg);
        const freightAmount = chargeable_weight * rate;
        chg.amount = freightAmount;
        totalFreight += freightAmount;
      } else if (chg.type === "destination") {
        destinationCharge += sanitizeNumber(chg.amount);
      }
    }

    let fscAmount = 0;
    if (fscPercentage > 0) fscAmount = (totalFreight * fscPercentage) / 100;

    const totalFreightWithFSC = totalFreight + fscAmount;
    const total = totalFreightWithFSC + destinationCharge;
    const gstPercentage = 18;
    const gstAmount = (total * gstPercentage) / 100;
    const finalTotal = total + gstAmount;
    const packages_count = packages.length;

    // --- Step 4: Update main quotation ---
    const updateQuotationQuery = `
      UPDATE courier_export_quotations
      SET subject=$1, customer_id=$2, agent_id=$3, address=$4, origin=$5, destination=$6,
          actual_weight=$7, volume_weight=$8, chargeable_weight=$9, packages_count=$10,
          total_freight_amount=$11, total=$12, final_total=$13, updated_by=$14,
          status='draft', updated_at=NOW()
      WHERE id=$15
    `;
    await client.query(updateQuotationQuery, [
      subject,
      sanitizeNumber(customer_id),
      sanitizeNumber(agent_id),
      address,
      origin,
      destination,
      sanitizeNumber(actual_weight),
      totalVolumeWeight,
      chargeable_weight,
      packages_count,
      totalFreightWithFSC,
      total,
      finalTotal,
      updated_by,
      quotationId
    ]);

    // --- Step 5: Sync Packages (Update/Insert/Delete) ---
    const { rows: existingPackages } = await client.query(
      `SELECT id FROM courier_export_quotation_packages WHERE quotation_id=$1`,
      [quotationId]
    );

    const existingPackageIds = existingPackages.map(p => p.id);
    const incomingPackageIds = packages.map(p => p.id).filter(Boolean);
    const toDeletePackages = existingPackageIds.filter(id => !incomingPackageIds.includes(id));

    if (toDeletePackages.length > 0) {
      await client.query(
        `DELETE FROM courier_export_quotation_packages WHERE id = ANY($1::int[])`,
        [toDeletePackages]
      );
    }

    for (let pkg of packages) {
      if (pkg.id) {
        await client.query(
          `UPDATE courier_export_quotation_packages
           SET length=$1, width=$2, height=$3, same_size=$4
           WHERE id=$5`,
          [
            sanitizeNumber(pkg.length),
            sanitizeNumber(pkg.width),
            sanitizeNumber(pkg.height),
            sanitizeNumber(pkg.same_size),
            pkg.id
          ]
        );
      } else {
        await client.query(
          `INSERT INTO courier_export_quotation_packages
           (quotation_id, length, width, height, same_size)
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
    }

    // --- Step 6: Sync Charges (Update/Insert/Delete) ---
    const { rows: existingCharges } = await client.query(
      `SELECT id FROM courier_export_quotation_charges WHERE quotation_id=$1`,
      [quotationId]
    );

    const existingChargeIds = existingCharges.map(c => c.id);
    const incomingChargeIds = charges.map(c => c.id).filter(Boolean);
    const toDeleteCharges = existingChargeIds.filter(id => !incomingChargeIds.includes(id));

    if (toDeleteCharges.length > 0) {
      await client.query(
        `DELETE FROM courier_export_quotation_charges WHERE id = ANY($1::int[])`,
        [toDeleteCharges]
      );
    }

    for (let chg of charges) {
      const chargeName = (chg.charge_name || "").trim().toLowerCase();
      if (chargeName === "fsc") continue;

      if (chg.id) {
        await client.query(
          `UPDATE courier_export_quotation_charges
           SET charge_name=$1, type=$2, rate_per_kg=$3, weight_kg=$4, amount=$5,
               description=$6
           WHERE id=$7`,
          [
            chg.charge_name || null,
            chg.type || null,
            sanitizeNumber(chg.rate_per_kg),
            chargeable_weight,
            sanitizeNumber(chg.amount),
            chg.description || null,
            chg.id
          ]
        );
      } else {
        await client.query(
          `INSERT INTO courier_export_quotation_charges
           (quotation_id, charge_name, type, rate_per_kg, weight_kg, amount, description)
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
    }

    // --- Step 7: FSC charge ---
    if (fscPercentage > 0) {
      await client.query(
        `INSERT INTO courier_export_quotation_charges
         (quotation_id, charge_name, type, weight_kg, amount, description)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          quotationId,
          "FSC",
          "freight",
          chargeable_weight,
          fscPercentage,
          `Fuel Surcharge (${fscPercentage}%)`
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Quotation updated successfully and set draft (packages and charges synced)",
      data: {
        quotationId,
        actual_weight,
        totalVolumeWeight,
        chargeable_weight,
        totalFreightWithFSC,
        total,
        finalTotal,
        status: "draft"
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating quotation", error: error.message });
  } finally {
    client.release();
  }
};


module.exports = {createQuotation, getQuotationByQuoteNo,  getAllQuotations, getQuotationById, updateQuotation};