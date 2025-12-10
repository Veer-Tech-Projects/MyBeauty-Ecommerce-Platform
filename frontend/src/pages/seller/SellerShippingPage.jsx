import React, { useState } from "react";
import { Button, Card, Badge, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/SellerShippingPage.css";

const dummyOrders = [
  {
    id: "ORD123456",
    serial: 1,
    date: "2025-07-19 10:30 AM",
    status: "Packed",
    paymentMode: "Paid",
    product: {
      name: "Men's Cotton Shirt",
      image: "http://localhost:5000/static/products/earrings.jpg",
      qty: 2,
      weight: "450g",
      dimensions: "25 x 15 x 4 cm",
      tracking: "https://shiptracking.com/ORD123456"
    },
    shipping: {
      courier: "Delhivery",
      awb: "AWB987654321",
      pickup: "Scheduled",
      estDelivery: "2025-07-21"
    },
    buyer: {
      name: "Ravi Kumar",
      phone: "9876543210",
      address: "14 MG Road, Indiranagar, Bangalore, KA 560038"
    }
  },
  // Add more dummy orders
];

const SellerShippingPage = () => {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredOrders = dummyOrders
    .filter(order => filter === "All" || order.status === filter)
    .filter(order =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="seller-shipping-page container-fluid px-4 py-4" style={{ inset: 0 }}>
  {/* Back Icon + Title */}
  <div className="d-flex align-items-center mb-4">
   <i
          className="bi bi-arrow-left-circle me-2 clickable-icon text-dark"
          onClick={() => navigate("/seller/dashboard")}
        ></i>
    <h4 className="fw-semibold mb-0">Shipping & Fulfillment</h4>
  </div>

  {/* Filter Tabs + Search */}
<div className="mb-4 d-flex flex-wrap justify-content-between align-items-center shipping-controls gap-2">
  {/* Black Pills */}
  <div className="filter-tabs d-flex flex-wrap gap-2">
    {["All", "Packed", "Completed", "Cancelled"].map(status => (
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

  {/* Longer Search Box */}
  <InputGroup
    className="search-box shadow-sm rounded-pill border overflow-hidden"
    style={{ maxWidth: "420px", width: "100%" }}
  >
    <Form.Control
      size="sm"
      className="border-0 ps-3 rounded-pill"
      placeholder="Search Order ID or Product"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <Button variant="dark" size="sm" className="px-3 rounded-end-pill">
      <i className="bi bi-search"></i>
    </Button>
  </InputGroup>
</div>


  {/* Orders List */}
  {filteredOrders.map((order, index) => (
    <Card className="order-card mb-4 shadow-sm border-0 rounded-4" key={index}>
      <Card.Body>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h6 className="fw-bold mb-1 text-dark">
              {order.serial}. &nbsp;|&nbsp; Order ID: <span className="text-primary">{order.id}</span>
            </h6>
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i> Placed on {order.date}
            </small>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Badge bg={order.paymentMode === "Paid" ? "success" : "warning"} className="d-flex align-items-center gap-1 px-2 py-1">
              <i className={order.paymentMode === "Paid" ? "bi bi-currency-rupee" : "bi bi-cash-stack"}></i>
              {order.paymentMode}
            </Badge>
            <Badge
              bg={
                order.status === "Packed"
                  ? "info"
                  : order.status === "Cancelled"
                  ? "danger"
                  : order.status === "Completed"
                  ? "success"
                  : "secondary"
              }
              className="d-flex align-items-center gap-1 px-2 py-1"
            >
              <i className="bi bi-box-seam"></i> {order.status}
            </Badge>
          </div>
        </div>

        {/* Product Summary */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <img src={order.product.image} alt={order.product.name} className="product-thumb rounded border" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
          <div>
            <div className="fw-semibold">{order.product.name}</div>
            <div className="text-muted small">Qty: {order.product.qty}</div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <Card className="info-card h-100 shadow-sm border-0 rounded-3">
              <Card.Body>
                <h6 className="fw-semibold mb-3 text-primary">
                  <i className="bi bi-box-seam me-2"></i> Product Details
                </h6>
                <div className="mb-2"><i className="bi bi-weight text-muted me-2"></i> Weight: <strong>{order.product.weight}</strong></div>
                <div className="mb-2"><i className="bi bi-arrows-fullscreen text-muted me-2"></i> Dimensions: <strong>{order.product.dimensions}</strong></div>
                <div className="mb-2"><i className="bi bi-info-circle text-muted me-2"></i> Status: <span className="badge bg-warning text-dark">{order.status}</span></div>
                <div><i className="bi bi-truck text-muted me-2"></i> Tracking: <a href={order.product.tracking} target="_blank" rel="noopener noreferrer">View</a></div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-lg-4">
            <Card className="info-card h-100 shadow-sm border-0 rounded-3">
              <Card.Body>
                <h6 className="fw-semibold mb-3 text-danger">
                  <i className="bi bi-geo-alt-fill me-2"></i> Shipping Address
                </h6>
                <div className="mb-2"><i className="bi bi-person text-muted me-2"></i> {order.buyer.name}</div>
                <div className="mb-2"><i className="bi bi-telephone text-muted me-2"></i> {order.buyer.phone}</div>
                <div><i className="bi bi-geo-fill text-muted me-2"></i> {order.buyer.address}</div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-lg-4">
            <Card className="info-card h-100 shadow-sm border-0 rounded-3">
              <Card.Body>
                <h6 className="fw-semibold mb-3 text-success">
                  <i className="bi bi-truck-front-fill me-2"></i> Shipping Details
                </h6>
                <div className="mb-2"><i className="bi bi-box2-heart text-muted me-2"></i> Courier: <strong>{order.shipping.courier}</strong></div>
                <div className="mb-2"> AWB: <strong>{order.shipping.awb}</strong></div>
                <div className="mb-2"><i className="bi bi-check2-square text-muted me-2"></i> Pickup: <span className="text-success">{order.shipping.pickup}</span></div>
                <div><i className="bi bi-calendar-check text-muted me-2"></i> Est. Delivery: {order.shipping.estDelivery}</div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="text-end mt-3 d-flex flex-wrap justify-content-end gap-2">
          <Button variant="dark" size="sm" className="d-flex align-items-center gap-1 px-3 rounded-pill">
            <i className="bi bi-printer-fill"></i> Print Invoice
          </Button>

          {order.status === "Cancelled" && (
            <Button variant="dark" size="sm" className="d-flex align-items-center gap-1 px-3 rounded-pill">
              <i className="bi bi-arrow-repeat"></i> Retry Pickup
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  ))}

  {/* Pagination */}
  <div className="d-flex justify-content-end mt-4 gap-2">
    <Button variant="outline-dark" size="sm" className="rounded-pill px-3">
      <i className="bi bi-chevron-left me-1"></i> Prev
    </Button>
    <Button variant="outline-dark" size="sm" className="rounded-pill px-3">
      Next <i className="bi bi-chevron-right ms-1"></i>
    </Button>
  </div>
</div>

  );
};

export default SellerShippingPage;
