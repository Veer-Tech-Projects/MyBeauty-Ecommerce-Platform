// src/components/seller/DashboardCards.jsx
import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function DashboardCards() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Coming up Settlements",
      subtitle: "View your next payout",
      icon: "bi-currency-rupee",
      iconColor: "text-success",
      onClick: () => navigate("/seller/payments"),
    },
    {
      title: "New Orders",
      subtitle: "Go to Order Management",
      icon: "bi-cart-check",
      iconColor: "text-primary",
      onClick: () => navigate("/seller/orders"),
    },
    {
      title: "Returns",
      subtitle: "Manage return requests",
      icon: "bi-arrow-counterclockwise",
      iconColor: "text-danger",
      onClick: () => navigate("/seller/returns"),
    },
    {
      title: "Out of Stock",
      subtitle: "Update product inventory",
      icon: "bi-box-seam",
      iconColor: "text-warning",
      onClick: () => navigate("/seller/products"),
    },
    {
      title: "Feature on Main Banner",
      subtitle: "Request homepage banner slot",
      icon: "bi-image",
      iconColor: "text-info",
      onClick: () => navigate("/seller/feature-banner"),
    },
    {
      title: "Promote Products",
      subtitle: "Run ad campaigns",
      icon: "bi-megaphone",
      iconColor: "text-secondary",
      onClick: () => navigate("/seller/promotions"),
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
