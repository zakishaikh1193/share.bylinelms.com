import React, { useState } from 'react';
import axios from '../../axiosConfig';
import '../../styles/manageData_Css/AddGradeModal.css';

const AddGradeModal = ({ onClose, onSuccess }) => {
  const [gradeLevel, setGradeLevel] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!gradeLevel.trim()) {
      setError('Grade level is required');
      return;
    }

    try {
      await axios.post('/api/grades', { grade_level: gradeLevel }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding grade', err);
      setError('Failed to add grade');
    }
  };

  return (
    <div className="addgrade-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>Add New Grade</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            placeholder="Grade level"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default AddGradeModal;
