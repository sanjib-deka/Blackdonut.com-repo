import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import './utils/axiosSetup'; // <- add this line near top
import './index.css'

createRoot(document.getElementById('root')).render(
 
    <App />

)
