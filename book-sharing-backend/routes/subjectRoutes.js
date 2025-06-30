const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateAdmin, authenticateUserOrAdmin } = require('../middlewares/auth');

// Create a subject (Admin only)
router.post('/', authenticateAdmin, subjectController.createSubject);

// Get all subjects (Admin or User)
router.get('/', authenticateUserOrAdmin, subjectController.getAllSubjects);

router.put('/:subjectId', authenticateAdmin, subjectController.updateSubject);
router.delete('/:subjectId', authenticateAdmin, subjectController.deleteSubject);

module.exports = router;
