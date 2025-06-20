import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig'; // Make sure this points to your configured axios instance
import '../../styles/inputs-Css/ActivityLog.css'; // Your existing CSS file

// A helper function to create a human-readable description from the log data
const formatLogDetails = (action, detailsString) => {
  let details;
  try {
    details = JSON.parse(detailsString);
  } catch (e) {
    return detailsString || 'No additional details.';
  }

  const ip = details.ipAddress || 'Unknown';

  switch (action) {
    case 'USER_LOGIN':
      return `User logged in from IP: ${ip}`;

    case 'USER_REGISTER':
      return `Registered new account: "${details.name}" (${details.email}) with role "${details.role}" from IP: ${ip}`;

    case 'USER_UPDATE':
      return `Updated user: ${JSON.stringify(details.updatedFields || {}, null, 0)} from IP: ${ip}`;

    case 'READ_BOOK':
      return `Viewed book: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}) from IP: ${ip}`;

    case 'DOWNLOAD_PDF':
      return `Downloaded PDF: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}, Version: ${details.versionLabel}) from IP: ${ip}`;

    case 'DOWNLOAD_ZIP':
      return `Downloaded ZIP: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}, Version: ${details.versionLabel}) from IP: ${ip}`;

    case 'DOWNLOAD_COVER':
      return `Downloaded cover for: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}) from IP: ${ip}`;

    case 'REQUEST_ACCESS':
      return `Requested access to book: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}) from IP: ${ip}`;

    case 'SUBMIT_REVIEW':
      return `Submitted review for: "${details.bookTitle || 'N/A'}" (ID: ${details.bookId}) - Subject: "${details.reviewSubject}" from IP: ${ip}`;

    default:
      return `Performed action: ${action} with details: ${JSON.stringify(details, null, 2)} from IP: ${ip}`;
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