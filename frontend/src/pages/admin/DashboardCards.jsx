import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function DashboardCards() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Recent Payments", // Renamed from Settlements
      subtitle: "View received payments",
      icon: "bi-currency-rupee",
      iconColor: "text-success",
      onClick: () => navigate("/admin/payments"),
    },
    {
      title: "New Orders",
      subtitle: "Go to Order Management",
      icon: "bi-cart-check",
      iconColor: "text-primary",
      onClick: () => navigate("/admin/orders"),
    },
    {
      title: "Returns",
      subtitle: "Manage return requests",
      icon: "bi-arrow-counterclockwise",
      iconColor: "text-danger",
      onClick: () => navigate("/admin/returns"),
    },
    {
      title: "Products",
      subtitle: "Manage Inventory",
      icon: "bi-box-seam",
      iconColor: "text-warning",
      onClick: () => navigate("/admin/products"),
    },
    {
      title: "Store Banners",
      subtitle: "Manage homepage banners",
      icon: "bi-image",
      iconColor: "text-info",
      // Feature-banner page might not exist yet, keeping placeholder path
      onClick: () => navigate("/admin/feature-banner"), 
    },
    {
      title: "Promotions",
      subtitle: "Run ad campaigns",
      icon: "bi-megaphone",
      iconColor: "text-secondary",
      onClick: () => navigate("/admin/promotions"),
    },
  ];

  return (
    <Row className="px-4 mt-4">
      {cards.map((card, idx) => (
        <Col key={idx} md={4} className="mb-4">
          <Card
            className="dashboard-tile-card shadow-sm h-100"
            role="button"
            onClick={card.onClick}
          >
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold mb-1">{card.title}</div>
                <small className="text-muted">{card.subtitle}</small>
              </div>
              <i className={`bi ${card.icon} fs-3 ${card.iconColor}`}></i>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default DashboardCards;