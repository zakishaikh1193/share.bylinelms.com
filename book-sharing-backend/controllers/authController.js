const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { logActivity } = require('../utils/logger');
 
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
 
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
 
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
 
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // --- LOG ACTIVITY ---
    logActivity(user.user_id, 'USER_LOGIN', { email: user.email, role: user.role }, ip);
    // ---------------------
 
    res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
 
// Register viewer/contributor/reviewer
exports.registerUser = async (req, res) => {
  const { name, email, password, country_id, role, status, organization, designation } = req.body;
 
  if (!name || !email || !password || !country_id || !role) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
 
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password, country_id, role, status, organization, designation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
 
    const [result] = await db.query(query, [
      name, email, hashedPassword, country_id, role, status, organization, designation
    ]);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // After successful insert
logActivity(result.insertId, 'USER_REGISTER', { email, role, name }, ip);
 
    res.status(201).json({ message: 'User registered successfully', user_id: result.insertId });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
 
 
// 🔐 GET user by ID (Admin or Self)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
 
    // Admin can fetch any user, regular user can only fetch their own
    if (req.user.role !== 'admin' && parseInt(req.user.user_id) !== parseInt(id)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
 
    const [results] = await db.query(`
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.organization,
        u.designation,
        u.status,
        u.country_id,
        c.country_name
      FROM users u
      LEFT JOIN countries c ON u.country_id = c.country_id
      WHERE u.user_id = ?
    `, [id]);
 
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    res.json(results[0]);
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
 
exports.getAllUsers = async (req, res) => {
  try {
 
    // Admin can fetch any user, regular user can only fetch their own
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
 
    const [results] = await db.query('SELECT user_id, name, email, role, organization, designation, status FROM users');
 
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    res.json({ users: results });
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
 
// Admin dashboard
exports.adminDashboard = (req, res) => {
  res.send(`Hello Admin ID: ${req.user.user_id}`);
};
 
// User dashboard
exports.userDashboard = (req, res) => {
  res.send(`Hello User ID: ${req.user.user_id} with role ${req.user.role}`);
};
 
// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      status,
      organization,
      designation,
      password
    } = req.body;

    // Validate required fields (except password)
    if (!name || !email || !role || !status) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check if user exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare query
    let query = `
      UPDATE users
      SET name = ?,
          email = ?,
          role = ?,
          status = ?,
          organization = ?,
          designation = ?`;
    const params = [name, email, role, status, organization, designation];

    // Add password update if provided
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `,
          password = ?`;
      params.push(hashedPassword);
    }

    query += ` WHERE user_id = ?`;
    params.push(id);

    await db.query(query, params);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // After successful update
logActivity(id, 'USER_UPDATE', { updatedFields: { name, email, role, status } }, ip);


    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
 
// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
 
    // Check if user exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    // Delete user
    await db.query('DELETE FROM users WHERE user_id = ?', [id]);
 
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};