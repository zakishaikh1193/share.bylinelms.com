// import React, { useEffect, useState } from 'react';
// import '../../styles/inputs-Css/ClientInputs.css';
// import axios from 'axios';

// function ClientInput() {
//   const [inputs, setInputs] = useState([]);

//   useEffect(() => {
//     loadMockData();

//     // Uncomment this when backend API is available
//     // fetchInputsFromBackend();
//   }, []);

//   const loadMockData = () => {
//     const mock = [
//       {
//         id: 1,
//         clientName: "Riyadh International School",
//         course: "Mathematics - Grade 8",
//         email: "admin@riyadhschool.sa",
//         feedback: "Please correct page 23 and update answer keys in chapter 4.",
//         submittedAt: new Date().toISOString(),
//         location: "Riyadh, Saudi Arabia",
//         fileUrl: "#", // Placeholder
//       },
//       {
//         id: 2,
//         clientName: "Abu Dhabi University",
//         course: "Physics 102",
//         email: "faculty@adu.ac.ae",
//         feedback: "Missing diagrams in module 3. Please update.",
//         submittedAt: new Date().toISOString(),
//         location: "Abu Dhabi, UAE",
//         fileUrl: "#",
//       }
//     ];
//     setInputs(mock);
//   };

//   const fetchInputsFromBackend = async () => {
//     try {
//       const response = await axios.get('/api/client-inputs');
//       setInputs(response.data);
//     } catch (error) {
//       console.error("Error fetching client inputs:", error);
//     }
//   };

//   const handleFileUpload = (e, id) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     console.log(`Uploading file for input ID ${id}:`, file.name);

//     // TODO: Implement file upload logic to backend here
//   };

//   return (
//     <div className="client-input-wrapper">
//       <div className="client-input-container">
//         <h2>Client Inputs</h2>
//         <table className="client-input-table">
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>Client Name</th>
//               <th>Email</th>
//               <th>Course</th>
//               <th>Feedback</th>
//               <th>Date</th>
//               <th>Location</th>
//               <th>Download</th>
//               <th>Upload Updated File</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inputs.length === 0 ? (
//               <tr><td colSpan="9">No client inputs found.</td></tr>
//             ) : (
//               inputs.map((input, index) => (
//                 <tr key={input.id}>
//                   <td>{index + 1}</td>
//                   <td>{input.clientName}</td>
//                   <td>{input.email}</td>
//                   <td>{input.course}</td>
//                   <td>{input.feedback}</td>
//                   <td>{new Date(input.submittedAt).toLocaleDateString()}</td>
//                   <td>{input.location}</td>
//                   <td>
//                     <a href={input.fileUrl} download className="download-link">Download</a>
//                   </td>
//                   <td>
//                     <input type="file" onChange={(e) => handleFileUpload(e, input.id)} />
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default ClientInput;
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
      const baseURL = process.env.REACT_APP_API_URL || 'https://share.bylinelms.com';
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
