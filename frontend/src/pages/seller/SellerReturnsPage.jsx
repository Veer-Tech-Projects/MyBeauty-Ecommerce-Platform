
import React, { useState } from "react";
import { Button, Modal, Table, Badge, Card, Row, Col, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/SellerReturnsPage.css";

export default function SellerReturnsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [showAcceptSummary, setShowAcceptSummary] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const returnRequests = [
    {
      id: "RET12345",
      productImage: "http://localhost:5000/static/products/earrings.jpg",
      productName: "Wireless Earbuds",
      buyerName: "Rahul Mehta",
      reason: "Product damaged",
      date: "2025-07-16",
      status: "Pending",
      invoice: "#INV1021",
      shippingFee: "₹120 (₹60 FWD + ₹60 RTN)",
    },
    {
      id: "RET12346",
      productImage: "http://localhost:5000/static/products/bangle1.jpg",
      productName: "Fitness Tracker Band",
      buyerName: "Sneha Kapoor",
      reason: "Wrong item delivered",
      date: "2025-07-17",
      status: "Pending",
      invoice: "#INV1022",
      shippingFee: "₹160 (₹80 FWD + ₹80 RTN)",
    },
    
  ];

  const filteredReturns = activeTab === "All" ? returnRequests : returnRequests.filter(r => r.status === activeTab);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAccept = (id) => {
    setSelectedReturnId(id);
    setShowAcceptSummary(true);
  };

  const handleReject = (id) => {
    setSelectedReturnId(id);
    setShowRejectModal(true);
  };

  return (
    <div className="seller-returns-page">
      <div className="returns-container">
        <h5 className="d-flex align-items-center mb-4">
          <i
            className="bi bi-arrow-left-circle me-2 clickable-icon"
            onClick={() => navigate("/seller/dashboard")}
          ></i>
          <h4 className="fw-semibold mb-0">Returns</h4>
        </h5>

        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="text-muted mb-1">Total Returns</h6>
                <h4 className="text-dark mb-0">
                  2 <i className="bi bi-arrow-repeat ms-2 text-secondary fs-5"></i>
                </h4>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="text-muted mb-1">Approved</h6>
                <h4 className="text-dark mb-0">
                  0 <i className="bi bi-check-circle ms-2 text-success fs-5"></i>
                </h4>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="text-muted mb-1">Rejected</h6>
                <h4 className="text-dark mb-0">
                  0 <i className="bi bi-x-circle ms-2 text-danger fs-5"></i>
                </h4>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm border-0 mb-5 p-4">
          <h6 className="mb-3">Returns Rate</h6>
          <div className="return-graph-placeholder">📊 Graph Placeholder</div>
        </Card>

        <h6 className="section-heading mb-3">Return Requests</h6>
          <div className="return-tabs mb-4">
            {["All", "Pending", "Approved", "Rejected"].map((tab) => (
              <button
                key={tab}
                className={`return-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
              >
                {tab}
              </button>
            ))}
          </div>


        <div className="table-responsive bg-white rounded shadow-sm p-3">
          <Table hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th>No.</th>
                <th>Product</th>
                <th>Buyer</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th>Invoice</th>
                <th>Shipping Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReturns.map((item, idx) => (
                <tr key={item.id}>
                  <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="d-flex align-items-center gap-2">
                    <img src={item.productImage} alt={item.productName} className="return-product-img" />
                    <div><strong>{item.productName}</strong></div>
                  </td>
                  <td>{item.buyerName}</td>
                  <td>{item.reason}</td>
                  <td>{item.date}</td>
                  <td>
                    <Badge bg="warning" text="dark">{item.status}</Badge>
                  </td>
                  <td>
                    <Button variant="outline-dark" size="sm">
                      <i className="bi bi-file-earmark-text"></i>
                    </Button>
                  </td>
                  <td>{item.status === "Approved" ? item.shippingFee : "₹60 (FWD)"}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-success" onClick={() => handleAccept(item.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleReject(item.id)}>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredReturns.length > itemsPerPage && (
            <div className="d-flex justify-content-end mt-3">
              <Button variant="outline-secondary" size="sm" className="me-2" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                Prev
              </Button>
              <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Accept Summary Modal */}
        <Modal show={showAcceptSummary} onHide={() => setShowAcceptSummary(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Accept Return</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Forward + Return shipping costs will apply.</p>
            <p><strong>Shipping Fee:</strong> ₹120 (₹60 forward + ₹60 return)</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowAcceptSummary(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={() => setShowAcceptSummary(false)}>
              Confirm Accept
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Reject Modal */}
        <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Reject Return</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <label>Reason for Rejection</label>
            <textarea
              className="form-control mt-2"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <p className="mt-3">Are you sure this claim is invalid?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={!rejectReason.trim()} onClick={() => setShowRejectModal(false)}>
              Confirm Reject
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}
