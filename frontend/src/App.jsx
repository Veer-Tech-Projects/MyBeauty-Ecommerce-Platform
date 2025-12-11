import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext.jsx";

import FullScreenSpinner from "./components/FullScreenSpinner.jsx";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import BannerSlider from "./components/BannerSlider";
import CategorySection from "./components/CategorySection";
import ProductGrid from "./components/ProductGrid";

import UserProtectedRoute from "./components/UserProtectedRoute";

// ---------- BUYER PAGES ----------
import CategoryProductsPage from "./pages/CategoryProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import BestSellersPage from './pages/BestSellersPage';
import CartPage from "./pages/CartPage";
import CheckoutLayout from "./pages/CheckoutLayout";
import AddressStep from "./pages/steps/AddressStep";
import SummaryStep from "./pages/SummaryStep";
import PaymentStep from "./pages/steps/PaymentStep";
import OrderPlacedPage from "./pages/OrderPlaced";
import ProfilePage from "./pages/ProfilePage";
import MyOrders from "./pages/MyOrders";
import ShopPage from "./pages/ShopPage";
import HelpCenter from "./pages/HelpCenter";
import SearchResults from "./pages/SearchResults";

import Register from "./pages/Register";
import Login from "./pages/Login";

// ---------- ADMIN PAGES (The New Single-Seller Ecosystem) ----------
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductsPage from './pages/admin/AdminProductsPage'; // Was SellerProductsPage
import AdminAddProductPage from './pages/admin/AdminAddProductPage';
import EditProductPage from './pages/admin/EditProductPage';
import EditVariantPage from './pages/admin/EditVariantPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';
import AdminShippingPage from './pages/admin/AdminShippingPage';
import AdminAddressPage from './pages/admin/AdminAddressPage';
import AdminBankDetailsPage from './pages/admin/AdminBankDetailsPage';

import AdminProtectedRoute from './routes/AdminProtectedRoute';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./styles/Home.css";

function AppContent() {
  const { loading } = useContext(AuthContext);
  const location = useLocation();
  const isHome = location.pathname === "/";

  if (loading) return <FullScreenSpinner />;

  // Hide public navbar/bottom-nav for Admin routes
  const hideBottomNav = location.pathname.startsWith("/admin");
  const hideNavbar = location.pathname.startsWith("/admin");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {isHome && <BannerSlider />}

      <div className="main-wrapper">
        <Routes>

          {/* =========================================================
              PUBLIC STOREFRONT (Buyer Side)
             ========================================================= */}
          <Route path="/" element={<><CategorySection /><ProductGrid /></>} />
          <Route path="/category/:categoryId" element={<CategoryProductsPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/category/:categoryId/best-sellers" element={<BestSellersPage />} />
          <Route path="/cart" element={<div className="container"><CartPage /></div>} />

          {/* Auth (Customer) */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Buyer Routes */}
          <Route path="/checkout" element={<UserProtectedRoute><CheckoutLayout /></UserProtectedRoute>}>
            <Route path="address" element={<AddressStep />} />
            <Route path="summary" element={<SummaryStep />} />
            <Route path="payment" element={<PaymentStep />} />
            <Route index element={<Navigate to="address" replace />} />
          </Route>

          <Route path="/profile" element={<UserProtectedRoute><ProfilePage /></UserProtectedRoute>} />
          <Route path="/order-placed" element={<UserProtectedRoute><OrderPlacedPage /></UserProtectedRoute>} />
          <Route path="/my-orders" element={<UserProtectedRoute><MyOrders /></UserProtectedRoute>} />

          {/* Other Buyer Pages */}
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/search" element={<SearchResults />} />


          {/* =========================================================
              ADMIN DASHBOARD (Single Seller Operations)
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

      {!hideBottomNav && <BottomNav />}
    </>
  );
}

export default AppContent;