const db = require('../config/db');

// Get all tags
exports.getAllTags = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM tags');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new tag
exports.addTag = async (req, res) => {
  try {
    const { tag_name } = req.body;
    if (!tag_name) return res.status(400).json({ error: 'tag_name is required' });
    const [result] = await db.query('INSERT INTO tags (tag_name) VALUES (?)', [tag_name]);
    res.json({ tag_id: result.insertId, tag_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a tag
exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_name } = req.body;
    if (!tag_name) return res.status(400).json({ error: 'tag_name is required' });
    await db.query('UPDATE tags SET tag_name = ? WHERE tag_id = ?', [tag_name, id]);
    res.json({ tag_id: id, tag_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tags WHERE tag_id = ?', [id]);
    res.json({ message: 'Tag deleted', tag_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 