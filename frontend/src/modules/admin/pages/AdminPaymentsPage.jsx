import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Table, Form, Image } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin";
import "@/app/styles/SellerPaymentsPage.css"; // Reuse styles

const AdminPaymentsPage = () => {
  const [tab, setTab] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, today: 0 });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchPayments();
  }, [tab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axiosAdmin.get("/api/admin/payments", {
        params: { type: tab }
      });
      setTransactions(res.data.transactions || []);
      setStats(res.data.stats || { total: 0, pending: 0, today: 0 });
    } catch (err) {
      console.error("Fetch payments failed", err);
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => {
    const maxPages = Math.ceil(transactions.length / itemsPerPage);
    setCurrentPage((prev) => Math.min(prev + 1, maxPages));
  };

  return (
    <div className="seller-payments-page container-fluid py-4 px-3 px-md-4">
      <div className="d-flex align-items-center mb-4">
        <NavLink to={"/admin/dashboard"}>
          <i className="bi bi-arrow-left-circle me-2 fs-5 clickable-icon text-dark"></i>
        </NavLink>
        <h4 className="fw-semibold mb-0">Financial Overview</h4>
      </div>

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        {[
          { label: "Total Revenue", amount: `₹${stats.total}`, icon: "wallet2" },
          { label: "Pending (COD)", amount: `₹${stats.pending}`, icon: "clock-history" },
          { label: "Collected Today", amount: `₹${stats.today}`, icon: "cash-coin" },
        ].map((item, idx) => (
          <Col md={4} key={idx}>
            <Card className="shadow-sm border-0">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">{item.label}</h6>
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
              <h6 className="fw-semibold mb-3">Revenue Performance</h6>
              <div className="bg-light rounded p-5 text-center text-muted fs-6">
                <i className="bi bi-bar-chart fs-4 me-2 text-secondary"></i>
                Analytics Graph Coming Soon
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <h6 className="fw-semibold mb-3">Filters</h6>
              <Form.Select className="mb-3">
                <option>This Month</option>
                <option>Last 3 Months</option>
              </Form.Select>
              <Form.Select className="mb-3">
                <option>All Statuses</option>
                <option>Completed</option>
                <option>Pending</option>
              </Form.Select>
              <Button variant="outline-primary" className="w-100">
                <i className="bi bi-download me-2"></i>Export Report
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h5 className="mb-3 mt-2 fw-semibold">Transactions</h5>
      <div className="settlement-tabs d-flex flex-wrap gap-2 mb-4">
        {["All", "Online", "COD", "Refunds"].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setTab(label.toLowerCase())}
            className={`settlement-tab-btn ${tab === label.toLowerCase() ? "active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="table-responsive bg-white shadow-sm rounded p-3 position-relative">
        {loading ? (
             <div className="text-center py-4">Loading transactions...</div>
        ) : (
        <Table hover className="align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((item, idx) => (
              <tr key={idx}>
                <td>{item.orderId}</td>
                <td>{item.date}</td>
                <td>{item.method}</td>
                <td className="text-dark fw-semibold">₹{item.amount}</td>
                <td>
                    <span className={`badge bg-${item.status === 'Paid' ? 'success' : 'warning'}`}>
                        {item.status}
                    </span>
                </td>
                <td>
                  <i className="bi bi-download text-secondary" role="button" title="Download Receipt"></i>
                </td>
              </tr>
            )) : (
                <tr><td colSpan="6" className="text-center py-4">No transactions found</td></tr>
            )}
          </tbody>
        </Table>
        )}

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
              disabled={currentPage * itemsPerPage >= transactions.length}
            >
              Next <i className="bi bi-chevron-right"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;