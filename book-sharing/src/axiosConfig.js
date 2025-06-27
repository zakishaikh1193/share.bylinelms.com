// src/axiosConfig.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://share.bylinelms.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;