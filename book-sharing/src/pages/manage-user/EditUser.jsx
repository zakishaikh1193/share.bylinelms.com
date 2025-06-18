import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/manage-user-css/users.css';
 
export default function EditUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    organization: '',
    designation: '',
    country_id: ''
  });
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
 
        // Fetch user details and countries in parallel
        const [userRes, countriesRes] = await Promise.all([
          axios.get(`/api/user/${userId}`, { headers }),
          axios.get('/api/countries', { headers })
        ]);
 
        console.log('User data received:', userRes); // Debug log
        
 
        const validCountryIds = countriesRes.data.map((c) => c.country_id);
        const countryId = validCountryIds.includes(userRes.data.country_id)
          ? userRes.data.country_id
          : "";

        setFormData({
          name: userRes.data.name || "",
          email: userRes.data.email || "",
          role: userRes.data.role || "",
          status: userRes.data.status || "",
          organization: userRes.data.organization || "",
          designation: userRes.data.designation || "",
          country_id: countryId,
        });

 
        setCountries(countriesRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.error || 'Failed to fetch user details');
        setLoading(false);
      }
    };
 
    fetchData();
  }, [userId]);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
 
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
 
      console.log('Submitting form data:', formData); // Debug log
 
      await axios.put(`/api/user/${userId}`, formData, { headers });
      navigate('/admin/users');
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };
 
  if (loading) {
    return (
      <div className="edit-user-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="edit-user-container">
      <div className="edit-user-header">
        {/* <button
          className="back-btn"
          onClick={() => navigate('/admin/users')}
        >
          ← Back to Users
        </button> */}
        <h2><strong>Edit User</strong></h2>
      </div>
 
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
 
      <form onSubmit={handleSubmit} className="edit-user-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
 
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
 
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
              <option value="contributor">Contributor</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>
 
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
 
          <div className="form-group">
            <label htmlFor="organization">Organization</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
            />
          </div>
 
          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
            />
          </div>
 
          <div className="form-group">
            <label htmlFor="country_id">Country</label>
            <select
              id="country_id"
              name="country_id"
              value={formData.country_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Country</option>
              {countries.map(country => (
                <option key={country.country_id} value={country.country_id}>
                  {country.country_name}
                </option>
              ))}
            </select>
          </div>
        </div>
 
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/admin/users')}>
            Cancel
          </button>
          <button type="submit" className="save-btn">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}