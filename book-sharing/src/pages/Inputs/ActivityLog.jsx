import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig'; // Make sure this points to your configured axios instance
import '../../styles/inputs-Css/ActivityLog.css'; // Your existing CSS file

// A helper function to create a human-readable description from the log data
const formatLogDetails = (action, detailsString) => {
  let details;
  try {
    // The 'details' from the DB is a string, so we need to parse it into an object
    details = JSON.parse(detailsString);
  } catch (e) {
    // If parsing fails, return the raw string
    return detailsString || 'No additional details.';
  }

  // Use a switch statement to handle different actions cleanly
  switch (action) {
    case 'USER_LOGIN':
      return `User logged in from IP: ${details.ipAddress || 'Unknown'}`;
    case 'READ_BOOK':
      return `Viewed book: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId})`;
    case 'DOWNLOAD_PDF':
      return `Downloaded PDF for: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}, Version: ${details.versionLabel})`;
    case 'DOWNLOAD_ZIP':
      return `Downloaded ZIP for: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}, Version: ${details.versionLabel})`;
    case 'DOWNLOAD_COVER':
      return `Downloaded cover for: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId})`;
    case 'REQUEST_ACCESS':
      return `Requested access for book: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId})`;
    case 'SUBMIT_REVIEW':
      return `Submitted a review for book: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}) with subject: "${details.reviewSubject}"`;
    default:
      // A fallback for any other actions
      return JSON.stringify(details, null, 2);
  }
};

function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/activity-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(response.data);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
        setError('Could not load activity logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []); // The empty dependency array means this runs once on component mount

  return (
    <div className="page-wrapper">
      <div className="activity-log-container">
        <h2>User Activity Log</h2>
        <div className="table-responsive-wrapper">
            <table className="activity-table">
            <thead>
                <tr>
                <th>#</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                <tr><td colSpan="5" className="loading-state">Loading logs...</td></tr>
                ) : error ? (
                <tr><td colSpan="5" className="error-state">{error}</td></tr>
                ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="empty-state">No activity logs found.</td></tr>
                ) : (
                logs.map((log, index) => (
                    <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>
                        <div className="user-info">
                        <span className="user-name">{log.user_name || 'N/A'}</span>
                        <span className="user-email">{log.user_email || 'N/A'}</span>
                        </div>
                    </td>
                    <td>
                        <span className="action-tag">{log.action.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="details-cell">{formatLogDetails(log.action, log.details)}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

export default ActivityLog;