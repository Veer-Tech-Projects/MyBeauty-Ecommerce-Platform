import React from "react";
import { Link, useLocation } from "react-router-dom";
import "@/app/styles/SellerDashboard.css"; // Reuse existing styles

function Sidebar() {
  const location = useLocation();

  // Updated menu items to point to /admin routes
  const menuItems = [
    { name: "Dashboard", icon: "bi-grid", path: "/admin/dashboard" },
    { name: "Products", icon: "bi-box", path: "/admin/products" },
    { name: "Orders", icon: "bi-receipt", path: "/admin/orders" },
    { name: "Payments", icon: "bi-cash-coin", path: "/admin/payments" },
    { name: "Returns", icon: "bi-arrow-return-left", path: "/admin/returns" },
    // Address might be less relevant for Admin, but kept for "Warehouse Address" compatibility
    { name: "Address", icon: "bi-geo-alt", path: "/admin/address" },
    { name: "Add Product", icon: "bi-plus-circle", path: "/admin/add-product" },
    { name: "Shipping", icon: "bi-truck", path: "/admin/shipping" },
    { name: "Bank Details", icon: "bi-bank", path: "/admin/bank-details" },
  ];

  return (
    <div className="seller-sidebar d-flex flex-column shadow-sm p-3">
      <div className="sidebar-header mb-4">
        <div className="d-flex align-items-center gap-2">
          {/* Link back to home or strictly keep admin inside dashboard? 
              Usually admins might want to see the storefront. */}
          <Link to="/" className="text-dark back-icon-link">
            <i className="bi bi-shop fs-4 back-icon" title="Visit Store"></i>
          </Link>
          <h5 className="mb-0 fw-semibold sidebar-title">Admin Panel</h5>
        </div>
      </div>

      <ul className="nav flex-column gap-2">
        {menuItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              className={`nav-link px-3 py-2 rounded d-flex align-items-center gap-2 ${
                location.pathname.startsWith(item.path) ? "active" : "text-dark"
              }`}
            >
              <i className={`bi ${item.icon}`}></i>
              <span className="fw-medium">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;