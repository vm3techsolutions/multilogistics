const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');

const adminController = require('../controller/adminController/adminController');
const {createAgent, getAllAgents} = require('../controller/agentController/agentController');
const { createCustomer, getCustomers  } = require('../controller/customerController/customerController');
const { createCourierExport } = require('../controller/courierExportController/courierExportController');
const { createQuotation, getAllQuotations } = require('../controller/quotationController/quotationController');
const { getCourierStats } = require('../controller/courierExportController/getCourierStatsController');
const {getRecentShipmentsController} = require("../controller/courierExportController/getRecentShipmentsController");

// Admin Signup Route
router.post('/signup', adminController.adminSignUp);
// Admin Login Route
router.post('/login', adminController.adminLogin);
// Admin Get Data Route
router.get('/get-admin/:id', verifyToken, adminController.getAdminData);


// Agent Routes
router.post('/addAgent', verifyToken, createAgent); // Create Agent
router.get('/getAgents', getAllAgents);

// Customer Routes
router.post('/addCustomer', verifyToken, createCustomer);

// Get all customers
router.get('/getCustomers', getCustomers);

// Quotation Routes
router.post('/createQuotation', verifyToken, createQuotation);
router.get('/getAllQuotations',verifyToken, getAllQuotations);

// Courier Exports Route
router.post('/courier-exports', verifyToken, createCourierExport);
router.get('/courier-exports/stats',verifyToken, getCourierStats);
router.get("/recent-shipments", getRecentShipmentsController);

module.exports = router;