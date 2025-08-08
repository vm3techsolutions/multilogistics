const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');

const adminController = require('../controller/adminController/adminController');
const {createAgent} = require('../controller/agentController/agentController');

// Admin Signup Route
router.post('/signup', adminController.adminSignUp);
// Admin Login Route
router.post('/login', adminController.adminLogin);
// Admin Get Data Route
router.get('/get-admin/:id', verifyToken, adminController.getAdminData);


// Agent Routes
router.post('/agents', verifyToken, createAgent); // Create Agent



module.exports = router;