const pool = require('../../config/db');
const dayjs = require('dayjs');

async function generateSeaQuoteNumber() {
  const today = dayjs().format('YYYY-MM-DD');
  const { rows } = await pool.query(
    `SELECT quote_no FROM sea_export_quotations
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


// Create Sea Quotation (FINAL)
const createSeaQuotation = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            subject,
            customer_id,
            agent_id,
            company_name,
            address,
            attention,
            mode,
            commodity,
            pol,
            pod,
            incoterms,
            actual_weight,        // KG
            currency = 'USD',
            exchange_rate,        // USD → INR
            created_by,
            packages = [],
            charges = [],
            remarks = null
        } = req.body;

        /* ---------------- VALIDATION ---------------- */
        const errors = [];
        if (!subject) errors.push('Subject required');
        if (!customer_id) errors.push('Customer required');
        if (!agent_id) errors.push('Agent required');
        if (!pol) errors.push('POL required');
        if (!pod) errors.push('POD required');
        if (!actual_weight || actual_weight <= 0) errors.push('Actual weight required');

        if (errors.length) {
            return res.status(400).json({ success: false, errors });
        }

        /* ---------------- CBM CALCULATION ---------------- */
        let totalCBM = 0;
        const volumeFactor = 1000000;

        for (const pkg of packages) {
            const l = sanitizeNumber(pkg.length) || 0;
            const w = sanitizeNumber(pkg.width) || 0;
            const h = sanitizeNumber(pkg.height) || 0;
            const qty = sanitizeNumber(pkg.same_size) || 1;

            totalCBM += (l * w * h * qty) / volumeFactor;
        }

        const actualWeightKg = sanitizeNumber(actual_weight);
        const cbmWeightKg = Number((totalCBM * 1000).toFixed(2));

        const isCBMGreater = cbmWeightKg > actualWeightKg;
        const chargeable_weight = isCBMGreater ? cbmWeightKg : actualWeightKg;

        /* ---------------- CHARGES CALCULATION ---------------- */
        let totalFreightCurrency = 0; // USD (or selected currency) total
        let totalFreightINR = 0;      // INR total
        let originChargeTotal = 0;
        let destinationChargeTotal = 0;

        for (const chg of charges) {
            let amountCurrency = 0;
            let amountINR = 0;
            let weightUsed = null;

            // 🔵 FREIGHT (Ocean + THC)
            if (chg.type === 'freight' && chg.currency === currency) {
                const rate = sanitizeNumber(chg.rate_per_kg) || 0;

                // CBM > Actual → rate × CBM
                if (isCBMGreater) {
                    amountCurrency = rate * cbmWeightKg;
                    weightUsed = cbmWeightKg;
                }
                // CBM <= Actual → FIXED amount
                else {
                    amountCurrency = rate;
                    weightUsed = null;
                }

                amountINR = amountCurrency * exchange_rate;

                totalFreightCurrency += amountCurrency;
                totalFreightINR += amountINR;
            }

            // 🟢 ORIGIN
            else if (chg.type === 'origin') {
                amountINR = sanitizeNumber(chg.amount) || 0;
                originChargeTotal += amountINR;
            }

            // 🟠 DESTINATION
            else if (chg.type === 'destination') {
                amountINR = sanitizeNumber(chg.amount) || 0;
                destinationChargeTotal += amountINR;
            }

            chg.amount = Number(amountINR.toFixed(2));
            chg.weight_used = weightUsed;
        }

        /* ---------------- FINAL TOTAL ---------------- */
        const finalTotal =
            Number((totalFreightINR + originChargeTotal + destinationChargeTotal).toFixed(2));

        /* ---------------- DB INSERT ---------------- */
        await client.query('BEGIN');

        const quote_no = await generateSeaQuoteNumber();

        const { rows } = await client.query(
            `INSERT INTO sea_export_quotations
       (
        quote_no, subject, customer_id, agent_id, company_name,
        address, attention, mode, commodity, pol, pod, incoterms,
        actual_weight, volume_weight, chargeable_weight, packages_count,
        currency, exchange_rate,
        total_ocean_freight_currency,
        total_ocean_freight_inr,
        total_origin_charges,
        total_destination_charges,
        final_total,
        remarks, created_by, created_at, updated_at
       )
       VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,NOW(),NOW())
       RETURNING id`,
            [
                quote_no,
                subject,
                customer_id,
                agent_id,
                company_name,
                address,
                attention,
                mode,
                commodity,
                pol,
                pod,
                incoterms,
                actualWeightKg,
                totalCBM,
                chargeable_weight,
                packages.length,
                currency,
                exchange_rate,
                Number(totalFreightCurrency.toFixed(2)),
                Number(totalFreightINR.toFixed(2)),
                originChargeTotal,
                destinationChargeTotal,
                finalTotal,
                remarks,
                created_by
            ]
        );

        const quotationId = rows[0].id;

        /* ---------------- PACKAGES ---------------- */
        for (const pkg of packages) {
            await client.query(
                `INSERT INTO sea_export_quotation_packages
         (quotation_id, length, width, height, same_size)
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

        /* ---------------- CHARGES ---------------- */
        for (const chg of charges) {
            await client.query(
                `INSERT INTO sea_export_quotation_charges
         (quotation_id, charge_name, type, rate_per_kg, weight_kg, currency, exchange_rate, amount, remarks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [
                    quotationId,
                    chg.charge_name,
                    chg.type,
                    sanitizeNumber(chg.rate_per_kg),
                    chg.weight_used,
                    chg.currency || 'INR',
                    sanitizeNumber(chg.exchange_rate),
                    sanitizeNumber(chg.amount),
                    chg.remarks
                ]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Sea quotation created successfully',
            data: {
                quotationId,
                quote_no,
                chargeable_weight,
                totalFreightINR,
                finalTotal
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};


// Get Sea Quotation by Quote No
const getSeaQuotationByQuoteNo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { quote_no } = req.params;
    if (!quote_no) return res.status(400).json({ success: false, message: 'Quotation number is required' });

    const { rows: quotations } = await client.query(
      `SELECT q.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address AS customer_address
       FROM sea_export_quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       WHERE q.quote_no = $1`,
      [quote_no]
    );

    if (quotations.length === 0) return res.status(404).json({ success: false, message: 'Sea quotation not found' });

    const quotation = quotations[0];

    const { rows: packages } = await client.query(
      `SELECT id, length, width, height, same_size FROM sea_export_quotation_packages WHERE quotation_id = $1`,
      [quotation.id]
    );
    quotation.packages = packages;

    const { rows: charges } = await client.query(
      `SELECT id, charge_name, type, rate_per_kg, weight_kg, currency, exchange_rate, amount, remarks FROM sea_export_quotation_charges WHERE quotation_id = $1`,
      [quotation.id]
    );
    quotation.charges = charges;

    quotation.customer = {
      name: quotation.customer_name,
      email: quotation.customer_email,
      phone: quotation.customer_phone,
      address: quotation.customer_address,
    };

    res.json({ success: true, message: 'Sea quotation fetched successfully', data: quotation });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching sea quotation', error: error.message });
  } finally {
    client.release();
  }
};

// Get all Sea Quotations
const getAllSeaQuotations = async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: quotations } = await client.query(
      `SELECT id, quote_no, subject, customer_id, agent_id, company_name, pol, pod, actual_weight, volume_weight, chargeable_weight, packages_count, status, final_total, created_at, updated_at
       FROM sea_export_quotations
       ORDER BY created_at DESC`
    );

    for (let q of quotations) {
      const { rows: packages } = await client.query(`SELECT id, length, width, height, same_size FROM sea_export_quotation_packages WHERE quotation_id = $1`, [q.id]);
      q.packages = packages;
      const { rows: charges } = await client.query(`SELECT id, charge_name, type, amount FROM sea_export_quotation_charges WHERE quotation_id = $1`, [q.id]);
      q.charges = charges;
    }

    res.json({ success: true, message: 'Sea quotations fetched successfully', data: quotations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching sea quotations', error: error.message });
  } finally {
    client.release();
  }
};

// Get Sea Quotation by ID
const getSeaQuotationById = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) return res.status(400).json({ success: false, message: 'Invalid sea quotation ID' });

    const { rows: quotations } = await client.query(`SELECT * FROM sea_export_quotations WHERE id = $1`, [quotationId]);
    if (quotations.length === 0) return res.status(404).json({ success: false, message: 'Sea quotation not found' });

    const quotation = quotations[0];
    const { rows: packages } = await client.query(`SELECT id, length, width, height, same_size FROM sea_export_quotation_packages WHERE quotation_id = $1`, [quotationId]);
    quotation.packages = packages;
    const { rows: charges } = await client.query(`SELECT id, charge_name, type, rate_per_kg, weight_kg, currency, exchange_rate, amount, remarks FROM sea_export_quotation_charges WHERE quotation_id = $1`, [quotationId]);
    quotation.charges = charges;

    res.json({ success: true, message: 'Sea quotation fetched successfully', data: quotation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching sea quotation', error: error.message });
  } finally {
    client.release();
  }
};

// Update Sea Quotation
const updateSeaQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) return res.status(400).json({ success: false, message: 'Invalid sea quotation ID' });

    const {
      subject,
      customer_id,
      agent_id,
      company_name,
      address,
      attention,
      mode,
      commodity,
      pol,
      pod,
      incoterms,
      actual_weight,
      currency = 'USD',
      exchange_rate = null,
      packages = [],
      charges = [],
      remarks = null
    } = req.body;

    const updated_by = req.user?.id || null;

    const errors = [];
    if (!subject || subject.trim() === '') errors.push('Subject is required');
    if (!customer_id) errors.push('Customer ID is required');
    if (!agent_id) errors.push('Agent ID is required');
    if (!pol || pol.trim() === '') errors.push('POL is required');
    if (!pod || pod.trim() === '') errors.push('POD is required');
    if (!actual_weight || sanitizeNumber(actual_weight) <= 0) errors.push('Actual weight is required');
    if (errors.length > 0) return res.status(400).json({ success: false, message: 'Validation failed', errors });

      /* ---------------- CBM CALCULATION ---------------- */
      let totalCBM = 0;
      const volumeFactor = 1000000;

      for (const pkg of packages) {
        const l = sanitizeNumber(pkg.length) || 0;
        const w = sanitizeNumber(pkg.width) || 0;
        const h = sanitizeNumber(pkg.height) || 0;
        const qty = sanitizeNumber(pkg.same_size) || 1;

        totalCBM += (l * w * h * qty) / volumeFactor;
      }

      const actualWeightKg = sanitizeNumber(actual_weight);
      const cbmWeightKg = Number((totalCBM * 1000).toFixed(2));

      const isCBMGreater = cbmWeightKg > actualWeightKg;
      const chargeable_weight = isCBMGreater ? cbmWeightKg : actualWeightKg;

      /* ---------------- CHARGES CALCULATION ---------------- */
      let totalFreightCurrency = 0; // USD (or selected currency) total
      let totalFreightINR = 0;      // INR total
      let originChargeTotal = 0;
      let destinationChargeTotal = 0;

      for (const chg of charges) {
        let amountCurrency = 0;
        let amountINR = 0;
        let weightUsed = null;

        // 🔵 FREIGHT (Ocean + THC)
        if (chg.type === 'freight' && chg.currency === currency) {
          const rate = sanitizeNumber(chg.rate_per_kg) || 0;

          // CBM > Actual → rate × CBM
          if (isCBMGreater) {
            amountCurrency = rate * cbmWeightKg;
            weightUsed = cbmWeightKg;
          }
          // CBM <= Actual → FIXED amount
          else {
            amountCurrency = rate;
            weightUsed = null;
          }

          amountINR = amountCurrency * exchange_rate;

          totalFreightCurrency += amountCurrency;
          totalFreightINR += amountINR;
        }

        // 🟢 ORIGIN
        else if (chg.type === 'origin') {
          amountINR = sanitizeNumber(chg.amount) || 0;
          originChargeTotal += amountINR;
        }

        // 🟠 DESTINATION
        else if (chg.type === 'destination') {
          amountINR = sanitizeNumber(chg.amount) || 0;
          destinationChargeTotal += amountINR;
        }

        chg.amount = Number(amountINR.toFixed(2));
        chg.weight_used = weightUsed;
      }

      /* ---------------- FINAL TOTAL ---------------- */
      const finalTotal = Number((totalFreightINR + originChargeTotal + destinationChargeTotal).toFixed(2));

    await client.query('BEGIN');

      // update main row with both currency and INR totals
        const updateQueryFinal = `
        UPDATE sea_export_quotations
        SET subject=$1, customer_id=$2, agent_id=$3, company_name=$4, address=$5, attention=$6, mode=$7, commodity=$8, pol=$9, pod=$10, incoterms=$11, actual_weight=$12, volume_weight=$13, chargeable_weight=$14, packages_count=$15, currency=$16, exchange_rate=$17, total_ocean_freight_currency=$18, total_ocean_freight_inr=$19, total_origin_charges=$20, total_destination_charges=$21, final_total=$22, remarks=$23, status='draft', status_updated_by=$24, status_updated_at=NOW(), updated_by=$25, updated_at=NOW()
            WHERE id=$26
      `;

        await client.query(updateQueryFinal, [
        subject || null,
        sanitizeNumber(customer_id),
        sanitizeNumber(agent_id),
        company_name || null,
        address || null,
        attention || null,
        mode || null,
        commodity || null,
        pol || null,
        pod || null,
        incoterms || null,
        sanitizeNumber(actual_weight),
        totalCBM,
        chargeable_weight,
        packages.length,
        currency || 'USD',
        sanitizeNumber(exchange_rate) || null,
        Number(totalFreightCurrency.toFixed(2)),
        Number(totalFreightINR.toFixed(2)),
        originChargeTotal,
        destinationChargeTotal,
        finalTotal,
        remarks || null,
        sanitizeNumber(updated_by),
        sanitizeNumber(updated_by),
        quotationId
      ]);

      await client.query(`DELETE FROM sea_export_quotation_packages WHERE quotation_id = $1`, [quotationId]);
    for (let pkg of packages) {
        await client.query(
          `INSERT INTO sea_export_quotation_packages (quotation_id, length, width, height, same_size)
           VALUES ($1,$2,$3,$4,$5)`,
          [quotationId, sanitizeNumber(pkg.length), sanitizeNumber(pkg.width), sanitizeNumber(pkg.height), sanitizeNumber(pkg.same_size)]
        );
    }

    await client.query(`DELETE FROM sea_export_quotation_charges WHERE quotation_id = $1`, [quotationId]);
    for (let chg of charges) {
        await client.query(
          `INSERT INTO sea_export_quotation_charges
           (quotation_id, charge_name, type, rate_per_kg, weight_kg, currency, exchange_rate, amount, remarks)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [quotationId, chg.charge_name, chg.type, sanitizeNumber(chg.rate_per_kg), chg.weight_used, chg.currency || 'INR', sanitizeNumber(chg.exchange_rate), sanitizeNumber(chg.amount), chg.remarks]
        );
    }

    await client.query('COMMIT');

    res.json({ success: true, message: 'Sea quotation updated successfully', data: { quotationId, chargeable_weight, finalTotal } });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating sea quotation', error: error.message });
  } finally {
    client.release();
  }
};

// Delete Sea Quotation
const deleteSeaQuotation = async (req, res) => {
  const client = await pool.connect();
  try {
    const quotationId = sanitizeNumber(req.params.id);
    if (!quotationId) return res.status(400).json({ success: false, message: 'Invalid sea quotation ID' });

    await client.query('BEGIN');
    await client.query(`DELETE FROM sea_export_quotation_packages WHERE quotation_id = $1`, [quotationId]);
    await client.query(`DELETE FROM sea_export_quotation_charges WHERE quotation_id = $1`, [quotationId]);
    const result = await client.query(`DELETE FROM sea_export_quotations WHERE id = $1 RETURNING id, quote_no`, [quotationId]);
    if (result.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Sea quotation not found' }); }
    await client.query('COMMIT');
    res.json({ success: true, message: 'Sea quotation deleted successfully', data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'Error deleting sea quotation', error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  createSeaQuotation,
  getSeaQuotationByQuoteNo,
  getAllSeaQuotations,
  getSeaQuotationById,
  updateSeaQuotation,
  deleteSeaQuotation,
};
