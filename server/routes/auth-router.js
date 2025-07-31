const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');

const adminController = require('../controller/adminController/adminController');

// Admin Signup Route
router.post('/signup', adminController.adminSignUp);
// Admin Login Route
router.post('/login', adminController.adminLogin);
// Admin Get Data Route
router.get('/get-admin/:id', verifyToken, adminController.getAdminData);









module.exports = router;