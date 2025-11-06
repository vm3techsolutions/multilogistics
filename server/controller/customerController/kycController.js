const db = require("../../config/db");
const s3 = require("../../config/aws");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Helper function to generate a signed S3 URL for temporary file access.
 * @param {string} fileUrl - Public S3 file URL.
 * @returns {Promise<string|null>} Signed URL valid for 1 hour.
 */
const generateSignedUrl = async (fileUrl) => {
  try {
    const baseUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
    const fileKey = fileUrl.replace(baseUrl, "");

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    return await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY });
  } catch (err) {
    console.error("❌ Error generating signed URL:", err);
    return null;
  }
};

/**
 * Upload or update a KYC document for a customer.
 *
 * Expects:
 * - document_type: string (e.g., "PAN", "GST")
 * - file: uploaded file (via multer)
 * Requires: Authenticated user info in req.params.id
 */
const uploadKycDocument = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Get customer name from database
    const customerResult = await db.query(
      'SELECT name FROM customers WHERE id = $1',
      [customerId]
    );
    
    const customerName = customerResult.rows[0]?.name || "Unknown_User";
    let { document_type } = req.body;

    // ✅ Validation
    if (!document_type) {
      return res.status(400).json({ message: "document_type is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    document_type = document_type.trim().toLowerCase();

    // Sanitize name for folder path
    const [firstName, lastName = ""] = customerName.split(" ");
    const safeFirstName = firstName.replace(/\s+/g, "_");
    const safeLastName = lastName.replace(/\s+/g, "_");

    const fileKey = `uploads/kyc-documents/${customerId}_${safeFirstName}_${safeLastName}/${Date.now()}_${document_type}_${req.file.originalname}`;

    // Upload file to S3
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });
    await s3.send(putCommand);

    const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;

    // ✅ Check if document already exists
    const checkSql = `
      SELECT id FROM customer_kyc_documents 
      WHERE customer_id = $1 AND document_type = $2
    `;
    const existing = await db.query(checkSql, [customerId, document_type]);

    if (existing.rows.length > 0) {
      // Update if same document_type exists
      const updateSql = `
        UPDATE customer_kyc_documents
        SET document_url = $1, uploaded_at = NOW()
        WHERE customer_id = $2 AND document_type = $3
        RETURNING *;
      `;
      await db.query(updateSql, [fileUrl, customerId, document_type]);
    } else {
      // Insert new record
      const insertSql = `
        INSERT INTO customer_kyc_documents (customer_id, document_type, document_url)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      await db.query(insertSql, [customerId, document_type, fileUrl]);
    }

    const signedUrl = await generateSignedUrl(fileUrl);

    // return res.status(201).json({
    //   message: "KYC document uploaded successfully",
    //   document_type,
    //   file_url: fileUrl,
    //   signed_url: signedUrl,
    // });
    return {
      success: true,
      message: "KYC document uploaded successfully",
      document_type,
      file_url: fileUrl,
      signed_url: signedUrl,
    };
  } catch (err) {
    console.error("Upload KYC Document Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Fetch all KYC documents for the authenticated customer.
 */
const getMyKycDocuments = async (req, res) => {
  try {
    const customerId = req.params.id;

    const result = await db.query(
      "SELECT * FROM customer_kyc_documents WHERE customer_id = $1 ORDER BY uploaded_at DESC",
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }

    // Generate signed URLs for all documents
    const docsWithSignedUrls = await Promise.all(
      result.rows.map(async (doc) => ({
        ...doc,
        signed_url: await generateSignedUrl(doc.document_url),
      }))
    );

    return res.status(200).json(docsWithSignedUrls);
  } catch (err) {
    console.error("Get KYC Documents Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  uploadKycDocument,
  getMyKycDocuments,
};
