// routes/logRoutes.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateAdmin } = require('../middlewares/auth');

// Route for admin to fetch all activity logs
router.get('/', authenticateAdmin, logController.getActivityLogs);

module.exports = router;