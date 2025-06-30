import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig'; // Make sure this points to your configured axios instance
import '../../styles/inputs-Css/ActivityLog.css'; // Your existing CSS file
import Pagination from '../../components/common/Pagination.js'; // Adjust the import path as needed
import { getTimezoneFormattedDate } from '../../utils/dateUtils.js'; // Import timezone utility
import SearchBar from '../../components/common/SearchBar.js'; // Import SearchBar component

// A helper function to create a human-readable description from the log data (NO CHANGES HERE)
const formatLogDetails = (action, detailsString) => {
  // ... (your existing formatLogDetails function remains unchanged)
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

// --- Helper to parse date string in DD-MM-YYYY or DD/MM/YYYY ---
function parseInputDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.replace(/\//g, '-');
  const [day, month, year] = clean.split('-');
  if (!day || !month || !year) return null;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // months are 0-based
}

function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [searchType, setSearchType] = useState('all');
  const [filteredLogs, setFilteredLogs] = useState([]);
  
  // PAGINATION: State for the current page and items per page
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(50);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/activity-logs', {
          headers: { Authorization: `Bearer ${token}` },
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
  }, []);

  // Filter logs based on search term and type
  useEffect(() => {
    const filtered = logs.filter(log => {
      const searchTermLower = searchTerm.toLowerCase().trim();
      const logDate = new Date(log.created_at);
      const logAction = log.action?.toLowerCase() || '';
      const formattedLogDate = logDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).toLowerCase();
      
      switch (searchType) {
        case 'user':
          return (log.user_name?.toLowerCase().includes(searchTermLower) || 
                  log.user_email?.toLowerCase().includes(searchTermLower));
        case 'action':
          return logAction.includes(searchTermLower);
        case 'date': {
          // Try to match full date, month+day, or just month
          // e.g. 'june 23, 2025', 'june 23', 'june'
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          const logMonth = logDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
          const logDay = logDate.getDate();
          const logYear = logDate.getFullYear();

          // Full date: e.g. 'june 23, 2025'
          const fullDateMatch = searchTermLower.match(/([a-z]+)\s+(\d{1,2}),?\s*(\d{4})?/);
          if (fullDateMatch) {
            const [, month, day, year] = fullDateMatch;
            if (monthNames.includes(month)) {
              if (year) {
                // Match exact date
                return logMonth === month && logDay === parseInt(day) && logYear === parseInt(year);
              } else {
                // Match month+day
                return logMonth === month && logDay === parseInt(day);
              }
            }
          }
          // Only month: e.g. 'june'
          if (monthNames.includes(searchTermLower)) {
            return logMonth === searchTermLower;
          }
          // Fallback: substring match
          return formattedLogDate.includes(searchTermLower);
        }
        default:
          return (
            (log.user_name?.toLowerCase().includes(searchTermLower) || 
                  log.user_email?.toLowerCase().includes(searchTermLower) ||
            logAction.includes(searchTermLower) ||
            formattedLogDate.includes(searchTermLower))
          );
      }
    });
    setFilteredLogs(filtered);
  }, [logs, searchTerm, searchType]);

  // PAGINATION: Calculate logs for the current page
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  return (
    <div className="page-wrapper">
      <div className="activity-log-container">
        <h2>User Activity Log</h2>
        <SearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchType={searchType}
          setSearchType={setSearchType}
          timezone={timezone}
          setTimezone={setTimezone}
        />
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
                currentLogs.map((log) => (
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
                    <td>{getTimezoneFormattedDate(log.created_at, timezone)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION: Render the new dynamic pagination component */}
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={logs.length}
          pageSize={logsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

export default ActivityLog;