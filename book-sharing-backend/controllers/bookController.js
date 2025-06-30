// controllers/bookController.js
 
const pool = require('../config/db');
const path = require("path");
const fs = require("fs");
const { logActivity } = require('../utils/logger');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

module.exports = {

  // New optimized cover endpoint that serves either cover or PDF first page
    // streamOptimizedCover: async (req, res) => {
  //   try {
  //     const { bookId } = req.params;

  //     // First, try to get an uploaded cover
  //     const [[cover]] = await pool.query(
  //       "SELECT uploaded_link FROM covers WHERE book_id = ? ORDER BY cover_id DESC LIMIT 1",
  //       [bookId]
  //     );

  //     if (cover && fs.existsSync(cover.uploaded_link)) {
  //       // Serve the uploaded cover
  //       res.setHeader("Content-Type", "application/pdf");
  //       fs.createReadStream(cover.uploaded_link).pipe(res);
  //       return;
  //     }

  //     // If no cover, get the first page of the PDF as cover
  //     const [[version]] = await pool.query(
  //       `SELECT uploaded_link FROM book_versions WHERE book_id = ? ORDER BY version_id DESC LIMIT 1`,
  //       [bookId]
  //     );

  //     if (!version || !fs.existsSync(version.uploaded_link)) {
  //       return res.status(404).json({ error: "No cover or PDF found" });
  //     }

  //     // Extract first page from PDF and serve as cover
  //     const pdfBytes = fs.readFileSync(version.uploaded_link);
  //     const pdfDoc = await PDFDocument.load(pdfBytes);
      
  //     if (pdfDoc.getPageCount() === 0) {
  //       return res.status(404).json({ error: "PDF has no pages" });
  //     }

  //     // Create a new PDF with only the first page
  //     const coverDoc = await PDFDocument.create();
  //     const [firstPage] = await coverDoc.copyPages(pdfDoc, [0]);
  //     coverDoc.addPage(firstPage);

  //     const coverBytes = await coverDoc.save();
      
  //     res.setHeader("Content-Type", "application/pdf");
  //     res.setHeader("Content-Length", coverBytes.length);
  //     res.send(Buffer.from(coverBytes));

  //   } catch (err) {
  //     console.error("Error streaming optimized cover:", err);
  //     res.status(500).json({ error: err.message });
  //   }
  // },

streamOptimizedCover: async (req, res) => {
  try {
    const { bookId } = req.params;

    // 1. Serve cached first-page cover if available
    const coversDir = path.resolve(__dirname, "..", "covers");
    if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir);
    const cachePath = path.join(coversDir, `firstpage_${bookId}.pdf`);
    if (fs.existsSync(cachePath)) {
      res.setHeader("Content-Type", "application/pdf");
      return fs.createReadStream(cachePath).pipe(res);
    }

    // 2. Generate first-page cover from PDF if not cached
    const [[version]] = await pool.query(
      `SELECT uploaded_link FROM book_versions WHERE book_id = ? ORDER BY version_id DESC LIMIT 1`,
      [bookId]
    );
    if (!version || !fs.existsSync(version.uploaded_link)) {
      return res.status(404).json({ error: "No PDF found" });
    }
    const pdfBytes = fs.readFileSync(version.uploaded_link);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    if (pdfDoc.getPageCount() === 0) {
      return res.status(404).json({ error: "PDF has no pages" });
    }
    const coverDoc = await PDFDocument.create();
    const [firstPage] = await coverDoc.copyPages(pdfDoc, [0]);
    coverDoc.addPage(firstPage);
    const coverBytes = await coverDoc.save();

    // Cache the generated cover
    fs.writeFileSync(cachePath, coverBytes);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", coverBytes.length);
    res.send(Buffer.from(coverBytes));
  } catch (err) {
    console.error("Error streaming first page as cover:", err);
    res.status(500).json({ error: err.message });
  }
},

  streamCover: async (req, res) => {
  try {
    const { bookId } = req.params;

    const [[cover]] = await pool.query(
      "SELECT uploaded_link FROM covers WHERE book_id = ? ORDER BY cover_id DESC LIMIT 1",
      [bookId]
    );

    if (!cover) return res.status(404).json({ error: "Cover not found" });

    const filePath = path.resolve(__dirname, "..", cover.uploaded_link);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Error streaming cover:", err);
    res.status(500).json({ error: err.message });
  }
},

