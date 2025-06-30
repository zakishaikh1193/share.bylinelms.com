import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const login = async (credentials) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, credentials);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Login failed' };
  }
};

const register = async (userData) => {
  try {
    const res = await axios.post(`${API_URL}/auth/register`, userData);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Registration failed' };
  }
};

export default { login, register };