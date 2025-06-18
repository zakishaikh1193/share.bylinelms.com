const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateUserOrAdmin } = require('../middlewares/auth');
const { reviewUpload } = require('../middlewares/uploads');

router.post('/', authenticateUserOrAdmin, reviewUpload.single('file'), reviewController.createReview);
router.get('/', authenticateUserOrAdmin, reviewController.getReviews);
router.get('/download/:filename', authenticateUserOrAdmin, reviewController.downloadReview);

module.exports = router;