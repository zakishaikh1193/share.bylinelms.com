const db = require('../config/db');

exports.createStandard = async (req, res) => {
  const { standard_name } = req.body;
  if (!standard_name) {
    return res.status(400).json({ error: 'standard_name is required' });
  }

  try {
    const [result] = await db.query('INSERT INTO standards (standard_name) VALUES (?)', [standard_name]);
    res.status(201).json({ message: 'Standard created successfully', standard_id: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getAllStandards = async (req, res) => {
  try {
    const [standards] = await db.query('SELECT * FROM standards');
    res.json(standards);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateStandard = async (req, res) => {
  const { standardId } = req.params;
  const { standard_name } = req.body;

  if (!standard_name) {
    return res.status(400).json({ error: 'standard_name is required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE standards SET standard_name = ? WHERE standard_id = ?',
      [standard_name, standardId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Standard not found' });
    res.json({ message: 'Standard updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteStandard = async (req, res) => {
  const { standardId } = req.params;
  try {
    const [result] = await db.query('DELETE FROM standards WHERE standard_id = ?', [standardId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Standard not found' });
    res.json({ message: 'Standard deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};