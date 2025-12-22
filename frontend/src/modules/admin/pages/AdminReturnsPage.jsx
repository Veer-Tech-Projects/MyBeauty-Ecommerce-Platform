import React, { useState, useEffect } from "react";
import { Button, Modal, Table, Badge, Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin";
import "@/app/styles/SellerReturnsPage.css"; // Reuse styles

export default function AdminReturnsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [returns, setReturns] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  const fetchReturns = async () => {
    try {
        const res = await axiosAdmin.get("/api/admin/returns");
        setReturns(res.data || []);
    } catch (err) {
        console.error(err);
    }
  };

  const filteredReturns = activeTab === "All" ? returns : returns.filter(r => r.status === activeTab);

  const handleAccept = async (id) => {
    if(!window.confirm("Approve this return?")) return;
    try {
        await axiosAdmin.put(`/api/admin/returns/${id}/approve`);
        fetchReturns();
    } catch(err) {
        alert("Failed to approve");
    }
  };

  const handleRejectConfirm = async () => {
    try {
        await axiosAdmin.put(`/api/admin/returns/${selectedReturnId}/reject`, { reason: rejectReason });
        setShowRejectModal(false);
        setRejectReason("");
        fetchReturns();
    } catch(err) {
        alert("Failed to reject");
    }
  };

  return (
    <div className="seller-returns-page">
      <div className="returns-container">
        <h5 className="d-flex align-items-center mb-4">
          <i
            className="bi bi-arrow-left-circle me-2 clickable-icon"
            onClick={() => navigate("/admin/dashboard")}
          ></i>
          <h4 className="fw-semibold mb-0">Returns Management</h4>
        </h5>

        <div className="return-tabs mb-4">
            {["All", "Pending", "Approved", "Rejected"].map((tab) => (
              <button
                key={tab}
                className={`return-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
        </div>

        <div className="table-responsive bg-white rounded shadow-sm p-3">
          <Table hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length > 0 ? filteredReturns.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.product_name}</td>
                  <td>{item.reason}</td>
                  <td><Badge bg={item.status === 'Pending' ? 'warning' : item.status === 'Approved' ? 'success' : 'danger'}>{item.status}</Badge></td>
                  <td>
                    {item.status === 'Pending' && (
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-success" onClick={() => handleAccept(item.id)}>Accept</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => { setSelectedReturnId(item.id); setShowRejectModal(true); }}>Reject</Button>
                    </div>
                    )}
                  </td>
                </tr>
              )) : <tr><td colSpan="5" className="text-center">No returns found</td></tr>}
            </tbody>
          </Table>
        </div>

        <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Reject Return</Modal.Title></Modal.Header>
          <Modal.Body>
            <textarea className="form-control" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={handleRejectConfirm}>Confirm Reject</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}