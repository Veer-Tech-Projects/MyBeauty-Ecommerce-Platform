import React, { useState } from "react";
import { Card } from "react-bootstrap";
import Sidebar from "@/modules/Admin/components/Sidebar";
import DashboardCards from "@/modules/Admin/components/DashboardCards";
import { useAdminAuth } from "@/modules/admin/auth/hooks/useAdminAuth";
// Note: We use relative imports assuming you will place this in src/pages/admin/
import "@/app/styles/SellerDashboard.css"; // We preserve the styles

function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [showProfileCard, setShowProfileCard] = useState(false);

  const handleLogout = async () => {
    await logout();
    // Context will handle redirect to login
  };

  return (
    <div className="seller-dashboard-wrapper d-flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      <div className="seller-dashboard-main flex-grow-1" style={{ marginLeft: "250px" }}>
        
        {/* Top Navigation Bar */}
        <div
          className="dashboard-topbar bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center position-fixed"
          style={{ top: 0, left: "250px", right: 0, height: "72px", zIndex: 1000 }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4 fw-bold text-dark">Admin Dashboard</span>
          </div>

          <div className="d-flex align-items-center gap-3 position-relative">
            <i className="bi bi-bell fs-5 text-muted" role="button"></i>
            
            {/* Profile Section */}
            <div 
              className="d-flex align-items-center gap-2 cursor-pointer" 
              onClick={() => setShowProfileCard(!showProfileCard)}
              style={{ cursor: 'pointer' }}
            >
                <div className="text-end d-none d-sm-block">
                    <div className="fw-semibold small">{admin?.name || 'Admin'}</div>
                    <div className="text-muted" style={{fontSize: '0.75rem'}}>{admin?.role || 'Manager'}</div>
                </div>
                <img
                // Use a default avatar if no image available
                src={"https://ui-avatars.com/api/?name=" + (admin?.name || "Admin") + "&background=0D8ABC&color=fff"}
                alt="Profile"
                className="rounded-circle border"
                width="40"
                height="40"
                />
            </div>

            {/* Profile Dropdown Card */}
            {showProfileCard && (
              <div
                className="position-absolute bg-white shadow rounded p-3"
                style={{ top: "60px", right: "0", width: "250px", zIndex: 1050 }}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img
                    src={"https://ui-avatars.com/api/?name=" + (admin?.name || "Admin") + "&background=0D8ABC&color=fff"}
                    alt="Profile"
                    className="rounded-circle"
                    width="50"
                    height="50"
                  />
                  <div>
                    <h6 className="mb-0 fw-bold">{admin?.name || "Admin User"}</h6>
                    <small className="text-muted">{admin?.username}</small>
                  </div>
                </div>
                <hr />
                <button onClick={handleLogout} className="btn btn-sm btn-outline-danger w-100">
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-4" style={{ paddingTop: "72px" }}>
          <DashboardCards />

          {/* Performance Graph Placeholder - Preserved */}
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
                  <i className="bi bi-bar-chart-line fs-1 me-2"></i>
                  <span>Analytics Coming Soon</span>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;