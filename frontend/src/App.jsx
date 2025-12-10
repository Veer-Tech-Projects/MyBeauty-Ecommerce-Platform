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


import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import EditProductPage from "./pages/seller/EditProductPage";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerPaymentsPage from "./pages/seller/SellerPaymentsPage";
import SellerReturnsPage from "./pages/seller/SellerReturnsPage";
import SellerAddressPage from "./pages/seller/SellerAddressPage";
import AdminAddProductPage from "./pages/seller/AdminAddProductPage.jsx";
import SellerShippingPage from './pages/seller/SellerShippingPage';
import SellerBankDetailsPage from "./pages/seller/SellerBankDetailsPage";
import EditVariantPage from "./pages/seller/EditVariantPage";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./styles/Home.css";

 // --------------: Admin Auth :-----------------
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProtectedRoute from './routes/AdminProtectedRoute';

function AppContent() {
  const { loading } = useContext(AuthContext);
  const location = useLocation();
  const isHome = location.pathname === "/";

  if (loading) return <FullScreenSpinner />;

  const hideBottomNav = location.pathname.startsWith("/seller");
  const hideNavbar = location.pathname.startsWith("/seller");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {isHome && <BannerSlider />}

      <div className="main-wrapper">
        <Routes>

          {/* ---------- PUBLIC STORE ---------- */}
          <Route path="/" element={<><CategorySection /><ProductGrid /></>} />
          <Route path="/category/:categoryId" element={<CategoryProductsPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/category/:categoryId/best-sellers" element={<BestSellersPage />} />
          <Route path="/cart" element={<div className="container"><CartPage /></div>} />

          {/* ---------- AUTH (CUSTOMER) ---------- */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* ---------- PROTECTED BUYER ROUTES ---------- */}
          <Route path="/checkout" element={<UserProtectedRoute><CheckoutLayout /></UserProtectedRoute>}>
            <Route path="address" element={<AddressStep />} />
            <Route path="summary" element={<SummaryStep />} />
            <Route path="payment" element={<PaymentStep />} />
            <Route index element={<Navigate to="address" replace />} />
          </Route>


          <Route path="/profile" element={<UserProtectedRoute><ProfilePage /></UserProtectedRoute>} />
          <Route path="/order-placed" element={<UserProtectedRoute><OrderPlacedPage /></UserProtectedRoute>} />
          <Route path="/my-orders" element={<UserProtectedRoute><MyOrders /></UserProtectedRoute>} />

          {/* ---------- OTHER BUYER PAGES ---------- */}
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/search" element={<SearchResults />} />

          {/* ---------- PROTECTED SELLER ROUTES ---------- */}
          <Route path="/seller/dashboard" element={<SellerDashboard/>} />
          <Route path="/seller/products" element={<SellerProductsPage />} />
          <Route path="/seller/edit-product/:id" element={<EditProductPage />} />
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
          <Route path="/seller/payments" element={<SellerPaymentsPage />} />
          <Route path="/seller/returns" element={<SellerReturnsPage />} />
          <Route path="/seller/address" element={<SellerAddressPage />} />
          <Route path="/seller/shipping" element={<SellerShippingPage />} />
          <Route path="/seller/bank-details" element={<SellerBankDetailsPage />} />
          <Route path="/seller/edit-variant/:id" element={<EditVariantPage />} />

          {/* -------------- Admin ------------------ */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route path="/admin/add-product" element={<AdminAddProductPage />} />

          {/* 404 */}
          <Route path="*" element={<div className="p-5 text-center"><h1>404 - Not Found</h1></div>} />

        </Routes>
      </div>

      {!hideBottomNav && <BottomNav />}
    </>
  );
}

export default AppContent;
