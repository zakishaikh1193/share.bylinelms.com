import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/manage-user-css/users.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
 
 
export default function EditUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    organization: '',
    designation: '',
    password: ''
  });
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
 
        const userRes = await axios.get(`/api/user/${userId}`, { headers });
 
        setFormData({
          name: userRes.data.name || '',
          email: userRes.data.email || '',
          role: userRes.data.role || '',
          status: userRes.data.status || '',
          organization: userRes.data.organization || '',
          designation: userRes.data.designation || '',
          password: ''
        });
 
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.response?.data?.error || 'Failed to fetch user details');
        setLoading(false);
      }
    };
 
    fetchData();
  }, [userId]);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
 
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
 
      const payload = { ...formData };
      if (!payload.password.trim()) delete payload.password;
 
      await axios.put(`/api/user/${userId}`, payload, { headers });
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
      <div className="edit-user-header space-y-4">
        {/* Back Link */}
        <div
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 cursor-pointer transition"
          onClick={() => navigate('/admin/users')}
        >
          <span className="back-btn text-xl">←Back</span>
        </div>
 
        {/* Centered Heading */}
        <div style={{ width: '100%' }}>
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '24px' }}>
            Edit User
          </h2>
        </div>
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
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
 
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
 
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} required>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>

            </select>
          </div>
 
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} required>
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
 
          <div className="form-group">
            <label htmlFor="organization">Organization</label>
            <input type="text" id="organization" name="organization" value={formData.organization} onChange={handleChange} />
          </div>
 
          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <input type="text" id="designation" name="designation" value={formData.designation} onChange={handleChange} />
          </div>
 
          <div className="form-group">
            <label htmlFor="password">Password <span style={{ fontWeight: 'normal', fontSize: '0.85em' }}>(Leave blank to keep unchanged)</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
              />
              <span
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#555'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
        </div>
 
        <div className="form-actions">
          <button type="submit" className="save-btn">Save Changes</button>
        </div>
      </form>
    </div>
  );
}