const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const { authenticateAdmin, authenticateUserOrAdmin } = require('../middlewares/auth');

// POST country – Admin only
router.post('/', authenticateAdmin, countryController.createCountry);

// GET all countries – Any valid user (admin or user)
router.get('/', authenticateUserOrAdmin, countryController.getAllCountries);

router.put('/:countryId', authenticateAdmin, countryController.updateCountry);
router.delete('/:countryId', authenticateAdmin, countryController.deleteCountry);

module.exports = router;
