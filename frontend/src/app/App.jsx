// src/app/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/modules/User/auth/context/AuthProvider"; 

// --- NEW: Enterprise Admin Auth Imports ---
import { AdminAuthProvider } from "@/modules/admin/auth/context/AdminAuthContext";
import AdminProtectedRoute from "@/modules/admin/auth/guards/AdminProtectedRoute";
import AdminLogin from "@/modules/admin/pages/AdminLogin";

// --- Contexts ---
import { CartProvider } from "@/shared/context/CartContext";
import { BuyNowProvider } from "@/shared/context/BuyNowContext";

// --- Shared UI ---
import FullScreenSpinner from "@/shared/components/FullScreenSpinner";
import Navbar from "@/shared/components/Navbar";
import BottomNav from "@/shared/components/BottomNav";

// --- Feature Modules ---

// 1. Auth (User)
import Login from "@/modules/User/auth/pages/Login";
import Register from "@/modules/User/auth/pages/Register";
import ForgotPassword from "@/modules/User/auth/pages/ForgotPassword";
import ResetPassword from "@/modules/User/auth/pages/ResetPassword";
import ProtectedRoute from "@/modules/User/auth/components/ProtectedRoute";

// 2. Home
import HomePage from "@/modules/Home/HomePage";

// 3. Product
import CategoryProductsPage from "@/modules/Product/pages/CategoryProductsPage";
import ProductDetailPage from "@/modules/Product/pages/ProductDetailPage";
import BestSellersPage from "@/modules/Product/pages/BestSellersPage";
import ShopPage from "@/modules/Product/pages/ShopPage";
import SearchResults from "@/modules/Product/pages/SearchResults";

// 4. User (Protected Pages)
import ProfilePage from "@/modules/User/pages/ProfilePage";
import MyOrders from "@/modules/User/pages/MyOrders";
import OrderPlacedPage from "@/modules/User/pages/OrderPlacedPage";
import HelpCenter from "@/modules/User/pages/HelpCenter"; 
import AddressLayout from "@/modules/User/features/Address/AddressLayout"; 

// 5. Checkout
import CartPage from "@/modules/Checkout/pages/CartPage";
import CheckoutLayout from "@/modules/Checkout/pages/CheckoutLayout";
import AddressStep from "@/modules/Checkout/components/AddressStep";
import SummaryStep from "@/modules/Checkout/pages/SummaryStep";
import PaymentStep from "@/modules/Checkout/components/PaymentStep";

// 6. Admin Pages (Dashboard & Features)
import AdminDashboard from "@/modules/admin/pages/AdminDashboard";
import AdminProductsPage from "@/modules/admin/pages/AdminProductsPage";
import AdminAddProductPage from "@/modules/admin/pages/AdminAddProductPage";
import EditProductPage from "@/modules/admin/pages/EditProductPage";
import EditVariantPage from "@/modules/admin/pages/EditVariantPage";
import AdminOrdersPage from "@/modules/admin/pages/AdminOrdersPage";
import AdminPaymentsPage from "@/modules/admin/pages/AdminPaymentsPage";
import AdminReturnsPage from "@/modules/admin/pages/AdminReturnsPage";
import AdminShippingPage from "@/modules/admin/pages/AdminShippingPage";
import AdminAddressPage from "@/modules/admin/pages/AdminAddressPage";
import AdminBankDetailsPage from "@/modules/admin/pages/AdminBankDetailsPage";

// Styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "@/app/styles/Home.css"; 

// --- Internal Component to handle Loading State ---
function AppRoutes() {
  const { isInitialized } = useAuth(); // User Auth Hook
  const location = useLocation();

  // 1. Wait for User Session Check
  if (!isInitialized) {
    return <FullScreenSpinner />;
  }

  // 2. Hide Navbar/BottomNav on specific routes
  const hideNav = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/admin',
    '/checkout'
  ].some(path => location.pathname.startsWith(path));

  return (
    <>
      {!hideNav && <Navbar />}

      <div className="main-wrapper">
        <Routes>

          {/* =========================================================
              PUBLIC STOREFRONT (Buyer Side)
             ========================================================= */}
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryId" element={<CategoryProductsPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/category/:categoryId/best-sellers" element={<BestSellersPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/help" element={<HelpCenter />} />

          {/* =========================================================
              AUTHENTICATION (User)
             ========================================================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* =========================================================
              PROTECTED USER ROUTES
             ========================================================= */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/order-placed" element={
            <ProtectedRoute>
              <OrderPlacedPage />
            </ProtectedRoute>
          } />
          
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          } />

          <Route path="/addresses" element={
            <ProtectedRoute>
              <AddressLayout />
            </ProtectedRoute>
          } />

          {/* =========================================================
              CHECKOUT MODULE
             ========================================================= */}
          <Route path="/cart" element={<div className="container"><CartPage /></div>} />
          
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutLayout />
            </ProtectedRoute>
          }>
            <Route path="address" element={<AddressStep />} />
            <Route path="summary" element={<SummaryStep />} />
            <Route path="payment" element={<PaymentStep />} />
            <Route index element={<Navigate to="address" replace />} />
          </Route>

          {/* =========================================================
              ADMIN MODULE (Enterprise Auth)
             ========================================================= */}
          
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes Wrapper */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />

          {/* Product Management */}
          <Route path="/admin/products" element={
            <AdminProtectedRoute>
              <AdminProductsPage />
            </AdminProtectedRoute>
          } />
          
          <Route path="/admin/add-product" element={
            <AdminProtectedRoute>
              <AdminAddProductPage />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/edit-product/:id" element={
            <AdminProtectedRoute>
              <EditProductPage />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/edit-variant/:id" element={
            <AdminProtectedRoute>
              <EditVariantPage />
            </AdminProtectedRoute>
          } />

          {/* Order & Operations Management */}
          <Route path="/admin/orders" element={
            <AdminProtectedRoute>
              <AdminOrdersPage />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/payments" element={
            <AdminProtectedRoute>
              <AdminPaymentsPage />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/returns" element={
            <AdminProtectedRoute>
              <AdminReturnsPage />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/shipping" element={
            <AdminProtectedRoute>
              <AdminShippingPage />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/address" element={
            <AdminProtectedRoute>
              <AdminAddressPage />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/bank-details" element={
            <AdminProtectedRoute>
              <AdminBankDetailsPage />
            </AdminProtectedRoute>
          } />

          {/* 404 Fallback */}
          <Route path="*" element={<div className="p-5 text-center"><h1>404 - Not Found</h1></div>} />

        </Routes>
      </div>

      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <BuyNowProvider>
             <AppRoutes />
          </BuyNowProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;