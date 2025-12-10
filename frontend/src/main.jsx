import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';   
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { BuyNowProvider } from './context/BuyNowContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <AuthProvider>                    
          <UserProvider>
            <BuyNowProvider>
              <CartProvider>
                  <App />
                  <ToastContainer position="top-center" />
              </CartProvider>
            </BuyNowProvider>
          </UserProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
