const db = require('../config/db');

exports.createBookType = async (req, res) => {
  const { book_type_title } = req.body;
  if (!book_type_title) return res.status(400).json({ error: 'book_type_title is required' });

  try {
    const [result] = await db.query(
      'INSERT INTO booktypes (book_type_title) VALUES (?)',
      [book_type_title]
    );
    res.status(201).json({
      message: 'Book type created',
      book_type_id: result.insertId,
    });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getAllBookTypes = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM booktypes');
    res.json(results);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateBookType = async (req, res) => {
  const { bookTypeId } = req.params;
  const { book_type_title } = req.body;
  if (!book_type_title) return res.status(400).json({ error: 'book_type_title is required' });

  try {
    const [result] = await db.query(
      'UPDATE booktypes SET book_type_title = ? WHERE book_type_id = ?',
      [book_type_title, bookTypeId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book type not found' });
    res.json({ message: 'Book type updated successfully' });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteBookType = async (req, res) => {
  const { bookTypeId } = req.params;
  try {
    const [result] = await db.query('DELETE FROM booktypes WHERE book_type_id = ?', [bookTypeId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Book type not found' });
    res.json({ message: 'Book type deleted successfully' });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
