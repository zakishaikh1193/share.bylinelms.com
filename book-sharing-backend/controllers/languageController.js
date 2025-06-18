const db = require('../config/db');

exports.createLanguage = async (req, res) => {
  const { language_name, country_id } = req.body;
  if (!language_name || !country_id) {
    return res.status(400).json({ error: 'language_name and country_id are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO languages (language_name, country_id) VALUES (?, ?)',
      [language_name, country_id]
    );
    res.status(201).json({ message: 'Language created successfully', language_id: result.insertId });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getAllLanguages = async (req, res) => {
  const { country_id } = req.query;
  try {
    let query = 'SELECT * FROM languages';
    let params = [];
    if (country_id) {
      query += ' WHERE country_id = ?';
      params.push(country_id);
    }
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateLanguage = async (req, res) => {
  const { languageId } = req.params;
  const { language_name, country_id } = req.body;

  if (!language_name || !country_id) {
    return res.status(400).json({ error: 'language_name and country_id are required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE languages SET language_name = ?, country_id = ? WHERE language_id = ?',
      [language_name, country_id, languageId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Language not found' });
    res.json({ message: 'Language updated successfully' });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteLanguage = async (req, res) => {
  const { languageId } = req.params;
  try {
    const [result] = await db.query('DELETE FROM languages WHERE language_id = ?', [languageId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Language not found' });
    res.json({ message: 'Language deleted successfully' });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};