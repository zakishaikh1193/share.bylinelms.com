const pool = require('../config/db');

/**
 * Logs an activity to the database.
 * This is designed as "fire-and-forget" so it doesn't block the main API response.
 * A logging failure should not cause the user's primary action (e.g., login, download) to fail.
 *
 * @param {number} userId - The ID of the user performing the action.
 * @param {string} action - A short, uppercase string describing the action (e.g., 'USER_LOGIN', 'DOWNLOAD_BOOK').
 * @param {object} [details={}] - A JSON object with extra details (e.g., bookId, ipAddress).
 */
const logActivity = (userId, action, details = {}) => {
  // Use a then/catch instead of async/await so it doesn't need to be awaited
  pool.query(
    'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, action, JSON.stringify(details)]
  ).catch(err => {
    // We log the error to the console but don't throw it, to prevent crashing the main request.
    console.error('CRITICAL: Activity logging failed!', {
      userId,
      action,
      details,
      error: err.message
    });
  });
};

module.exports = { logActivity };