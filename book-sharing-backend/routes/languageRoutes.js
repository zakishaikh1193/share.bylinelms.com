const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const { authenticateAdmin, authenticateUserOrAdmin } = require('../middlewares/auth');

// Create a language (Admin only)
router.post('/', authenticateAdmin, languageController.createLanguage);

// Get all languages (Admin or User)
router.get('/', authenticateUserOrAdmin, languageController.getAllLanguages);

router.put('/:languageId', authenticateAdmin, languageController.updateLanguage);
router.delete('/:languageId', authenticateAdmin, languageController.deleteLanguage);

module.exports = router;
