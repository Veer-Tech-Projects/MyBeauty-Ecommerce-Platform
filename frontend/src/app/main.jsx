// src/app/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
// App Entry
import App from './App.jsx'
// Global Styles
import '../index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
        <App />
        <ToastContainer position="top-center" autoClose={2000} />
    </BrowserRouter>
  </React.StrictMode>,
)