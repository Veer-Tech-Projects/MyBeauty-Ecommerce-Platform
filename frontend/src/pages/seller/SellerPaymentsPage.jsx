import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Button,
  Table,
  Form,
  Image,
} from "react-bootstrap";
import "../../styles/SellerPaymentsPage.css";
import { NavLink } from "react-router-dom";

const SellerPaymentsPage = () => {
  const [tab, setTab] = useState("coming");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const settlements = [
    {
      id: "PROD001",
      name: "Product 1",
      image: "/images/product1.jpg",
      originalPrice: 1500,
      platformFee: 150,
      deliveryFee: 230,
      finalPayout: 7300,
    },
    {
      id: "PROD002",
      name: "Product 2",
      image: "/images/product2.jpg",
      originalPrice: 2200,
      platformFee: 220,
      deliveryFee: 70,
      finalPayout: 1500,
    },
    {
      id: "PROD003",
      name: "Product 3",
      image: "/images/product3.jpg",
      originalPrice: 800,
      platformFee: 80,
      deliveryFee: 40,
      finalPayout: 1220,
    },
    {
      id: "PROD004",
      name: "Product 4",
      image: "/images/product4.jpg",
      originalPrice: 1100,
      platformFee: 110,
      deliveryFee: 60,
      finalPayout: 1390,
    },
    {
      id: "PROD005",
      name: "Product 5",
      image: "/images/product5.jpg",
      originalPrice: 1400,
      platformFee: 140,
      deliveryFee: 80,
      finalPayout: 1600,
    },
    {
      id: "PROD006",
      name: "Product 6",
      image: "/images/product6.jpg",
      originalPrice: 1800,
      platformFee: 180,
      deliveryFee: 60,
      finalPayout: 1550,
    },
  ];

  const paginatedData = settlements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const total = settlements.reduce((sum, item) => sum + item.finalPayout, 0);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    const maxPages = Math.ceil(settlements.length / itemsPerPage);
    setCurrentPage((prev) => Math.min(prev + 1, maxPages));
  };

  return (
    <div className="seller-payments-page container-fluid py-4 px-3 px-md-4">
      <div className="d-flex align-items-center mb-4">
        <NavLink to={"/seller/dashboard"}>
        <i className="bi bi-arrow-left-circle me-2 fs-5 clickable-icon text-dark"></i>
        </NavLink>
        <h4 className="fw-semibold mb-0">Payments</h4>
      </div>

      {/* Summary Cards */}
        <Row className="g-4 mb-4">
          {[
            { label: "Total Earnings", amount: "₹75,200", icon: "wallet2" },
            { label: "Pending Amount", amount: "₹8,500", icon: "clock-history" },
            { label: "Coming Up Settlement", amount: "₹18,250", icon: "cash-coin" },
          ].map((item, idx) => (
            <Col md={4} key={idx}>
              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted mb-2">{item.label}</h6> {/* 👈 spacing increased */}
                    <h4 className="text-dark mb-0">{item.amount}</h4>
                  </div>
                  <div className="icon-box bg-light text-secondary">
                    <i className={`bi bi-${item.icon} fs-4`}></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>


      {/* Filter & Performance */}
      <Row className="g-4 mb-5">
        <Col md={8}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <h6 className="fw-semibold mb-3">Performance</h6>
              <div className="bg-light rounded p-5 text-center text-muted fs-6">
                <i className="bi bi-bar-chart fs-4 me-2 text-secondary"></i>Graph coming soon
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <h6 className="fw-semibold mb-3">Transaction Filters</h6>
              <Form.Select className="mb-3">
                <option>Ranges</option>
                <option>This Month</option>
                <option>Last 3 Months</option>
              </Form.Select>
              <Form.Select className="mb-3">
                <option>Status</option>
                <option>Completed</option>
                <option>Pending</option>
              </Form.Select>
              <Button variant="outline-primary" className="w-100">
                <i className="bi bi-download me-2"></i>Download Full Statement
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Custom Tabs */}
      <h5 className="mb-3 mt-2 fw-semibold">Settlements</h5>
      <div className="settlement-tabs d-flex flex-wrap gap-2 mb-4">
        {["Coming Up", "Pending", "Completed", "Returned"].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setTab(label.toLowerCase())}
            className={`settlement-tab-btn ${
              tab === label.toLowerCase() ? "active" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>


      {/* Table */}
      <div className="table-responsive bg-white shadow-sm rounded p-3 position-relative">
        <Table hover className="align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>Product ID</th>
              <th>Original Price</th>
              <th>Platform Fee</th>
              <th>Delivery Fee</th>
              <th>Final Payout</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => (
              <tr key={idx}>
                <td className="d-flex align-items-center gap-2">
                  <Image src={item.image} width="40" height="40" rounded />
                  {item.name}
                </td>
                <td>{item.id}</td>
                <td>₹{item.originalPrice}</td>
                <td>₹{item.platformFee}</td>
                <td>₹{item.deliveryFee}</td>
                <td className="text-dark fw-semibold">₹{item.finalPayout}</td>
                <td>
                  <i
                    className="bi bi-download text-secondary"
                    role="button"
                    title="Download"
                  ></i>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Pagination Controls */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handlePrev}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left"></i> Prev
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleNext}
              className="ms-2"
              disabled={currentPage * itemsPerPage >= settlements.length}
            >
              Next <i className="bi bi-chevron-right"></i>
            </Button>
          </div>
          <div className="fw-semibold text-end text-dark">
            Total This Week’s Collection: ₹{total}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPaymentsPage;
