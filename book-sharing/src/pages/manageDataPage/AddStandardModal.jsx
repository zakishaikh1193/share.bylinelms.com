import React, { useState } from 'react';
import axios from '../../axiosConfig';
import '../../styles/manageData_Css/AddStandardModal.css';

const AddStandardModal = ({ onClose, onSuccess }) => {
  const [standardName, setStandardName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!standardName.trim()) {
      setError('Standard name is required');
      return;
    }

    try {
      await axios.post('/api/standards', {
        standard_name: standardName,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding standard', err);
      setError('Failed to add standard');
    }
  };

  return (
    <div className="addstandard-modal-overlay">
      <div className="addstandard-modal-content addstandard-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h1>Add New Standard</h1>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            value={standardName}
            onChange={(e) => setStandardName(e.target.value)}
            placeholder="Enter standard name"
          />
          {error && <p className="error-message">{error}</p>}
          <div className="modal-buttons">
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStandardModal;
