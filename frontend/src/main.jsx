/**
 * Point d'entrée de l'application React
 * Configure le rendu et les styles globaux
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Rendu de l'application dans le DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)