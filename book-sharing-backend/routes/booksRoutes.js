// routes/booksRoutes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { upload } = require('../middlewares/uploads');
const { authenticateAdmin, authenticateUserOrAdmin } = require('../middlewares/auth');


// BOOK creation and viewing
router.post('/', authenticateAdmin, bookController.createBook);
router.get('/', authenticateUserOrAdmin, bookController.getBooks); 
router.get('/grouped', authenticateUserOrAdmin, bookController.getGroupedBooks);

// BOOK VERSIONS - updated to accept version_file and zip_file
router.post(
  '/book-versions',
  authenticateAdmin,
  upload.fields([
    { name: 'version_file', maxCount: 1 },
    { name: 'zip_file', maxCount: 1 },
  ]),
  bookController.uploadBookVersion
);

router.get('/test-version-update', (req, res) => {
  res.send('Update route is working');
});

router.put(
  '/book-versions/:versionId',
  authenticateAdmin,
  upload.fields([
    { name: 'version_file', maxCount: 1 },
    { name: 'zip_file', maxCount: 1 },
  ]),
  bookController.updateBookVersion
);


router.get(
  '/:bookId/download-zip/:versionLabel',
  authenticateUserOrAdmin,
  bookController.downloadBookZip
);

// COVER upload
router.post('/covers', authenticateAdmin, upload.single('file'), bookController.uploadCover);

router.put('/covers/:bookId', authenticateAdmin, upload.single('file'), bookController.updateCover);

// EXTRA uploads
router.post('/uploads', authenticateAdmin, upload.single('file'), bookController.uploadExtraResources);

// BOOK CONTROL
router.post('/book-control', authenticateAdmin, bookController.shareBook);
router.post('/book-control/request', authenticateUserOrAdmin, bookController.requestBookAccess); // for users to request access to a book
router.get('/book-control/requests', authenticateAdmin, bookController.getAccessRequests); //For admin to view all access requests
router.post('/book-control/approve', authenticateAdmin, bookController.approveAccessRequest);
router.get('/book-control/mybooks', authenticateUserOrAdmin, bookController.getMyBooks);
router.get('/book-control/shared', authenticateAdmin, bookController.getAllSharedBooks);

router.get('/user-access/:user_id', authenticateAdmin, bookController.getUserBookAccess);
router.put('/update/:bookId', authenticateAdmin, bookController.updateBook);
router.delete('/:bookId', authenticateAdmin, bookController.deleteBook);
// MINISTRY REVIEW
router.post('/ministry-reviews', authenticateAdmin, bookController.submitForMinistryReview);
router.get('/ministry-reviews', authenticateAdmin, bookController.getMinistryReviews);
router.patch('/ministry-reviews/:book_id', authenticateAdmin, bookController.updateMinistryReviewStatus);

// COVER STREAMING - Updated to use optimized cover endpoint
router.get("/:bookId/stream-cover", authenticateUserOrAdmin, bookController.streamOptimizedCover);
router.get("/:bookId/stream-version", authenticateUserOrAdmin, bookController.streamBookVersion);
router.get('/:bookId/download/:versionLabel', authenticateUserOrAdmin, bookController.downloadBookVersion);
router.get('/:bookId/file-size/:versionLabel', authenticateUserOrAdmin, bookController.getBookFileSize);
router.get('/:bookId/download-cover', authenticateUserOrAdmin, bookController.downloadCover);
router.get('/:id/details', authenticateUserOrAdmin, bookController.getBookDetails);
router.get('/:id/versions', authenticateAdmin, bookController.getBookVersions);
router.get('/:id/resources', authenticateAdmin, bookController.getBookResources); 

module.exports = router;
