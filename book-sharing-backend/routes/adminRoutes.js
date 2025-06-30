const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authenticateAdmin } = require('../middlewares/auth');


router.get('/dashboard', authenticateAdmin, auth.adminDashboard);

module.exports = router;