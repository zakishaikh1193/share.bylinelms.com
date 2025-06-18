import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig';
import '../../styles/explorePageCss/LoginPage.css';
import logo from '../../../src/assests/images/logo.jpg';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/login', { email, password });
      const { token, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-shapes"></div>
      <div className="login-header">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      <div className="login-box">
        <h2>Sign In to your Account</h2>
        <p>
          Welcome! Please enter your details<br />
          {/* <a href="#">Did you forget your password?</a> */}
        </p>
        <form onSubmit={handleLogin}>
          <div className="input-icon-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-icon-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <p className="error">{error}</p>}
          <button type="submit">Log In</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
