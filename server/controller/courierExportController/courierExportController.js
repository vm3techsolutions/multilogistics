const db = require('../../config/db');

/**
 * Create a courier export record with optional linked items.
 * - Auto-fetches quote_no if quotation_id is provided
 * - Auto-generates AWB number in AWB-YYYYMMDD-XXX format
 * - Inserts into courier_export_items if items are provided
 */
const createCourierExport = async (req, res) => {
  const {
    quotation_id,
    quote_no,
    booking_date,
    document_type,
    shipper_name,
    shipper_email,
    shipper_address,
    shipper_mobile,
    consignee_name,
    consignee_email,
    consignee_address,
    consignee_mobile,
    place_of_delivery,
    forwarding_company,
    correspondence_number,
    length,
    width,
    height,
    weight,
    package_count,
    amount,
    items // Array of { item_name, item_quantity, item_weight, item_description }
  } = req.body;

  const createdBy = req.user.id;

  // Validation (awb_number removed from required fields)
  if (
    !booking_date || !document_type ||
    !shipper_name || !shipper_email || !shipper_address || !shipper_mobile ||
    !consignee_name || !consignee_email || !consignee_address || !consignee_mobile ||
    length == null || width == null || height == null || weight == null ||
    package_count == null || amount == null
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!['document', 'non-document'].includes(document_type)) {
    return res.status(400).json({ message: 'Invalid document_type' });
  }

  const client = await db.connect(); // Start transaction
  try {
    await client.query('BEGIN');

      // Check duplicate quotation_id
    if (quotation_id) {
      const quotationExists = await client.query(
        `SELECT id FROM courier_exports WHERE quotation_id = $1`,
        [quotation_id]
      );
      if (quotationExists.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'This quotation is already linked to another courier export' });
      }
    }
    
    // Auto-generate AWB number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const seqResult = await client.query(
      `SELECT COUNT(*) AS count
       FROM courier_exports
       WHERE awb_number LIKE $1`,
      [`AWB-${dateStr}-%`]
    );

    const seqNumber = String(parseInt(seqResult.rows[0].count) + 1).padStart(3, '0');
    const generatedAwbNumber = `AWB-${dateStr}-${seqNumber}`;

    // Get quote_no if quotation_id provided
    let finalQuoteNo = quote_no || null;
    if (quotation_id && !quote_no) {
      const quoteResult = await client.query(
        `SELECT quote_no FROM courier_export_quotations WHERE id = $1`,
        [quotation_id]
      );
      if (quoteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid quotation_id' });
      }
      finalQuoteNo = quoteResult.rows[0].quote_no;
    }

    // Insert courier export
    const insertExportSql = `
      INSERT INTO courier_exports (
        quotation_id, quote_no, awb_number, booking_date, document_type,
        shipper_name, shipper_email, shipper_address, shipper_mobile,
        consignee_name, consignee_email, consignee_address, consignee_mobile,
        place_of_delivery, forwarding_company, correspondence_number,
        length, width, height, weight, package_count, amount,
        created_by, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20, $21, $22,
        $23, NOW(), NOW()
      )
      RETURNING *;
    `;

    const exportResult = await client.query(insertExportSql, [
      quotation_id || null,
      finalQuoteNo,
      generatedAwbNumber,
      booking_date,
      document_type,
      shipper_name,
      shipper_email,
      shipper_address,
      shipper_mobile,
      consignee_name,
      consignee_email,
      consignee_address,
      consignee_mobile,
      place_of_delivery || null,
      forwarding_company || null,
      correspondence_number || null,
      length,
      width,
      height,
      weight,
      package_count,
      amount,
      createdBy
    ]);

    const courierExport = exportResult.rows[0];

    // Insert items if provided
    if (Array.isArray(items) && items.length > 0) {
      const itemSql = `
        INSERT INTO courier_export_items (
          courier_export_id, item_name, item_quantity, item_weight, item_description
        ) VALUES ($1, $2, $3, $4, $5)
      `;
      for (const item of items) {
        if (!item.item_name || item.item_quantity == null || item.item_weight == null) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Invalid item data' });
        }
        await client.query(itemSql, [
          courierExport.id,
          item.item_name,
          item.item_quantity,
          item.item_weight,
          item.item_description || null
        ]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Courier export created successfully',
      courier_export: courierExport
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create Courier Export Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};


/**
 * Get all courier exports with their items
 */
const getAllCourierExports = async (req, res) => {
  const client = await db.connect();
  try {
    const exportsResult = await client.query(`
      SELECT ce.*, json_agg(cei) AS items
      FROM courier_exports ce
      LEFT JOIN courier_export_items cei ON ce.id = cei.courier_export_id
      GROUP BY ce.id
      ORDER BY ce.created_at DESC
    `);
    res.status(200).json({ courier_exports: exportsResult.rows });
  } catch (err) {
    console.error('Get All Courier Exports Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};

/**
 * Get a single courier export by ID with its items
 */
const getCourierExportById = async (req, res) => {
  const { id } = req.params;
  const client = await db.connect();
  try {
    const exportResult = await client.query(`
      SELECT ce.*, json_agg(cei) AS items
      FROM courier_exports ce
      LEFT JOIN courier_export_items cei ON ce.id = cei.courier_export_id
      WHERE ce.id = $1
      GROUP BY ce.id
    `, [id]);
    if (exportResult.rows.length === 0) {
      return res.status(404).json({ message: 'Courier export not found' });
    }
    res.status(200).json({ courier_export: exportResult.rows[0] });
  } catch (err) {
    console.error('Get Courier Export By ID Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  createCourierExport,
  getAllCourierExports,
  getCourierExportById
};
