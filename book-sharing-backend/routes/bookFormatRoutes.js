const express = require('express');
const router = express.Router();
const bookFormatController = require('../controllers/bookFormatController');

router.get('/', bookFormatController.getAllFormats);
router.post('/', bookFormatController.addFormat);
router.put('/:id', bookFormatController.updateFormat);
router.delete('/:id', bookFormatController.deleteFormat);

module.exports = router; 