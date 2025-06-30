const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateUserOrAdmin } = require('../middlewares/auth');
const { reviewUpload } = require('../middlewares/uploads');

router.post('/', authenticateUserOrAdmin, reviewUpload.array('review_files', 10), reviewController.createReview);
router.get('/', authenticateUserOrAdmin, reviewController.getReviews);
router.get('/download/:filename', authenticateUserOrAdmin, reviewController.downloadReview);
router.get('/:review_id/download-all', authenticateUserOrAdmin, reviewController.downloadAllReviewFiles);

module.exports = router;