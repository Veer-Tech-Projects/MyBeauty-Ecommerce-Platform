import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/SellerDashboard.css";

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: "bi-grid", path: "/seller/dashboard" },
    { name: "Products", icon: "bi-box", path: "/seller/products" },
    { name: "Orders", icon: "bi-receipt", path: "/seller/orders" },
    { name: "Payments", icon: "bi-cash-coin", path: "/seller/payments" },
    { name: "Returns", icon: "bi-arrow-return-left", path: "/seller/returns" },
    { name: "Address", icon: "bi-geo-alt", path: "/seller/address" },
    { name: "Add Product", icon: "bi-plus-circle", path: "/seller/add-product" },
    { name: "Shipping", icon: "bi-truck", path: "/seller/shipping" },
    { name: "Bank Details", icon: "bi-bank", path: "/seller/bank-details" },
  ];

  return (
    <div className="seller-sidebar d-flex flex-column shadow-sm p-3">
      <div className="sidebar-header mb-4">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="text-dark back-icon-link">
            <i className="bi bi-arrow-left-short fs-4 back-icon"></i>
          </Link>
          <h5 className="mb-0 fw-semibold sidebar-title">Seller Tools</h5>
        </div>
      </div>

      <ul className="nav flex-column gap-2">
        {menuItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              className={`nav-link px-3 py-2 rounded d-flex align-items-center gap-2 ${
                location.pathname === item.path ? "active" : "text-dark"
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
