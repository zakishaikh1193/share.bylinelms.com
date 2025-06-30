// middlewares/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Missing token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin only' });
    req.user = user;
    next();
  });
};

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Missing token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || !['viewer', 'contributor', 'reviewer'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: User access only' });
    }
    req.user = user;
    next();
  });
};

const authenticateUserOrAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Missing token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};


module.exports = { authenticateAdmin, authenticateUser, authenticateUserOrAdmin };
