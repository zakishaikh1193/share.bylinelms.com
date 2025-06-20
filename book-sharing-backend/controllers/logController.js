// controllers/logController.js
const pool = require('../config/db');

module.exports = {
  /**
   * Admin: Get all activity logs, joining with user data for clarity.
   */
  getActivityLogs: async (req, res) => {
    try {
      // Joining with users table to get user's name/email is much more useful for the admin.
      // We use LEFT JOIN in case a user was deleted but their logs remain.
      const [logs] = await pool.query(`
        SELECT 
          al.id,
          al.user_id,
          u.email AS user_email,
          u.name AS user_name,
          al.action,
          al.details,
          al.created_at
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        ORDER BY al.created_at DESC
        LIMIT 1000
      `); // Added a LIMIT to prevent fetching massive amounts of data

      res.json(logs);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  }
};