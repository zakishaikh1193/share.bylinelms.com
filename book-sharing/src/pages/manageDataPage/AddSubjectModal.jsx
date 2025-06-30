import React, { useState } from "react";
import axios from "../../axiosConfig";
import "../../styles/manageData_Css/AddSubjectModal.css";

function AddSubjectModal({ onClose, onSuccess }) {
  const [subjectName, setSubjectName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectName) {
      setError("Subject name is required");
      return;
    }
    try {
      await axios.post(
        "/api/subjects",
        { subject_name: subjectName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to add subject");
    }
  };

  return (
    <div className="add-subject-modal-overlay">
      <div className="add-subject-modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Add New Subject</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Subject Name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
          <div className="modal-buttons">
            <button type="submit" className="btn-primary">Add</button>
            {/* <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button> */}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSubjectModal;