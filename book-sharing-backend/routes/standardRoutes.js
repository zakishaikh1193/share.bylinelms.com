const express = require('express');
const router = express.Router();
const standardController = require('../controllers/standardControl');
const { authenticateAdmin, authenticateUserOrAdmin } = require('../middlewares/auth');

// Create a standard (Admin only)
router.post('/', authenticateAdmin, standardController.createStandard);

// Get all grades (User or Admin)
router.get('/', authenticateUserOrAdmin, standardController.getAllStandards);

router.put('/:standardId', authenticateAdmin, standardController.updateStandard);
router.delete('/:standardId', authenticateAdmin, standardController.deleteStandard);
module.exports = router;
