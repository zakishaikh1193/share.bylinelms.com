// src/axiosConfig.js
import axios from 'axios';

const instance = axios.create({
  // baseURL: 'https://share.bylinelms.com',
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;