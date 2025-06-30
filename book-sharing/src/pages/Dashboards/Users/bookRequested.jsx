import React, { useEffect, useState } from 'react';
import '../Users/bookRequested.css'; // Adjust the path as needed

const RequestedBooks = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Using mock data instead of API
    const mockRequests = [
      {
        bookTitle: "Introduction to Physics",
        requestedDate: "2025-06-01T12:00:00Z",
        adminResponseDate: "2025-06-03T10:00:00Z",
        status: "Approved",
        isAvailable: true,
        downloadLink: "/mock-pdfs/intro-physics.pdf",
      },
      {
        bookTitle: "Advanced Chemistry",
        requestedDate: "2025-06-02T09:30:00Z",
        adminResponseDate: null,
        status: "Pending",
        isAvailable: false,
      },
      {
        bookTitle: "Mathematics Grade 9",
        requestedDate: "2025-06-01T15:45:00Z",
        adminResponseDate: "2025-06-04T08:00:00Z",
        status: "Rejected",
        isAvailable: false,
      },
    ];

    setRequests(mockRequests);
  }, []);

  return (
    <div className="requested-books-container">
      <h2 className="requested-books-title">My Book Requests</h2>
      <div className="requested-books-table-wrapper">
        <table className="requested-books-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Requested Date</th>
              <th>Admin Response Date</th>
              <th>Status</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((req, index) => (
                <tr key={index}>
                  <td>{req.bookTitle}</td>
                  <td>{new Date(req.requestedDate).toLocaleDateString()}</td>
                  <td>{req.adminResponseDate ? new Date(req.adminResponseDate).toLocaleDateString() : 'Pending'}</td>
                  <td className={`status ${req.status.toLowerCase()}`}>{req.status}</td>
                  <td>
                    {req.isAvailable ? (
                      <a
                        href={req.downloadLink}
                        className="download-btn"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="not-available">Not Available</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">No book requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestedBooks;
