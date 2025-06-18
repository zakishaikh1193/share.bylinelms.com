import React, { useEffect, useState } from "react";
import axios from "../../axiosConfig";
import "../../styles/manageData_Css/Language.css";
import AddLanguageModal from './AddLanguageModal';

function LanguagesAdmin() {
  const [languages, setLanguages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/languages", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setLanguages(res.data);
    } catch {
      setError("Failed to fetch languages");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await axios.get("/api/countries", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCountries(res.data);
    } catch {
      setError("Failed to fetch countries");
    }
  };

  useEffect(() => {
    fetchLanguages();
    fetchCountries();
  }, []);

  return (
    <div className="language-admin-wrapper">
      <div className="language-admin-card">
        <div className="language-header">
          <h2>Languages</h2>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add Language
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {showModal && (
          <AddLanguageModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              fetchLanguages();
            }}
          />
        )}

        <div className="language-table-container">
          <h3 className="table-title">Existing Languages</h3>
          {loading ? (
            <p>Loading...</p>
          ) : languages.length === 0 ? (
            <p>No languages found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Language Name</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {languages.map(({ language_id, language_name, country_id }) => {
                  const country = countries.find(c => c.country_id === country_id);
                  return (
                    <tr key={language_id}>
                      <td>{language_id}</td>
                      <td>{language_name}</td>
                      <td>{country ? country.country_name : "Unknown"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default LanguagesAdmin;
