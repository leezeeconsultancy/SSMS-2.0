import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// Configure global Axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
