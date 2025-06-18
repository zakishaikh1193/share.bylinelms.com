const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const reviewController = {
  createReview: async (req, res) => {
    try {
      const { subject, description, book_id } = req.body;
      const user_id = req.user.user_id;
      const file_path = req.file ? req.file.path.replace(/\\/g, '/') : null;

      const [result] = await pool.query(
        `INSERT INTO book_user_reviews (
          book_id,
          user_id,
          subject,
          description,
          file_path
        ) VALUES (?, ?, ?, ?, ?)`,
        [book_id, user_id, subject, description, file_path]
      );

      res.json({ review_id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getReviews: async (req, res) => {
    try {
      const { book_id } = req.query;

      const [reviews] = await pool.query(
        `SELECT r.*, u.name AS user_name FROM book_user_reviews r
         JOIN users u ON r.user_id = u.user_id
         WHERE (? IS NULL OR r.book_id = ?) ORDER BY r.submitted_at DESC`,
        [book_id || null, book_id || null]
      );

      res.json(reviews);
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
  }
};

module.exports = reviewController;
