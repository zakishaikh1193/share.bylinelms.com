const pool = require('../config/db');

/**
 * Logs an activity to the database.
 * This is designed as "fire-and-forget" so it doesn't block the main API response.
 * A logging failure should not cause the user's primary action (e.g., login, download) to fail.
 *
 * @param {number} userId - The ID of the user performing the action.
 * @param {string} action - A short, uppercase string describing the action (e.g., 'USER_LOGIN', 'DOWNLOAD_BOOK').
 * @param {object} [details={}] - A JSON object with extra details (e.g., bookId, ipAddress).
 * @param {string|null} [ipAddress=null] - The IP address of the user (optional).
 */
const logActivity = (userId, action, details = {}, ipAddress = null) => {
  const fullDetails = {
    ...details,
    ipAddress,
  };

  pool.query(
    'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, action, JSON.stringify(fullDetails)]
  ).catch(err => {
    console.error('CRITICAL: Activity logging failed!', {
      userId,
      action,
      details: fullDetails,
      error: err.message,
    });
  });
};

module.exports = { logActivity };
