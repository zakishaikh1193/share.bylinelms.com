const express = require('express');
const router = express.Router();
const bookTypeController = require('../controllers/bookTypeController');
const { authenticateAdmin, authenticateUserOrAdmin } = require('../middlewares/auth');

// Create book type (Admin only)
router.post('/', authenticateAdmin, bookTypeController.createBookType);

// Get all book types (User or Admin)
router.get('/', authenticateUserOrAdmin, bookTypeController.getAllBookTypes);

router.put('/:bookTypeId', authenticateAdmin, bookTypeController.updateBookType);
router.delete('/:bookTypeId', authenticateAdmin, bookTypeController.deleteBookType);

module.exports = router;
