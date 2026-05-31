import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'

// Set baseURL based on VITE_API_URL or fallback to local development URL
let apiURL = import.meta.env.VITE_API_URL;
if (apiURL) {
  if (!apiURL.endsWith('/api')) {
    apiURL = apiURL.endsWith('/') ? `${apiURL}api` : `${apiURL}/api`;
  }
} else {
  apiURL = 'http://localhost:5000/api';
}
axios.defaults.baseURL = apiURL;
axios.defaults.withCredentials = true;

// Interceptor to strip leading /api from relative request URLs to avoid duplication
axios.interceptors.request.use((config) => {
  if (config.baseURL && config.url && config.url.startsWith('/api')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  return config;
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster />
    </AuthProvider>
  </React.StrictMode>
)
