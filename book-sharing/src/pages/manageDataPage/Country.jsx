import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import AddCountryModal from './AddCountryModal';
import '../../styles/manageData_Css/Country.css';

const CountriesPage = () => {
  const [countries, setCountries] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchCountries = async () => {
    try {
      const res = await axios.get('/api/countries', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCountries(res.data);
    } catch (err) {
      console.error('Failed to fetch countries', err);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleAddSuccess = () => {
    fetchCountries();
    setShowModal(false);
  };

  return (
    <div className="addcountry-container">
      <h2>Countries</h2>
      <button className="add-btn" onClick={() => setShowModal(true)}>+ Add Country</button>

      <ul className="country-list">
        {countries.map((c) => (
          <li key={c.country_id}>{c.country_name}</li>
        ))}
      </ul>

      {showModal && <AddCountryModal onClose={() => setShowModal(false)} onSuccess={handleAddSuccess} />}
    </div>
  );
};

export default CountriesPage;
