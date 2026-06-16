import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject role and affiliate id headers from local storage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const role = localStorage.getItem('mock_role');
    const affiliateId = localStorage.getItem('mock_affiliate_id');
    
    if (role) {
      config.headers['X-Role'] = role;
    }
    if (affiliateId) {
      config.headers['X-Affiliate-ID'] = affiliateId;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
