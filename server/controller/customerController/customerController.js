const db = require('../../config/db');
const kycController = require('../customerController/kycController');

/**
 * Creates a new customer in the database.
 *
 * Expects the following fields in the request body:
 * - name: string (required)
 * - company_name: string (required)
 * - email: string (required)
 * - phone: string (required)
 * - address: string (required)
 *
 * Requires authenticated user information in req.user.id (from JWT middleware).
 *
 * Validates input fields.
 * Checks for existing customer with the same email.
 * Inserts the new customer into the database if validation passes.
 *
 * @async
 * @function createCustomer
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends a JSON response with the created customer or an error message.
 */
// ✅ Create Customer
const createCustomer = async (req, res) => {
  const { name, company_name, email, phone, address } = req.body;

   // Parse document types — it may come as stringified JSON or array
  let document_types = [];
  try {
    document_types = JSON.parse(req.body.document_type); // e.g. '["PAN", "GST"]'
  } catch {
    if (Array.isArray(req.body.document_type)) {
      document_types = req.body.document_type;
    } else if (req.body.document_type) {
      document_types = [req.body.document_type];
    }
  }

  if (!name || !company_name || !email || !phone || !address ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const checkSql = `SELECT * FROM customers WHERE email = $1`;
    const existing = await db.query(checkSql, [email]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Customer already exists with this email' });
    }

    const insertSql = `
      INSERT INTO customers (name, company_name, email, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(insertSql, [
      name, company_name, email, phone, address
    ]);

    // return res.status(201).json({
    //   message: 'Customer created successfully',
    //   customer: result.rows[0],
    // });

    //
    //merge kyc logic here
    const customer = result.rows[0];
    // If KYC file is uploaded, call existing function

    //handle single kyc upload
    // let kycData = null;

    // if (req.file && document_type) {
    //   req.params.id = customer.id;
    //   try {
    //     kycData = await kycController.uploadKycDocument(req);
    //   } catch (err) {
    //     console.error("KYC Upload Failed (but customer created):", err.message);
    //   }
    // }

    // return res.status(201).json({
    //   message: 'Customer created successfully',
    //   customer,
    //   kyc: kycData ? { message: "KYC uploaded successfully", ...kycData } : null,
    // });
    let uploadedDocs = [];

    // ✅ Handle multiple documents
    if (req.files && req.files.length > 0 && document_types.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const docType = document_types[i] || `document_${i + 1}`;

        // Create mock request to reuse KYC upload logic
        const mockReq = {
          ...req,
          file, // Single file
          body: { document_type: docType },
          params: { id: customer.id }
        };

        try {
          const kycData = await kycController.uploadKycDocument(mockReq);
          uploadedDocs.push(kycData);
        } catch (err) {
          console.error(`KYC upload failed for ${docType}:`, err.message);
        }
      }
    }

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
      uploaded_docs: uploadedDocs.length ? uploadedDocs : null,
    });

  } catch (err) {
    console.error('Create Customer Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get All Customers
const getCustomers = async (req, res) => {
  try {
    const sql = `SELECT * FROM customers ORDER BY created_at DESC`;
    const result = await db.query(sql);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get Customers Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get Customer by ID
const getCustomerById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    const sql = `SELECT * FROM customers WHERE id = $1`;
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Get Customer By ID Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ✅ Edit Customer
const editCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, company_name, email, phone, address } = req.body;

  if (!id) return res.status(400).json({ message: "Customer ID is required" });

  try {
    // Check if customer exists
    const checkSql = `SELECT * FROM customers WHERE id = $1`;
    const existing = await db.query(checkSql, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update fields
    const updateSql = `
      UPDATE customers SET
        name = COALESCE($1, name),
        company_name = COALESCE($2, company_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const result = await db.query(updateSql, [name, company_name, email, phone, address, id]);

    res.status(200).json({
      message: "Customer updated successfully",
      customer: result.rows[0],
    });
  } catch (err) {
    console.error("Edit Customer Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update Customer Status (Active / Inactive)
const updateCustomerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // expect true or false

  if (!id) return res.status(400).json({ message: "Customer ID is required" });
  if (typeof status !== "boolean")
    return res.status(400).json({ message: "Status must be true or false" });

  try {
    // Check if customer exists
    const checkSql = `SELECT * FROM customers WHERE id = $1`;
    const existing = await db.query(checkSql, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const currentStatus = existing.rows[0].is_active;

    if (currentStatus === status) {
      return res.status(400).json({
        message: `Customer is already ${status ? "Active" : "Inactive"}`,
      });
    }

    // Update status
    const updateSql = `
      UPDATE customers
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await db.query(updateSql, [status, id]);

    res.status(200).json({
      message: `Customer status updated to ${status ? "Active" : "Inactive"}`,
      customer: result.rows[0],
    });
  } catch (err) {
    console.error("Update Customer Status Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  editCustomer,
  updateCustomerStatus,
};