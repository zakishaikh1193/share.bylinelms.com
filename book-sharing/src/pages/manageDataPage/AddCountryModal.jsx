import React, { useState } from 'react';
import axios from '../../axiosConfig';
import '../../styles/manageData_Css/AddCountryModal.css';

const AddCountryModal = ({ onClose, onSuccess }) => {
  const [countryName, setCountryName] = useState('');
  const [error, setError] = useState('');

 const handleSubmit = async (e) => {
    e.preventDefault();

    if (!countryName.trim()) {
      setError('Country name is required');
      return;
    }

    try {
      await axios.post('/api/countries', {
        country_name: countryName,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding country', err);
      setError('Failed to add country');
    }
  };


  return (
    <div className="addcountry-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>Add New Country</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={countryName}
            onChange={(e) => setCountryName(e.target.value)}
            placeholder="Country name"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default AddCountryModal;
