import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "../../styles/manage-user-css/UserEdit.css";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    expiry: '',
    organization: '',
    department: '',
    designation: '',
    status: '',
    notes: '',
    profileImage: '',
    dashboardLogo: ''
  });

  useEffect(() => {
    const user = storedUsers.find((u) => u.id === Number(id));
    if (user) {
      const expiryFormatted = user.expiry
        ? new Date(user.expiry).toISOString().split('T')[0]
        : '';
      setFormData({ ...user, expiry: expiryFormatted });
    } else {
      alert('User not found');
      navigate('/users');
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedUsers = storedUsers.map((user) =>
      user.id === Number(id)
        ? {
            ...formData,
            id: Number(id),
            expiry: formData.expiry
              ? new Date(formData.expiry).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '',
          }
        : user
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    alert('User updated successfully!');
    navigate('/users');
  };

  return (
    <div className="user-edit-page">
      <h2>Update User</h2>
      <form className="user-edit-form" onSubmit={handleSubmit}>
        <div className="profile-section">
          <label htmlFor="profileImage">Profile Image</label>
          <div className="profile-img-wrapper">
            <img src={formData.profileImage || '/default-avatar.png'} alt="Profile" />
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-fields">
          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
          <select name="role" value={formData.role} onChange={handleChange} required>
            <option value="">Select Role</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
          <input name="password" type="password" placeholder="New Password (leave blank to keep current)" onChange={handleChange} />
          <input name="expiry" type="date" value={formData.expiry} onChange={handleChange} />
          <input name="organization" placeholder="Organization" value={formData.organization} onChange={handleChange} />
          <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} />
          <input name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} />

          <label htmlFor="dashboardLogo">Dashboard Logo</label>
          <input type="file" name="dashboardLogo" accept="image/*" onChange={handleChange} />
          {formData.dashboardLogo && <img className="logo-preview" src={formData.dashboardLogo} alt="Dashboard Logo" />}

          <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleChange} />
        </div>

        <div className="form-buttons">
          <button type="button" className="cancel-btn" onClick={() => navigate('/users')}>Cancel</button>
          <button type="submit" className="update-btn">Update</button>
        </div>
      </form>
    </div>
  );
}