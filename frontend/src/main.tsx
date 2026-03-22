import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// Configure global Axios defaults
axios.defaults.withCredentials = true;
// Relative URLs will use the current origin (essential for mobile access via IP)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
