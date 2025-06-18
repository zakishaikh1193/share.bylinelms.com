import React, { useState } from "react";
import axios from "../../axiosConfig";
import "../../styles/manageData_Css/AddBookTypeModal.css";

function AddBookTypeModal({ onClose, onSuccess }) {
  const [bookTypeTitle, setBookTypeTitle] = useState("");
  const [error, setError] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!bookTypeTitle.trim()) {
    setError("Please enter a book type title");
    return;
  }

  try {
    await axios.post(
      "/api/booktypes",
      { book_type_title: bookTypeTitle },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    onSuccess();
    onClose();
  } catch {
    setError("Failed to add book type");
  }
};

  return (
    <div className="add-booktype-modal-overlay">
      <div className="add-booktype-modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Add New Book Type</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Book Type Title"
            value={bookTypeTitle}
            onChange={(e) => setBookTypeTitle(e.target.value)}
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

export default AddBookTypeModal;
