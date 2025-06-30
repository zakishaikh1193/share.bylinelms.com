const db = require('../config/db');

exports.createSubject = async (req, res) => {
  const { subject_name } = req.body;
  if (!subject_name) return res.status(400).json({ error: 'subject_name is required' });

  try {
    const [result] = await db.query('INSERT INTO subjects (subject_name) VALUES (?)', [subject_name]);
    res.status(201).json({ message: 'Subject created successfully', subject_id: result.insertId });
  } catch (err) {
    console.error("createSubject error:", err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getAllSubjects = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM subjects');
    res.json(results);
  } catch (err) {
    console.error("getAllSubjects error:", err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateSubject = async (req, res) => {
  const { subjectId } = req.params;
  const { subject_name } = req.body;
  if (!subject_name) return res.status(400).json({ error: 'subject_name is required' });

  try {
    const [result] = await db.query(
      'UPDATE subjects SET subject_name = ? WHERE subject_id = ?',
      [subject_name, subjectId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject updated successfully' });
  } catch (err) {
    console.error('updateSubject error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteSubject = async (req, res) => {
  const { subjectId } = req.params;
  try {
    const [result] = await db.query('DELETE FROM subjects WHERE subject_id = ?', [subjectId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('deleteSubject error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
