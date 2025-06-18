import React, { useState, useEffect } from "react";
import "../../styles/manageData_Css/AddLanguageModal.css";
import axios from '../../axiosConfig';

function AddLanguageModal({ onClose, onSuccess }) {
  const [languageName, setLanguageName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState("");

useEffect(() => {
  const fetchCountries = async () => {
    try {
      const res = await axios.get("/api/countries", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCountries(res.data);
    } catch (err) {
      setError("Failed to load countries");
      console.error("Country fetch error:", err); // Helpful for debugging
    }
  };
  fetchCountries();
}, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!languageName || !countryId) {
    setError("Please fill in all fields");
    return;
  }

  try {
    const res = await axios.post("/api/languages", {
      language_name: languageName,
      country_id: countryId,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    onSuccess();
    onClose();
  } catch (err) {
    console.error("POST error:", err.response?.data || err.message);
    setError("Failed to add language");
  }
};


  return (
    <div className="add-language-modal-overlay">
      <div className="add-language-modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Add New Language</h2>
        {error && <p className="error-message">{error}</p>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Language Name"
            value={languageName}
            onChange={(e) => setLanguageName(e.target.value)}
          />
          <select value={countryId} onChange={(e) => setCountryId(e.target.value)}>
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.country_id} value={c.country_id}>
                {c.country_name}
              </option>
            ))}
          </select>
          <div className="modal-buttons">
            <button type="submit" className="btn-primary">Add</button>
            {/* <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button> */}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLanguageModal;
