const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticateAdmin, authenticateUserOrAdmin } = require('../middlewares/auth');

// Create a grade (Admin only)
router.post('/', authenticateAdmin, gradeController.createGrade);

// Get all grades (User or Admin)
router.get('/', authenticateUserOrAdmin, gradeController.getAllGrades);

router.put('/:gradeId', authenticateAdmin, gradeController.updateGrade);
router.delete('/:gradeId', authenticateAdmin, gradeController.deleteGrade);

module.exports = router;
