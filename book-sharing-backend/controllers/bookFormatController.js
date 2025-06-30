const db = require('../config/db');

// Get all book formats
exports.getAllFormats = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM book_formats');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new book format
exports.addFormat = async (req, res) => {
  try {
    const { format_name } = req.body;
    if (!format_name) return res.status(400).json({ error: 'format_name is required' });
    const [result] = await db.query('INSERT INTO book_formats (format_name) VALUES (?)', [format_name]);
    res.json({ format_id: result.insertId, format_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a book format
exports.updateFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const { format_name } = req.body;
    if (!format_name) return res.status(400).json({ error: 'format_name is required' });
    await db.query('UPDATE book_formats SET format_name = ? WHERE format_id = ?', [format_name, id]);
    res.json({ format_id: id, format_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a book format
exports.deleteFormat = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM book_formats WHERE format_id = ?', [id]);
    res.json({ message: 'Format deleted', format_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 