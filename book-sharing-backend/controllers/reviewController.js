const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../utils/logger');
const archiver = require('archiver');

const reviewController = {
createReview: async (req, res) => {
    try {
      let { subject, description, book_id } = req.body;
      const user_id = req.user.user_id;
      // If book_id is 'general', store as NULL
      if (book_id === 'general') book_id = null;

      // 1. Insert review metadata
      const [result] = await pool.query(
        `INSERT INTO book_user_reviews (book_id, user_id, subject, description) VALUES (?, ?, ?, ?)`,
        [book_id, user_id, subject, description]
      );
      const review_id = result.insertId;

      // 2. Insert each uploaded file (if any)
      let fileInfos = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const file_path = file.path.replace(/\\/g, '/');
          await pool.query(
            `INSERT INTO review_files (review_id, file_path, original_name) VALUES (?, ?, ?)`,
            [review_id, file_path, file.originalname]
          );
          fileInfos.push({ file_path, original_name: file.originalname });
        }
      }

      // Log activity
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      let bookTitle = 'General';
      if (book_id) {
        const [[book]] = await pool.query('SELECT title FROM books WHERE book_id = ?', [book_id]);
        bookTitle = book?.title || 'N/A';
      }
      logActivity(user_id, 'SUBMIT_REVIEW', { bookId: book_id, bookTitle, reviewSubject: subject }, ip);

      res.json({ review_id, files: fileInfos });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getReviews: async (req, res) => {
    try {
      const { book_id } = req.query;

      const [reviews] = await pool.query(
        `SELECT r.*, u.name AS user_name,
                b.title AS book_title,
                bv.isbn_code
         FROM book_user_reviews r
         JOIN users u ON r.user_id = u.user_id
         LEFT JOIN books b ON r.book_id = b.book_id
         LEFT JOIN (
           SELECT bv1.book_id, bv1.isbn_code
           FROM book_versions bv1
           INNER JOIN (
             SELECT book_id, MAX(version_id) AS max_version_id
             FROM book_versions
             GROUP BY book_id
           ) bv2 ON bv1.book_id = bv2.book_id AND bv1.version_id = bv2.max_version_id
         ) bv ON r.book_id = bv.book_id
         WHERE (? IS NULL OR r.book_id = ?) ORDER BY r.submitted_at DESC`,
        [book_id || null, book_id || null]
      );

      // For reviews with book_id 0 or null, set book_title to 'General' and isbn_code to null
      const reviewsWithBookInfo = reviews.map(r => {
        if (
          r.book_id === null ||
          r.book_id === undefined ||
          r.book_id === 0 ||
          r.book_id === '0'
        ) {
          return { ...r, book_title: 'General', isbn_code: null };
        }
        return r;
      });

      res.json(reviewsWithBookInfo);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  downloadReview: async (req, res) => {
    try {
      const { filename } = req.params;
      console.log('Attempting to download file:', filename);

      // Decode the filename from URL encoding
      const decodedFilename = decodeURIComponent(filename);
      console.log('Decoded filename:', decodedFilename);

      // Construct the file path - adjust this path based on your server's file structure
      const filePath = path.join(__dirname, '..', 'uploads', 'reviews', decodedFilename);
      console.log('Full file path:', filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('File not found at path:', filePath);
        return res.status(404).json({ 
          error: 'File not found',
          details: {
            requestedFile: decodedFilename,
            fullPath: filePath
          }
        });
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        console.error('Path is not a file:', filePath);
        return res.status(400).json({ 
          error: 'Invalid file path',
          details: {
            path: filePath,
            isDirectory: stats.isDirectory()
          }
        });
      }

      // Set headers
      res.setHeader('Content-Disposition', `attachment; filename="${decodedFilename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      
      // Handle stream errors
      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Error streaming file',
            details: error.message
          });
        }
      });

      // Pipe the file to the response
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error in downloadReview:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error downloading file',
          details: error.message
        });
      }
    }
  },

  downloadAllReviewFiles: async (req, res) => {
    try {
      const { review_id } = req.params;
      // Get all files for this review
      const [files] = await pool.query(
        'SELECT file_path, original_name FROM review_files WHERE review_id = ?',
        [review_id]
      );
      if (!files || files.length === 0) {
        return res.status(404).json({ error: 'No files found for this review' });
      }
      // Create a ZIP archive
      res.setHeader('Content-Disposition', `attachment; filename="review_${review_id}_files.zip"`);
      res.setHeader('Content-Type', 'application/zip');
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', err => { throw err; });
      archive.pipe(res);
      for (const file of files) {
        const filePath = path.resolve(__dirname, '..', file.file_path);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file.original_name });
        }
      }
      archive.finalize();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = reviewController;
