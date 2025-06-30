import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import '../../styles/inputs-Css/RequestAccess.css';
const AccessRequestsTable = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/api/books/book-control/requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch access requests", err);
      alert("Error loading access requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (user_id, book_id) => {
    try {
      await axios.post(
        "/api/books/book-control/approve",
        { user_id, book_id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Access approved!");
      fetchRequests(); // refresh list
    } catch (err) {
      console.error("Error approving access", err);
      alert("Failed to approve access.");
    }
  };

  const handleDeny = async (user_id, book_id) => {
    try {
      await axios.post(
        "/api/books/book-control/deny",
        { user_id, book_id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Access denied.");
      fetchRequests(); // refresh list
    } catch (err) {
      console.error("Error denying access", err);
      alert("Failed to deny access.");
    }
  };

  return (
    <div className="access-requests-container">
      <h2>Pending Access Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <table className="access-requests-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>User Name</th>
              <th>Email</th>
              <th>Requested At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <tr key={index}>
                <td>{req.book_title}</td>
                <td>{req.user_name || "N/A"}</td>
                <td>{req.email}</td>
                <td>
                  {req.created_at
                    ? new Date(req.created_at).toLocaleString()
                    : "N/A"}
                </td>
                <td>
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(req.user_id, req.book_id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-deny"
                    onClick={() => handleDeny(req.user_id, req.book_id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Deny
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AccessRequestsTable;
