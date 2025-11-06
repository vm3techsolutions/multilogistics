const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');

const adminController = require('../controller/adminController/adminController');
const agentController = require('../controller/agentController/agentController');
const { createCustomer, getCustomers, getCustomerById, editCustomer, updateCustomerStatus  } = require('../controller/customerController/customerController');
const { createCourierExport, getAllCourierExports, getCourierExportById } = require('../controller/courierExportController/courierExportController');
//const { createQuotation, getAllQuotations, getQuotationById, updateQuotation } = require('../controller/quotationController/quotationController');
const { createQuotation, getAllQuotations, getQuotationById , getQuotationByQuoteNo, updateQuotation } = require('../controller/quotationController/quotationController');
const quotationStatusController = require('../controller/quotationController/approveQuotation');
const { getCourierStats } = require('../controller/courierExportController/getCourierStatsController');
const {getRecentShipmentsController} = require("../controller/courierExportController/getRecentShipmentsController");
const upload = require("../config/multer");
const kycController = require("../controller/customerController/kycController");

// Admin Signup Route
router.post('/signup', adminController.adminSignUp);
// Admin Login Route
router.post('/login', adminController.adminLogin);
// Admin Get Data Route
router.get('/get-admin/:id', verifyToken, adminController.getAdminData);


// Agent Routes
router.post('/addAgent', verifyToken, agentController.createAgent); // Create Agent
router.get('/getAgents',agentController.getAllAgents);
router.put('/editAgent/:id', verifyToken, agentController.editAgent)
router.put('/updateAgentStatus/:id', verifyToken, agentController.updateAgentStatus);

// Customer Routes
router.post('/addCustomer', verifyToken, createCustomer);

// Get all customers
router.get('/getCustomers', verifyToken, getCustomers);
router.get("/get-customer/:id", verifyToken, getCustomerById); 
router.put('/editCustomer/:id', verifyToken, editCustomer);
router.put('/updateCustomerStatus/:id', verifyToken, updateCustomerStatus);

// customer KYC Routes
router.post("/kyc/upload/:id",verifyToken,upload.single("document"),kycController.uploadKycDocument);
router.get("/kyc/:id", verifyToken, kycController.getMyKycDocuments);

// Quotation Routes
router.post('/createQuotation', verifyToken, createQuotation);
router.get('/getAllQuotations',verifyToken, getAllQuotations);
router.get('/getQuotationById/:id', verifyToken, getQuotationById);
router.get('/number/:quote_no', getQuotationByQuoteNo);
router.put('/updateQuotation/:id', verifyToken, updateQuotation);
router.put('/approveQuotation/:id', verifyToken, quotationStatusController.updateQuotationStatus);
router.post('/quotation/send-email/:id', verifyToken, quotationStatusController.triggerQuotationEmail);

// Courier Exports Route
router.post('/courier-exports', verifyToken, createCourierExport);
router.get('/courier-exports/stats',verifyToken, getCourierStats);
router.get("/recent-shipments", getRecentShipmentsController);
router.get('/courier-exports-all', verifyToken, getAllCourierExports);
router.get('/courier-exports/:id', verifyToken, getCourierExportById);

module.exports = router;