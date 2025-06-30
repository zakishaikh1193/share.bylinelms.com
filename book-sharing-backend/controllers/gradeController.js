const db = require('../config/db');

exports.createGrade = async (req, res) => {
  const { grade_level } = req.body;
  if (!grade_level) {
    return res.status(400).json({ error: 'grade_level is required' });
  }

  try {
    const [result] = await db.query('INSERT INTO grades (grade_level) VALUES (?)', [grade_level]);
    res.status(201).json({ message: 'Grade created successfully', grade_id: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getAllGrades = async (req, res) => {
  try {
    const [grades] = await db.query('SELECT * FROM grades');
    res.json(grades);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateGrade = async (req, res) => {
  const { gradeId } = req.params;
  const { grade_level } = req.body;

  if (!grade_level) {
    return res.status(400).json({ error: 'grade_level is required' });
  }

  try {
    const [result] = await db.query('UPDATE grades SET grade_level = ? WHERE grade_id = ?', [grade_level, gradeId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Grade not found' });
    res.json({ message: 'Grade updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteGrade = async (req, res) => {
  const { gradeId } = req.params;
  try {
    const [result] = await db.query('DELETE FROM grades WHERE grade_id = ?', [gradeId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Grade not found' });
    res.json({ message: 'Grade deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};