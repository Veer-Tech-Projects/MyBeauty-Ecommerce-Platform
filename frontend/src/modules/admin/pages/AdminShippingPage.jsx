import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin";
import "@/app/styles/SellerShippingPage.css"; // Reuse styles

const AdminShippingPage = () => {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [shipments, setShipments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch shipping data
    axiosAdmin.get('/api/admin/orders/shipping')
      .then(res => setShipments(res.data || []))
      .catch(err => console.error("Shipping fetch error", err));
  }, []);

  const filteredOrders = shipments
    .filter(order => filter === "All" || order.status === filter)
    .filter(order =>
      (order.id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="seller-shipping-page container-fluid px-4 py-4" style={{ inset: 0 }}>
      <div className="d-flex align-items-center mb-4">
        <i
          className="bi bi-arrow-left-circle me-2 clickable-icon text-dark"
          onClick={() => navigate("/admin/dashboard")}
        ></i>
        <h4 className="fw-semibold mb-0">Shipping & Fulfillment</h4>
      </div>

      <div className="mb-4 d-flex flex-wrap justify-content-between align-items-center shipping-controls gap-2">
        <div className="filter-tabs d-flex flex-wrap gap-2">
          {["All", "Packed", "Shipped", "Delivered", "Cancelled"].map(status => (
            <Button
              key={status}
              variant={filter === status ? "dark" : "outline-dark"}
              size="sm"
              className="rounded-pill px-3 py-1"
              onClick={() => setFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>

        <InputGroup className="search-box shadow-sm rounded-pill border overflow-hidden" style={{ maxWidth: "420px", width: "100%" }}>
          <Form.Control
            size="sm"
            className="border-0 ps-3 rounded-pill"
            placeholder="Search Order ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="dark" size="sm" className="px-3 rounded-end-pill">
            <i className="bi bi-search"></i>
          </Button>
        </InputGroup>
      </div>

      {filteredOrders.length > 0 ? filteredOrders.map((order, index) => (
        <Card className="order-card mb-4 shadow-sm border-0 rounded-4" key={index}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div>
                <h6 className="fw-bold mb-1 text-dark">
                  Order ID: <span className="text-primary">{order.id}</span>
                </h6>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i> Placed on {new Date(order.created_at).toLocaleDateString()}
                </small>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <Badge bg={order.payment_method === "Paid" ? "success" : "warning"} className="d-flex align-items-center gap-1 px-2 py-1">
                   {order.payment_method}
                </Badge>
                <Badge bg="info" className="d-flex align-items-center gap-1 px-2 py-1">
                  <i className="bi bi-box-seam"></i> {order.status}
                </Badge>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-lg-4">
                <Card className="info-card h-100 shadow-sm border-0 rounded-3">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3 text-primary">Shipping Details</h6>
                    <div className="mb-2">Courier: <strong>{order.courier_name || 'Not assigned'}</strong></div>
                    <div className="mb-2">AWB: <strong>{order.awb_code || 'Pending'}</strong></div>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-lg-8">
                 <Card className="info-card h-100 shadow-sm border-0 rounded-3">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3 text-danger">Address</h6>
                    <p className="mb-0 text-muted">{order.address}</p>
                  </Card.Body>
                </Card>
              </div>
            </div>

            <div className="text-end mt-3 d-flex flex-wrap justify-content-end gap-2">
              <Button variant="dark" size="sm" className="d-flex align-items-center gap-1 px-3 rounded-pill">
                <i className="bi bi-printer-fill"></i> Label
              </Button>
            </div>
          </Card.Body>
        </Card>
      )) : (
          <div className="text-center py-5 text-muted">No shipments found.</div>
      )}
    </div>
  );
};

export default AdminShippingPage;