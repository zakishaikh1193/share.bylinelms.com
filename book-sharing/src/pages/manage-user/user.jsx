import React, { useState, useMemo, useEffect } from "react";
import "../../styles/manage-user-css/users.css";
import { useNavigate } from "react-router-dom";
import axiosConfig from "../../axiosConfig";  // Adjust import path as needed
import { FaEye, FaEdit, FaTrash, FaTimes } from "react-icons/fa"; // ✅ Added Icons
 
export default function User() {
  const navigate = useNavigate();
 
  const [users, setUsers] = useState([]);
  const [viewedUser, setViewedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const token = localStorage.getItem("token");
    axiosConfig
      .get("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Users response data:", res.data);
        setUsers(Array.isArray(res.data) ? res.data : res.data.users || []);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        setUsers([]);
      });
  }, []);
 
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = user.name || "";
      const email = user.email || "";
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [users, searchTerm]);
 
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredUsers.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );
 
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
 
  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };
 
  // ✅ Handle Delete User
  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user? This action cannot be undone.");
    if (!confirmDelete) return;
 
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
 
      // Show loading state
      setIsLoading(true);
      setError(null);
 
      // Make the delete request
      await axiosConfig.delete(`/api/user/${userId}`, { headers });
 
      // Update the local state to remove the deleted user
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
 
      // Show success message
      alert("User deleted successfully!");
 
      // If we're on a page that would now be empty, go back to the first page
      if (currentEntries.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      setError(error.response?.data?.error || "Failed to delete user. Please try again.");
      alert("Failed to delete user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleViewUser = async (userId) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axiosConfig.get(`/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewedUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      setError(error.response?.data?.error || "Failed to fetch user details");
      setViewedUser(null);
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="users-page-wrapper">
      <div className="mini-container">
        <div className="top-bar">
          <div className="breadcrumb"></div>
        </div>
 
        <div className="users-page-header-row">
          <div className="left-group">
            <h2 className="users-title">Users</h2>
            <div className="entries-per-page">
              <label htmlFor="entries-select">Show</label>
              <select
                id="entries-select"
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>
 
          <div className="right-group">
            <input
              type="text"
              className="user-search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search users"
            />
            <button
              className="add-user-btn"
              onClick={() => navigate("/admin/register")}
            >
              + Add New User
            </button>
          </div>
        </div>
 
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>S.L</th>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Organization</th>
                <th>Designation</th>
                <th>Actions</th> {/* ✅ Added Actions Column */}
              </tr>
            </thead>
            <tbody>
              {currentEntries.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                currentEntries.map((user, index) => (
                  <tr key={user.user_id || index}>
                    <td>{indexOfFirstEntry + index + 1}</td>
                    <td>{user.user_id}</td>
                    <td className="user-name-cell" title={user.name}>
                      <div className="profile-circle">{getInitials(user.name)}</div>
                      {user.name}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td className={user.status.toLowerCase() !== "active" ? "inactive-status" : ""}>
                      {user.status}
                    </td>
                    <td>{user.organization}</td>
                    <td>{user.designation}</td>
                    <td className="action-buttons"> {/* ✅ Actions */}
                      {/* <button
                        className="view-btn"
                        onClick={() => handleViewUser(user.user_id)}
                        title="View"
                      >
                        <FaEye />
                      </button> */}
                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/admin/edit-user/${user.user_id}`)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.user_id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
 
        {filteredUsers.length > entriesPerPage && (
          <div className="pagination-controls">
            <p>
              Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredUsers.length)} of {filteredUsers.length} entries
            </p>
            <div className="pagination-buttons">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </div>
        )}
 
        {/* {viewedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>User Details</h2>
                <button
                  className="close-modal-btn"
                  onClick={() => {
                    setViewedUser(null);
                    setError(null);
                  }}
                >
                  <FaTimes />
                </button>
              </div>
             
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading user details...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <p>{error}</p>
                  <button
                    className="retry-btn"
                    onClick={() => handleViewUser(viewedUser.user_id)}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="user-details-container">
                  <div className="user-profile-section">
                    <div className="profile-circle large">
                      {getInitials(viewedUser.name)}
                    </div>
                    <h3>{viewedUser.name}</h3>
                    <span className="user-role">{viewedUser.role}</span>
                  </div>
 
                  <div className="user-info-grid">
                    <div className="info-group">
                      <label>User ID</label>
                      <span>{viewedUser.user_id}</span>
                    </div>
                   
                    <div className="info-group">
                      <label>Email</label>
                      <span>{viewedUser.email}</span>
                    </div>
 
                    <div className="info-group">
                      <label>Status</label>
                      <span className={`status-badge ${viewedUser.status.toLowerCase()}`}>
                        {viewedUser.status}
                      </span>
                    </div>
 
                    <div className="info-group">
                      <label>Organization</label>
                      <span>{viewedUser.organization || '—'}</span>
                    </div>
 
                    <div className="info-group">
                      <label>Designation</label>
                      <span>{viewedUser.designation || '—'}</span>
                    </div>
 
                    <div className="info-group">
                      <label>Country</label>
                      <span>{viewedUser.country_name || '—'}</span>
                    </div>
 
                    <div className="info-group">
                      <label>Created At</label>
                      <span>{new Date(viewedUser.created_at).toLocaleDateString()}</span>
                    </div>
 
                    <div className="info-group">
                      <label>Last Updated</label>
                      <span>{new Date(viewedUser.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
 