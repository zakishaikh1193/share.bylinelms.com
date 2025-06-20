const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

router.get('/', tagController.getAllTags);
router.post('/', tagController.addTag);
router.put('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

module.exports = router; 