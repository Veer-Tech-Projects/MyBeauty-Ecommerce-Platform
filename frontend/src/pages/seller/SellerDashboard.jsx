import React, { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardCards from "./DashboardCards";
import { Card } from "react-bootstrap";
import "../../styles/SellerDashboard.css";

function SellerDashboard() {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);

  return (
    <div className="seller-dashboard-wrapper d-flex">
      <Sidebar />

      <div className="seller-dashboard-main flex-grow-1" style={{ marginLeft: "250px" }}>
       {/* 🔝 Fixed Top Navbar Style Topbar */}
        <div
          className="dashboard-topbar bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center position-fixed"
          style={{ top: 0, left: "250px", right: 0, height: "72px", zIndex: 1000 }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4 fw-bold text-dark">Seller Dashboard</span>
          </div>

          <div className="d-flex align-items-center gap-3 position-relative">
            <i className="bi bi-bell fs-5 text-muted"></i>
            <img
              src="http://localhost:5000/static/products/ai_image.jpg"
              alt="Profile"
              className="rounded-circle"
              style={{
                width: "36px",
                height: "36px",
                cursor: "pointer",
                objectFit: "cover",
              }}
              onClick={() => {
                setShowProfileCard(!showProfileCard);
                setShowEditCard(false);
              }}
            />

            {/* 👤 Profile Dropdown */}
            {showProfileCard && (
              <div
                className="position-absolute end-0 mt-2 p-3 rounded shadow bg-white"
                style={{ width: "220px", top: "50px" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Your Store</strong>
                  <i
                    className="bi bi-x-lg text-muted"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowProfileCard(false)}
                  ></i>
                </div>
                <button
                  className="btn btn-sm btn-light w-100 mb-2"
                  onClick={() => {
                    setShowEditCard(true);
                    setShowProfileCard(false);
                  }}
                >
                  <i className="bi bi-pencil me-1"></i> Edit Store Info
                </button>
                <button className="btn btn-sm btn-outline-danger w-100">
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            )}

            {/* ✏️ Edit Store Info Card */}
            {showEditCard && (
              <div
                className="position-absolute end-0 mt-2 p-3 rounded shadow bg-white"
                style={{ width: "250px", top: "50px" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Edit Store Info</strong>
                  <i
                    className="bi bi-x-lg text-muted"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowEditCard(false)}
                  ></i>
                </div>
                <div className="mb-2">
                  <label className="form-label">Store Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Your Store Name"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Store Logo</label>
                  <input type="file" className="form-control form-control-sm" />
                </div>
                <div className="text-end">
                  <button className="btn btn-sm btn-dark">Save</button>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* 📊 Dashboard Content */}
        <div className="mt-4">
          <DashboardCards />

          {/* Performance Graph Placeholder */}
          <div className="px-4 mt-4">
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Performance Overview</h6>
                <div className="text-muted small mb-2">Orders vs Returns (monthly)</div>
                <div
                  style={{
                    height: "280px",
                    background: "#f9f9f9",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  [Performance Graph Here]
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
