import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Import mo ito
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Dapat balot ng BrowserRouter para gumana ang navigate at routes */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)