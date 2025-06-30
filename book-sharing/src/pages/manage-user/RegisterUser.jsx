import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig';
import { useNavigate } from 'react-router-dom';
import '../../styles/manage-user-css/RegisterUser.css';

const RegisterUserPage = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country_id: '',
    role: 'viewer',
    status: 'active',
    organization: '',
    designation: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/countries', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setCountries(res.data))
    .catch(() => setError('Failed to fetch countries'));
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/user/register', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('User registered successfully!');
      navigate('/admin/users');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setError(msg);
    }
  };

  return (
    <div className="register-user-wrapper">
      <div className="register-user-container">
        {/* Back Button */}
        <button
          className="register-user-back-btn"
          onClick={() => navigate('/admin/users')}
        >
          ← Back
        </button>

        <form className="register-user-form" onSubmit={handleSubmit}>
          <h2><strong>Register New User</strong></h2>

          <div className="register-user-row">
            <div className="register-user-input-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                placeholder="Enter full name"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="register-user-row">
            <div className="register-user-input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                onChange={handleChange}
                required
              />
            </div>
            <div className="register-user-input-group password-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  onChange={handleChange}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(!showPassword); }}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </span>
              </div>
            </div>
          </div>

          <div className="register-user-row">
            <div className="register-user-input-group">
              <label htmlFor="country_id">Country</label>
              <select
                id="country_id"
                name="country_id"
                onChange={handleChange}
                required
              >
                <option value="">Select Country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.country_name}</option>
                ))}
              </select>
            </div>
            <div className="register-user-input-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                onChange={handleChange}
                value={formData.status}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="register-user-row">
            <div className="register-user-input-group">
              <label htmlFor="organization">Organization</label>
              <input
                id="organization"
                name="organization"
                placeholder="Organization"
                onChange={handleChange}
              />
            </div>
            <div className="register-user-input-group">
              <label htmlFor="designation">Designation</label>
              <input
                id="designation"
                name="designation"
                placeholder="Designation"
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <p className="register-user-error">{error}</p>}

          <div className="register-user-actions">
            <button type="submit" className="register-user-submit-btn">Register</button>
            {/* <button type="reset" className="register-user-reset-btn">Reset</button> */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUserPage;
