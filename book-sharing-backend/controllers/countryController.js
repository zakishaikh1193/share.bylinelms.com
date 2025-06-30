const db = require('../config/db');

// Create a country
exports.createCountry = async (req, res) => {
  const { country_name } = req.body;
  if (!country_name) {
    return res.status(400).json({ error: 'country_name is required' });
  }

  try {
    const [result] = await db.query('INSERT INTO countries (country_name) VALUES (?)', [country_name]);
    res.status(201).json({ message: 'Country created successfully', country_id: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// Get all countries
exports.getAllCountries = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM countries');
    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};


// Edit a country by ID
exports.updateCountry = async (req, res) => {
  const { countryId } = req.params;
  const { country_name } = req.body;

  if (!country_name) {
    return res.status(400).json({ error: 'country_name is required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE countries SET country_name = ? WHERE country_id = ?',
      [country_name, countryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json({ message: 'Country updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// Delete a country by ID
exports.deleteCountry = async (req, res) => {
  const { countryId } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM countries WHERE country_id = ?',
      [countryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json({ message: 'Country deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};