streamBookVersion: async (req, res) => {
  try {
    const { bookId } = req.params;
    const { user_id, role } = req.user;

    // Get latest version
    const [[version]] = await pool.query(
        `SELECT v.uploaded_link, b.title AS book_title 
         FROM book_versions v
         JOIN books b ON v.book_id = b.book_id
         WHERE v.book_id = ?
         ORDER BY v.version_id DESC LIMIT 1`,
        [bookId]
      );

    if (!version) return res.status(404).json({ error: "Book not found" });

    // ✅ Only check access if not admin
    if (role !== 'admin') {
      const [[access]] = await pool.query(
        `SELECT permission FROM book_control
         WHERE user_id = ? AND book_id = ?
         AND permission IN ('owner', 'editor', 'viewer')`,
        [user_id, bookId]
      );

      if (!access) return res.status(403).json({ error: "Access denied" });
    }

    const filePath = version.uploaded_link;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // --- LOG ACTIVITY ---
      logActivity(user_id, 'READ_BOOK', { bookId: parseInt(bookId), bookTitle: version.book_title }, ip);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},

  // 1. Admin: Create book entry
 createBook: async (req, res) => {
  try {
    const {
      title,
      description,
      grade_id,
      subject_id,
      language_id,
      standard_id,
      country_id,
      booktype_id, // New field
      format_id,   // New field
      tag_ids      // New field (array)
    } = req.body;
 
    const created_by = req.user.user_id;
 
    const [result] = await pool.query(
      `INSERT INTO books (
        title,
        description,
        grade_id,
        subject_id,
        language_id,
        standard_id,
        country_id,
        booktype_id,
        format_id,
        created_by,
        created_at,
        last_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        description,
        grade_id,
        subject_id,
        language_id,
        standard_id,
        country_id,
        booktype_id,
        format_id,
        created_by,
      ]
    );

    const book_id = result.insertId;

    // Insert tags if provided
    if (Array.isArray(tag_ids) && tag_ids.length > 0) {
      const tagValues = tag_ids.map(tag_id => [book_id, tag_id]);
      await pool.query(
        'INSERT INTO book_tags (book_id, tag_id) VALUES ?',[tagValues]
      );
    }
 
    res.json({ book_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},
 
 
  // 2. Admin: Upload book version
  uploadBookVersion: async (req, res) => {
  try {
    const { book_id, version_label, isbn_code } = req.body;
    const uploaded_by = req.user.user_id;

    // req.files will be an object with keys version_file and zip_file
    const pdfFile = req.files?.version_file ? req.files.version_file[0].path : null;
    const zipFile = req.files?.zip_file ? req.files.zip_file[0].path : null;

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    await pool.query(
      `INSERT INTO book_versions (book_id, version_label, isbn_code, uploaded_link, zip_link, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [book_id, version_label, isbn_code, pdfFile, zipFile, uploaded_by]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},

 
  // 4. Admin: Upload book cover
  uploadCover: async (req, res) => {
    try {
      const { book_id } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
 
      const uploaded_link = req.file.path;
      await pool.query(`INSERT INTO covers (book_id, uploaded_link) VALUES (?, ?)`, [book_id, uploaded_link]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateCover: async (req, res) => {
    try {
      const { bookId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No cover file uploaded' });
      }

      // To "update" a cover, we simply add a new row.
      // The queries are designed to fetch the LATEST cover by MAX(cover_id).
      // This preserves history and matches the logic of `uploadCover`.
      const uploaded_link = req.file.path;
      await pool.query(`INSERT INTO covers (book_id, uploaded_link) VALUES (?, ?)`, [bookId, uploaded_link]);
      
      res.json({ success: true, message: 'Cover updated successfully' });
    } catch (err) {
      console.error('Error updating cover:', err);
      res.status(500).json({ error: err.message });
    }
  },
 
  // 5. Admin: Upload extra resources
  uploadExtraResources: async (req, res) => {
    try {
      const { book_id } = req.body;
      const uploaded_by = req.user.user_id;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
 
      const uploaded_link = req.file.path;
      await pool.query(
        `INSERT INTO uploads (book_id, uploaded_link, uploaded_by) VALUES (?, ?, ?)`,
        [book_id, uploaded_link, uploaded_by]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 6. Admin/Viewer: Get accessible books
getBooks: async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const role = req.user.role;
    let books;
 
    const baseSelect = `
      SELECT
        b.book_id, b.title, b.description, b.grade_id, b.subject_id,
        b.language_id, b.standard_id, b.country_id, b.booktype_id,
        bt.book_type_title,
        ctry.country_name,
        b.created_by, b.created_at,
        c.uploaded_link AS cover,
        bv.version_label, bv.isbn_code,
        b.format_id, bf.format_name
      FROM books b
      LEFT JOIN booktypes bt ON b.booktype_id = bt.book_type_id
      LEFT JOIN countries ctry ON b.country_id = ctry.country_id
      LEFT JOIN (
        SELECT book_id, MAX(cover_id) AS max_cover_id
        FROM covers
        GROUP BY book_id
      ) lc ON b.book_id = lc.book_id
      LEFT JOIN covers c ON c.cover_id = lc.max_cover_id
      LEFT JOIN (
        SELECT book_id, version_label, isbn_code
        FROM book_versions
        WHERE (book_id, version_id) IN (
          SELECT book_id, MAX(version_id)
          FROM book_versions
          GROUP BY book_id
        )
      ) bv ON b.book_id = bv.book_id
      LEFT JOIN book_formats bf ON b.format_id = bf.format_id
    `;
 
    if (role === 'admin') {
      [books] = await pool.query(
        baseSelect + `
        WHERE NOT EXISTS (
          SELECT 1 FROM book_ministry_reviews m
          WHERE m.book_id = b.book_id AND m.status = 'pending'
        )`
      );
    } else {
      [books] = await pool.query(
        baseSelect + `
        JOIN book_control bc ON b.book_id = bc.book_id
        WHERE bc.user_id = ?
          AND bc.permission IN ('owner', 'editor', 'viewer')
          AND (bc.expiry IS NULL OR bc.expiry > NOW())
          AND NOT EXISTS (
            SELECT 1 FROM book_ministry_reviews m
            WHERE m.book_id = b.book_id AND m.status = 'pending'
          )`,
        [user_id]
      );
    }

    // Fetch tags for all books
    const bookIds = books.map(b => b.book_id);
    let tagsByBook = {};
    if (bookIds.length > 0) {
      const [tags] = await pool.query(
        `SELECT bt.book_id, t.tag_id, t.tag_name
         FROM book_tags bt
         JOIN tags t ON bt.tag_id = t.tag_id
         WHERE bt.book_id IN (?)`, [bookIds]
      );
      tagsByBook = bookIds.reduce((acc, id) => {
        acc[id] = [];
        return acc;
      }, {});
      tags.forEach(tag => {
        if (tagsByBook[tag.book_id]) {
          tagsByBook[tag.book_id].push({ tag_id: tag.tag_id, tag_name: tag.tag_name });
        }
      });
    }
    // Attach tags to each book
    books.forEach(book => {
      book.tags = tagsByBook[book.book_id] || [];
    });

    res.json({ books });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},
 
 
 
  // 7. Admin: Share book with user
  shareBook: async (req, res) => {
    try {
      const { book_id, user_id, permission, expiry, can_download } = req.body;
      await pool.query(
        `REPLACE INTO book_control (user_id, book_id, permission, expiry, can_download) VALUES (?, ?, ?, ?, ?)`,
        [user_id, book_id, permission, expiry, can_download || false]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 8. Viewer: Request access to book
  requestBookAccess: async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const { book_id } = req.body;


    const [result] = await pool.query(
      `INSERT INTO book_control (user_id, book_id, permission, can_download)
       VALUES (?, ?, 'requested', 0)
       ON DUPLICATE KEY UPDATE
         permission = 'requested',
         can_download = 0`,
      [user_id, book_id]
    );

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

     // --- LOG ACTIVITY ---
      const [[book]] = await pool.query('SELECT title FROM books WHERE book_id = ?', [book_id]);
      logActivity(user_id, 'REQUEST_ACCESS', { bookId: book_id, bookTitle: book?.title || 'N/A' }, ip);

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 9. Viewer: Get my shared books
  getMyBooks: async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const [books] = await pool.query(
        `SELECT b.* FROM books b
         JOIN book_control bc ON b.book_id = bc.book_id
         WHERE bc.user_id = ? AND bc.permission IN ('owner', 'editor', 'viewer')`,
        [user_id]
      );
      res.json({ books });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 10. Admin: Get all shared permissions
  getAllSharedBooks: async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT bc.*, u.email, b.title FROM book_control bc
         JOIN users u ON bc.user_id = u.user_id
         JOIN books b ON bc.book_id = b.book_id`
      );
      res.json({ shared: rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 11. Admin: Submit for ministry review
  submitForMinistryReview: async (req, res) => {
    try {
      const { book_id } = req.body;
      const submitted_by = req.user.user_id;
      await pool.query(
        `INSERT INTO book_ministry_reviews (book_id, submitted_by) VALUES (?, ?)`,
        [book_id, submitted_by]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 12. Admin: View ministry review section
  getMinistryReviews: async (req, res) => {
    try {
      const [reviews] = await pool.query(
        `SELECT m.*, b.title FROM book_ministry_reviews m
         JOIN books b ON m.book_id = b.book_id`
      );
      res.json({ reviews });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 13. Admin: Approve/Reject from review
  updateMinistryReviewStatus: async (req, res) => {
    try {
      const { book_id } = req.params;
      const { status, notes } = req.body;
      const reviewed_at = new Date();
      await pool.query(
        `UPDATE book_ministry_reviews SET status = ?, notes = ?, reviewed_at = ? WHERE book_id = ?`,
        [status, notes, reviewed_at, book_id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 14. Admin/Viewer: Get full book details
 getBookDetails: async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const role = req.user.role;
    const { id: book_id } = req.params;

    // Exclude books under ministry review
    const [reviewed] = await pool.query(
      `SELECT 1 FROM book_ministry_reviews WHERE book_id = ? AND status = 'pending'`,
      [book_id]
    );
    if (reviewed.length > 0)
      return res.status(403).json({ error: 'Book is under ministry review' });

    // Viewer: check access
    if (role !== 'admin') {
      const [access] = await pool.query(
        `SELECT 1 FROM book_control
         WHERE book_id = ? AND user_id = ?
         AND permission IN ('owner', 'editor', 'viewer')
         AND (expiry IS NULL OR expiry > NOW())`,
        [book_id, user_id]
      );
      if (access.length === 0)
        return res.status(403).json({ error: 'Access denied' });
    }

    // Get book metadata + booktype
    const [[book]] = await pool.query(
      `SELECT b.*, g.grade_level AS grade, s.subject_name AS subject,
              l.language_name AS language, std.standard_name AS standard,
              bt.book_type_title,
              bf.format_name
       FROM books b
       LEFT JOIN grades g ON b.grade_id = g.grade_id
       LEFT JOIN subjects s ON b.subject_id = s.subject_id
       LEFT JOIN languages l ON b.language_id = l.language_id
       LEFT JOIN standards std ON b.standard_id = std.standard_id
       LEFT JOIN booktypes bt ON b.booktype_id = bt.book_type_id
       LEFT JOIN book_formats bf ON b.format_id = bf.format_id
       WHERE b.book_id = ?`,
      [book_id]
    );

    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Check user's download permission
    const [[control]] = await pool.query(
      `SELECT can_download FROM book_control WHERE user_id = ? AND book_id = ?`,
      [user_id, book_id]
    );

    const canDownload = control?.can_download ?? (role === 'admin');

    // Latest cover
    let cover = null;
    const [[coverRow]] = await pool.query(
      `SELECT uploaded_link FROM covers
       WHERE book_id = ?
       ORDER BY cover_id DESC LIMIT 1`,
      [book_id]
    );
    cover = coverRow?.uploaded_link || null;

    // Latest version — always included for viewing
const [[version]] = await pool.query(
  `SELECT version_label, isbn_code, uploaded_link, zip_link
   FROM book_versions
   WHERE book_id = ?
   ORDER BY version_id DESC LIMIT 1`,
  [book_id]
);

    const latest_version = version || null;

    // Fetch tags for this book
    const [tags] = await pool.query(
      `SELECT t.tag_id, t.tag_name
       FROM book_tags bt
       JOIN tags t ON bt.tag_id = t.tag_id
       WHERE bt.book_id = ?`,
      [book_id]
    );
    book.tags = tags;

    res.json({
      book,
      cover,
      latest_version,
      canDownload
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},


downloadBookZip: async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { bookId, versionLabel } = req.params;

    // Step 1: Find version using bookId + versionLabel
    const [[version]] = await pool.query(
      `SELECT zip_link FROM book_versions WHERE book_id = ? AND version_label = ?`,
      [bookId, versionLabel]
    );

    if (!version || !version.zip_link) {
      return res.status(404).json({ error: 'ZIP file not found for this version' });
    }

    // Step 2: Check download permission
    const [[control]] = await pool.query(
      `SELECT permission, can_download FROM book_control WHERE user_id = ? AND book_id = ?`,
      [user_id, bookId]
    );

    if (!control || control.permission === 'requested') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!control.can_download && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Download permission denied' });
    }

    // Step 3: Stream the ZIP file
    const filePath = version.zip_link;

    if (!fs.existsSync(filePath)) {
      console.error("ZIP file not found:", filePath);
      return res.status(404).json({ error: 'ZIP file missing on server' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // --- LOG ACTIVITY ---
      logActivity(user_id, 'DOWNLOAD_ZIP', { bookId: parseInt(bookId), bookTitle: version.book_title, versionLabel }, ip);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );
    fs.createReadStream(filePath).pipe(res);

  } catch (err) {
    console.error("ZIP Download failed:", err);
    res.status(500).json({ error: err.message });
  }
},

  // 15. Admin: Get version history
  getBookVersions: async (req, res) => {
    try {
      const { id: book_id } = req.params;
      const [versions] = await pool.query(
        `SELECT version_id, version_label, isbn_code, uploaded_link, uploaded_by, uploaded_at
       FROM book_versions WHERE book_id = ?
       ORDER BY version_id DESC`,
        [book_id]
      );
      res.json({ versions });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
  // 16. Admin: Get extra resources
  getBookResources: async (req, res) => {
    try {
      const { id: book_id } = req.params;
      const [resources] = await pool.query(
        `SELECT upload_id, uploaded_link, uploaded_by, uploaded_at
       FROM uploads WHERE book_id = ?
       ORDER BY upload_id DESC`,
        [book_id]
      );
      res.json({ resources });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 
// New Route: GET /api/books/:bookId/download/:versionLabel
downloadBookVersion: async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { bookId, versionLabel } = req.params;

    // Step 1: Find version using bookId + versionLabel
    const [[version]] = await pool.query(
      `SELECT version_id, book_id, uploaded_link FROM book_versions WHERE book_id = ? AND version_label = ?`,
      [bookId, versionLabel]
    );
    if (!version) return res.status(404).json({ error: 'Version not found' });

    // Step 1.5: Fetch book title for logging
    const [[book]] = await pool.query(
      'SELECT title FROM books WHERE book_id = ?',
      [bookId]
    );
    const bookTitle = book?.title || 'N/A';

    // Step 2: Check download permission
    const [[control]] = await pool.query(
      `SELECT permission, can_download FROM book_control WHERE user_id = ? AND book_id = ?`,
      [user_id, version.book_id]
    );

    if (!control || control.permission === 'requested')
      return res.status(403).json({ error: 'Access denied' });

    if (!control.can_download && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Download permission denied' });

    // Step 3: Stream file directly
    const filePath = version.uploaded_link;
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return res.status(404).json({ error: "File not found" });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // --- LOG ACTIVITY ---
    logActivity(user_id, 'DOWNLOAD_PDF', { bookId: parseInt(bookId), bookTitle, versionLabel }, ip);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
    fs.createReadStream(filePath).pipe(res);

  } catch (err) {
    console.error("Download failed:", err);
    res.status(500).json({ error: err.message });
  }
},

getBookFileSize: async (req, res) => {
  try {
    const { bookId, versionLabel } = req.params;

    const [[version]] = await pool.query(
      `SELECT uploaded_link, zip_link FROM book_versions WHERE book_id = ? AND version_label = ?`,
      [bookId, versionLabel]
    );

    if (!version) return res.status(404).json({ error: "Version not found" });

    const response = {};

    if (version.uploaded_link) {
      const pdfPath = path.resolve(__dirname, "..", version.uploaded_link);
      if (fs.existsSync(pdfPath)) {
        const stats = fs.statSync(pdfPath);
        response.pdf_size = stats.size;
      } else {
        response.pdf_size = null;
      }
    }

    if (version.zip_link) {
      const zipPath = path.resolve(__dirname, "..", version.zip_link);
      if (fs.existsSync(zipPath)) {
        const stats = fs.statSync(zipPath);
        response.zip_size = stats.size;
      } else {
        response.zip_size = null;
      }
    }

    return res.json(response);
  } catch (err) {
    console.error("❌ Error getting file size:", err);
    res.status(500).json({ error: err.message });
  }
},

downloadCover: async (req, res) => {
  try {
    const { bookId } = req.params;
    const user_id = req.user.user_id;
    const role = req.user.role;

    // Step 1: Fetch cover file path
    const [[cover]] = await pool.query(
      "SELECT uploaded_link FROM covers WHERE book_id = ? ORDER BY cover_id DESC LIMIT 1",
      [bookId]
    );
    if (!cover) return res.status(404).json({ error: "Cover not found" });

    const filePath = cover.uploaded_link;
    if (!fs.existsSync(filePath)) {
      console.error("Cover file not found:", filePath);
      return res.status(404).json({ error: "File not found" });
    }

    // Step 2: Check access permission (same as book download)
    const [[control]] = await pool.query(
      `SELECT permission, can_download FROM book_control WHERE user_id = ? AND book_id = ?`,
      [user_id, bookId]
    );

    if (!control || control.permission === 'requested') {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!control.can_download && role !== 'admin') {
      return res.status(403).json({ error: "Download permission denied" });
    }

    // --- LOG ACTIVITY ---
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const [[book]] = await pool.query('SELECT title FROM books WHERE book_id = ?', [bookId]);
      logActivity(user_id, 'DOWNLOAD_COVER', { bookId: parseInt(bookId), bookTitle: book?.title || 'N/A' }, ip);

    // Step 3: Send the cover file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="BookCover_${bookId}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Download cover failed:", err);
    res.status(500).json({ error: err.message });
  }
},

getUserBookAccess: async (req, res) => {
  try {
    const { user_id } = req.params;

    // --- Base query for assigned books ---
    const assignedBaseQuery = `
      SELECT 
        b.book_id, b.title, b.description,
        b.grade_id, g.grade_level,
        b.subject_id, s.subject_name,
        b.language_id, l.language_name,
        b.standard_id,
        b.country_id, ctry.country_name,
        b.booktype_id, bt.book_type_title,
        b.format_id, bf.format_name,
        c.uploaded_link AS cover,
        bv.version_label, bv.isbn_code,
        bv.zip_link,
        bc.can_download AS can_download,
        bc.expiry AS expiry
      FROM books b
      LEFT JOIN grades g ON b.grade_id = g.grade_id
      LEFT JOIN subjects s ON b.subject_id = s.subject_id
      LEFT JOIN languages l ON b.language_id = l.language_id
      LEFT JOIN booktypes bt ON b.booktype_id = bt.book_type_id
      LEFT JOIN book_formats bf ON b.format_id = bf.format_id
      LEFT JOIN countries ctry ON b.country_id = ctry.country_id
      LEFT JOIN (
        SELECT book_id, MAX(cover_id) AS max_cover_id FROM covers GROUP BY book_id
      ) lc ON b.book_id = lc.book_id
      LEFT JOIN covers c ON c.cover_id = lc.max_cover_id
      LEFT JOIN (
        SELECT book_id, version_label, isbn_code, uploaded_link, zip_link
        FROM book_versions
        WHERE (book_id, version_id) IN (
          SELECT book_id, MAX(version_id) FROM book_versions GROUP BY book_id
        )
      ) bv ON b.book_id = bv.book_id
      JOIN book_control bc ON b.book_id = bc.book_id
    `;

    // --- Base query for unassigned books (NO JOIN to book_control) ---
    const unassignedBaseQuery = `
      SELECT 
        b.book_id, b.title, b.description,
        b.grade_id, g.grade_level,
        b.subject_id, s.subject_name,
        b.language_id, l.language_name,
        b.standard_id,
        b.country_id, ctry.country_name,
        b.booktype_id, bt.book_type_title,
        b.format_id, bf.format_name,
        c.uploaded_link AS cover,
        bv.version_label, bv.isbn_code,
        bv.zip_link
      FROM books b
      LEFT JOIN grades g ON b.grade_id = g.grade_id
      LEFT JOIN subjects s ON b.subject_id = s.subject_id
      LEFT JOIN languages l ON b.language_id = l.language_id
      LEFT JOIN booktypes bt ON b.booktype_id = bt.book_type_id
      LEFT JOIN book_formats bf ON b.format_id = bf.format_id
      LEFT JOIN countries ctry ON b.country_id = ctry.country_id
      LEFT JOIN (
        SELECT book_id, MAX(cover_id) AS max_cover_id FROM covers GROUP BY book_id
      ) lc ON b.book_id = lc.book_id
      LEFT JOIN covers c ON c.cover_id = lc.max_cover_id
      LEFT JOIN (
        SELECT book_id, version_label, isbn_code, uploaded_link, zip_link
        FROM book_versions
        WHERE (book_id, version_id) IN (
          SELECT book_id, MAX(version_id) FROM book_versions GROUP BY book_id
        )
      ) bv ON b.book_id = bv.book_id
    `;

    // 1. Get assigned books
    const [assigned] = await pool.query(`
      ${assignedBaseQuery}
      WHERE bc.user_id = ?
    `, [user_id]);

    // 2. Get unassigned books
    const [unassigned] = await pool.query(`
      ${unassignedBaseQuery}
      WHERE b.book_id NOT IN (
        SELECT book_id FROM book_control WHERE user_id = ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM book_ministry_reviews m
        WHERE m.book_id = b.book_id AND m.status = 'pending'
      )
    `, [user_id]);
    
    // --- 3. Fetch and attach tags for all books ---
    const allBookIds = [...assigned.map(b => b.book_id), ...unassigned.map(b => b.book_id)];
    let tagsByBook = {};
    if (allBookIds.length > 0) {
      const [tags] = await pool.query(
        `SELECT bt.book_id, t.tag_id, t.tag_name
         FROM book_tags bt
         JOIN tags t ON bt.tag_id = t.tag_id
         WHERE bt.book_id IN (?)`, [allBookIds]
      );
      tagsByBook = allBookIds.reduce((acc, id) => ({ ...acc, [id]: [] }), {});
      tags.forEach(tag => {
        if (tagsByBook[tag.book_id]) {
          tagsByBook[tag.book_id].push({ tag_id: tag.tag_id, tag_name: tag.tag_name });
        }
      });
    }

    const attachTags = book => ({ ...book, tags: tagsByBook[book.book_id] || [] });

    res.json({ 
      assignedBooks: assigned.map(attachTags), 
      unassignedBooks: unassigned.map(attachTags) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},


getAccessRequests: async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        bc.user_id,
        bc.book_id,
        bc.permission,
        bc.expiry,
        bc.can_download,
        u.name AS user_name,
        u.email,
        b.title AS book_title,
        bc.created_at
      FROM book_control bc
      JOIN users u ON bc.user_id = u.user_id
      JOIN books b ON bc.book_id = b.book_id
      WHERE bc.permission = 'requested'
      ORDER BY bc.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},

approveAccessRequest: async (req, res) => {
  try {
    const { user_id, book_id } = req.body;

    await pool.query(
      `UPDATE book_control
       SET permission = 'viewer', can_download = 1
       WHERE user_id = ? AND book_id = ?`,
      [user_id, book_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},

  // Delete book
  deleteBook: async (req, res) => {
    try {
      const { bookId } = req.params;
      console.log('Attempting to delete book:', bookId);
 
      // First check if book exists
      const [[book]] = await pool.query(
        'SELECT * FROM books WHERE book_id = ?',
        [bookId]
      );
 
      if (!book) {
        console.log('Book not found:', bookId);
        return res.status(404).json({ error: 'Book not found' });
      }
 
      // Start a transaction
      await pool.query('START TRANSACTION');
 
      try {
        // Delete related records first
        await pool.query('DELETE FROM book_versions WHERE book_id = ?', [bookId]);
        await pool.query('DELETE FROM covers WHERE book_id = ?', [bookId]);
        await pool.query('DELETE FROM uploads WHERE book_id = ?', [bookId]);
        await pool.query('DELETE FROM book_control WHERE book_id = ?', [bookId]);
        await pool.query('DELETE FROM book_ministry_reviews WHERE book_id = ?', [bookId]);
 
        // Finally delete the book
        const [result] = await pool.query('DELETE FROM books WHERE book_id = ?', [bookId]);
 
        if (result.affectedRows === 0) {
          throw new Error('Failed to delete book');
        }
 
        // Commit the transaction
        await pool.query('COMMIT');
        console.log('Book deleted successfully:', bookId);
        res.json({ success: true, message: 'Book deleted successfully' });
      } catch (err) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        throw err;
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      res.status(500).json({ error: err.message });
    }
  },
  // Update book details
  updateBook: async (req, res) => {
    try {
      console.log('Update book request received:', {
        params: req.params,
        body: req.body,
        user: req.user
      });
 
      const { bookId } = req.params;
      const {
        title,
        description,
        grade_id,
        subject_id,
        language_id,
        standard_id,
        country_id,
        booktype_id,
        isbn_code,
        version_label,
        format_id,   // New field
        tag_ids      // New field (array)
      } = req.body;
 
      console.log('Updating book with ID:', bookId);
      console.log('Update data:', {
        title,
        description,
        grade_id,
        subject_id,
        language_id,
        standard_id,
        country_id,
        booktype_id,
        isbn_code,
        version_label,
        format_id,
        tag_ids
      });
 
      // First check if book exists
      const [[book]] = await pool.query(
        'SELECT * FROM books WHERE book_id = ?',
        [bookId]
      );
 
      if (!book) {
        console.log('Book not found:', bookId);
        return res.status(404).json({ error: 'Book not found' });
      }
 
      // Update book details
      const [result] = await pool.query(
        `UPDATE books
         SET title = ?,
             description = ?,
             grade_id = ?,
             subject_id = ?,
             language_id = ?,
             standard_id = ?,
             country_id = ?,
             booktype_id = ?,
             format_id = ?,
             last_updated_at = NOW()
         WHERE book_id = ?`,
        [
          title,
          description,
          grade_id,
          subject_id,
          language_id,
          standard_id,
          country_id,
          booktype_id,
          format_id,
          bookId
        ]
      );

      // Update tags if provided
      if (Array.isArray(tag_ids)) {
        // Remove all existing tags for this book
        await pool.query('DELETE FROM book_tags WHERE book_id = ?', [bookId]);
        if (tag_ids.length > 0) {
          const tagValues = tag_ids.map(tag_id => [bookId, tag_id]);
          await pool.query(
            'INSERT INTO book_tags (book_id, tag_id) VALUES ?', [tagValues]
          );
        }
      }

      // Update version information if provided
      if (isbn_code || version_label) {
        // Get the latest version ID
        const [[latestVersion]] = await pool.query(
          'SELECT version_id FROM book_versions WHERE book_id = ? ORDER BY version_id DESC LIMIT 1',
          [bookId]
        );
 
        if (latestVersion) {
          await pool.query(
            `UPDATE book_versions
             SET isbn_code = ?,
                 version_label = ?
             WHERE version_id = ?`,
            [isbn_code, version_label, latestVersion.version_id]
          );
        }
      }
 
      console.log('Update result:', result);
 
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }
 
      res.json({ success: true, message: 'Book updated successfully' });
    } catch (err) {
      console.error('Error updating book:', err);
      res.status(500).json({ error: err.message });
    }
  },

  updateBookVersion: async (req, res) => {
    try {
      const { versionId } = req.params;
      const { version_label, isbn_code } = req.body;

      // <-- FIX: Correctly access files from req.files provided by multer
      const pdfFile = req.files?.version_file ? req.files.version_file[0].path : null;
      const zipFile = req.files?.zip_file ? req.files.zip_file[0].path : null;

      const updateFields = [];
      const values = [];

      // Build the query dynamically based on what was provided
      if (version_label) {
        updateFields.push('version_label = ?');
        values.push(version_label);
      }
      if (isbn_code) {
        updateFields.push('isbn_code = ?');
        values.push(isbn_code);
      }
      if (pdfFile) {
        updateFields.push('uploaded_link = ?');
        values.push(pdfFile);
      }
      if (zipFile) {
        updateFields.push('zip_link = ?');
        values.push(zipFile);
      }

      if (updateFields.length === 0) {
        // This can happen if only book details were changed, not files.
        // It's not an error, just means we don't need to update the version files.
        return res.json({ success: true, message: 'No version files to update.' });
      }

      values.push(versionId); // Add versionId for the WHERE clause

      const [result] = await pool.query(
        `UPDATE book_versions SET ${updateFields.join(', ')} WHERE version_id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json({ success: true, message: 'Book version updated successfully' });
    } catch (err) {
      console.error('Error updating book version:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getGroupedBooks: async (req, res) => {
    try {
      const user_id = req.user.user_id;
      const role = req.user.role;
      let books;

      const baseSelect = `
        SELECT
          b.book_id, b.title, b.description, b.grade_id, g.grade_level,
          b.subject_id, s.subject_name,
          b.language_id, l.language_name,
          b.standard_id, std.standard_name,
          b.country_id, ctry.country_name,
          b.booktype_id, bt.book_type_title,
          b.format_id, bf.format_name,
          b.created_by, b.created_at,
          b.last_updated_at,
          c.uploaded_link AS cover,
          bv.version_label, bv.isbn_code,
          bv.zip_link
        FROM books b
        LEFT JOIN grades g ON b.grade_id = g.grade_id
        LEFT JOIN subjects s ON b.subject_id = s.subject_id
        LEFT JOIN languages l ON b.language_id = l.language_id
        LEFT JOIN standards std ON b.standard_id = std.standard_id
        LEFT JOIN booktypes bt ON b.booktype_id = bt.book_type_id
        LEFT JOIN book_formats bf ON b.format_id = bf.format_id
        LEFT JOIN countries ctry ON b.country_id = ctry.country_id
        LEFT JOIN (
          SELECT book_id, MAX(cover_id) AS max_cover_id
          FROM covers
          GROUP BY book_id
        ) lc ON b.book_id = lc.book_id
        LEFT JOIN covers c ON c.cover_id = lc.max_cover_id
        LEFT JOIN (
          SELECT book_id, version_label, isbn_code, uploaded_link, zip_link
          FROM book_versions
          WHERE (book_id, version_id) IN (
            SELECT book_id, MAX(version_id)
            FROM book_versions
            GROUP BY book_id
          )
        ) bv ON b.book_id = bv.book_id
      `;

      if (role === 'admin') {
        [books] = await pool.query(
          baseSelect + `
          WHERE NOT EXISTS (
            SELECT 1 FROM book_ministry_reviews m
            WHERE m.book_id = b.book_id AND m.status = 'pending'
          )`
        );
      } else {
        [books] = await pool.query(
          baseSelect + `
          JOIN book_control bc ON b.book_id = bc.book_id
          WHERE bc.user_id = ?
            AND bc.permission IN ('owner', 'editor', 'viewer')
            AND (bc.expiry IS NULL OR bc.expiry > NOW())
            AND NOT EXISTS (
              SELECT 1 FROM book_ministry_reviews m
              WHERE m.book_id = b.book_id AND m.status = 'pending'
            )`,
          [user_id]
        );
      }

      // Fetch tags for all books
      const bookIds = books.map(b => b.book_id);
      let tagsByBook = {};
      if (bookIds.length > 0) {
        const [tags] = await pool.query(
          `SELECT bt.book_id, t.tag_id, t.tag_name
           FROM book_tags bt
           JOIN tags t ON bt.tag_id = t.tag_id
           WHERE bt.book_id IN (?)`, [bookIds]
        );
        tagsByBook = bookIds.reduce((acc, id) => {
          acc[id] = [];
          return acc;
        }, {});
        tags.forEach(tag => {
          if (tagsByBook[tag.book_id]) {
            tagsByBook[tag.book_id].push({ tag_id: tag.tag_id, tag_name: tag.tag_name });
          }
        });
      }
      // Attach tags to each book
      books.forEach(book => {
        book.tags = tagsByBook[book.book_id] || [];
      });

      // Group books by title, isbn_code, grade_id, version_label
      const grouped = {};
      for (const book of books) {
        const key = [book.title, book.isbn_code, book.grade_id, book.version_label].join('|');
        if (!grouped[key]) {
          grouped[key] = {
            title: book.title,
            isbn_code: book.isbn_code,
            grade_id: book.grade_id,
            grade_level: book.grade_level,
            version_label: book.version_label,
            digital: null,
            print: null,
            // include all shared metadata fields needed for filters/search
            description: book.description,
            subject_id: book.subject_id,
            subject_name: book.subject_name,
            language_id: book.language_id,
            language_name: book.language_name,
            standard_id: book.standard_id,
            standard_name: book.standard_name,
            country_id: book.country_id,
            country_name: book.country_name,
            booktype_id: book.booktype_id,
            book_type_title: book.book_type_title,
            created_by: book.created_by,
            created_at: book.created_at,
            last_updated_at: book.last_updated_at,
            tags: book.tags,
            // Add more fields as needed for filters/search
          };
        } else {
          // Update last_updated_at if this book's is more recent
          if (new Date(book.last_updated_at) > new Date(grouped[key].last_updated_at)) {
            grouped[key].last_updated_at = book.last_updated_at;
          }
        }
        const formatName = (book.format_name || '').toLowerCase();
        const bookWithZip = { ...book };
        // Attach zip_link if available
        if (book.zip_link) bookWithZip.zip_link = book.zip_link;
        if (formatName.includes('digital')) grouped[key].digital = bookWithZip;
        if (formatName.includes('print')) grouped[key].print = bookWithZip;
      }
      res.json({ books: Object.values(grouped) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

};