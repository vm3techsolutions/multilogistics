const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');

const adminController = require('../controller/adminController/adminController');
const agentController = require('../controller/agentController/agentController');
const { createCustomer, getCustomers, getCustomerById  } = require('../controller/customerController/customerController');
const { createCourierExport, getAllCourierExports, getCourierExportById } = require('../controller/courierExportController/courierExportController');
const { createQuotation, getAllQuotations, getQuotationById, updateQuotation } = require('../controller/quotationController/quotationController');
const { approveQuotation } = require('../controller/quotationController/approveQuotation');
const { getCourierStats } = require('../controller/courierExportController/getCourierStatsController');
const {getRecentShipmentsController} = require("../controller/courierExportController/getRecentShipmentsController");

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

// Customer Routes
router.post('/addCustomer', verifyToken, createCustomer);

// Get all customers
router.get('/getCustomers', verifyToken, getCustomers);
router.get("/get-customer/:id", verifyToken, getCustomerById); 

// Quotation Routes
router.post('/createQuotation', verifyToken, createQuotation);
router.get('/getAllQuotations',verifyToken, getAllQuotations);
router.get('/getQuotationById/:id', verifyToken, getQuotationById);
router.put('/updateQuotation/:id', verifyToken, updateQuotation);
router.put('/approveQuotation/:id', verifyToken, approveQuotation);

// Courier Exports Route
router.post('/courier-exports', verifyToken, createCourierExport);
router.get('/courier-exports/stats',verifyToken, getCourierStats);
router.get("/recent-shipments", getRecentShipmentsController);
router.get('/courier-exports-all', verifyToken, getAllCourierExports);
router.get('/courier-exports/:id', verifyToken, getCourierExportById);

module.exports = router;