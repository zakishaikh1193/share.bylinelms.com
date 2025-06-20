import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import '../../styles/inputs-Css/ClientInputs.css';

const AdminReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get("/api/reviews", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setReviews(res.data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };

    fetchReviews();
  }, []);

  const handleDownload = async (filePath) => {
    try {
      setDownloadError(null);
      const token = localStorage.getItem("token");

      // Extract just the filename from the full path
      const filename = filePath.split('/').pop();
      
      // Log the file path for debugging
      console.log('Original file path:', filePath);
      console.log('Extracted filename:', filename);

      // Use the full URL with the base URL
      const baseURL = axios.defaults.baseURL;
      const downloadUrl = `${baseURL}/api/reviews/download/${encodeURIComponent(filename)}`;
      console.log('Download URL:', downloadUrl);

      // Fetch the file
      const response = await axios.get(downloadUrl, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/octet-stream'
        },
      });

      // Create blob and download
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Review file download failed:", err);
      setDownloadError("Failed to download file. Please try again later.");
      alert("Failed to download file. Please try again later.");
    }
  };

  return (
    <div className="admin-review-list">
      <h2>User Submitted Reviews</h2>
      {downloadError && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {downloadError}
        </div>
      )}
      {reviews.length === 0 ? (
        <p>No reviews found.</p>
      ) : (
        <table className="review-table">
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Submitted By</th>
              <th>Subject</th>
              <th>Description</th>
              <th>Submitted At</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.review_id}>
                <td>{review.book_id}</td>
                <td>{review.user_name || "Unknown"}</td>
                <td>{review.subject}</td>
                <td>{review.description}</td>
                <td>{new Date(review.submitted_at).toLocaleString()}</td>
                <td>
                  {review.file_path ? (
                    <button 
                      onClick={() => handleDownload(review.file_path)}
                      className="download-button"
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      Download
                    </button>
                  ) : (
                    <span style={{ color: '#666' }}>No File uploaded</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminReviewList;
