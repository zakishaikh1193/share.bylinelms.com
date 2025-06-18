import React, { useEffect, useState } from 'react';
import '../../styles/inputs-Css/ActivityLog.css';
import axios from 'axios';

function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [useMock, setUseMock] = useState(true); // Toggle mock data usage

  useEffect(() => {
    if (useMock) {
      loadMockData();
    } else {
      fetchLogsFromDatabase();
    }
  }, [useMock]);

  // Mock Data Loader
  const loadMockData = () => {
    const mock = [
      {
        id: 1,
        userName: "Mr. Ahmed Alharbi",
        userEmail: "ahmed@riyadhschools.edu.sa",
        organization: "Riyadh Secondary School",
        action: "Logged In",
        location: "Riyadh, Saudi Arabia",
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        userName: "Dr. Lina Khalid",
        userEmail: "lina@alfaisaluniv.edu",
        organization: "Alfaisal University",
        action: "Downloaded 'Physics 101 Course Material'",
        location: "Riyadh, Saudi Arabia",
        timestamp: new Date().toISOString(),
        downloadLink: "/downloads/physics_101_course_material.pdf", // add download link field
      },
      {
        id: 3,
        userName: "Ms. Noura Alshammari",
        userEmail: "noura@jeddahuniversity.edu.sa",
        organization: "Jeddah University",
        action: "Logged Out",
        location: "Jeddah, Saudi Arabia",
        timestamp: new Date().toISOString(),
      },
      {
        id: 4,
        userName: "Mr. Saeed Alotaibi",
        userEmail: "saeed@dammamschools.edu.sa",
        organization: "Dammam International School",
        action: "Downloaded 'Coding Workbook Grade 8'",
        location: "Dammam, Saudi Arabia",
        timestamp: new Date().toISOString(),
        downloadLink: "/downloads/coding_workbook_grade_8.pdf",
      },
      {
        id: 5,
        userName: "Dr. Lina Khalid",
        userEmail: "lina@alfaisaluniv.edu",
        organization: "Alfaisal University",
        action: "Logged Out",
        location: "Riyadh, Saudi Arabia",
        timestamp: new Date().toISOString(),
      },
    ];
    setLogs(mock);
  };

  // Future API Data Fetcher
  const fetchLogsFromDatabase = async () => {
    try {
      const response = await axios.get('/api/activity-logs'); // <-- Replace with real endpoint
      if (response.data && Array.isArray(response.data)) {
        setLogs(response.data);
      } else {
        setUseMock(true); // fallback if data isn't valid
      }
    } catch (error) {
      console.error('Failed to fetch activity logs from database:', error);
      setUseMock(true); // fallback if API fails
    }
  };

  // Helper: Extract file name from action string
  const extractFileName = (action) => {
    const match = action.match(/Downloaded '(.+)'/);
    return match ? match[1] : null;
  };

  return (
    <div className="page-wrapper">
      <div className="activity-log-container">
        <h2>User Activity Log</h2>
        <table className="activity-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Email</th>
              <th>Organization</th>
              <th>Action</th>
              <th>Location</th>
              <th>Timestamp</th>
              <th>Download</th> {/* New Download Column */}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="8">No activity logs found</td></tr>
            ) : (
              logs.map((log, index) => {
                const isDownload = log.action.toLowerCase().includes("downloaded");
                const fileName = extractFileName(log.action);

                return (
                  <tr key={log.id}>
                    <td>{index + 1}</td>
                    <td>{log.userName}</td>
                    <td>{log.userEmail}</td>
                    <td>{log.organization}</td>
                    <td>{log.action}</td>
                    <td>{log.location}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      {isDownload && fileName && log.downloadLink ? (
                        <a
                          href={log.downloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-btn"
                          download
                          title={`Download ${fileName}`}
                        >
                          {fileName}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActivityLog;
