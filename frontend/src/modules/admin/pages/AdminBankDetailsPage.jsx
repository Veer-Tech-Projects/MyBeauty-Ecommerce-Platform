import React, { useState, useEffect } from "react";
import { Card, Button, Form, Row, Col, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin";
import "@/app/styles/SellerBankDetailsPage.css"; // Reuse styles

const AdminBankDetailsPage = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBank, setNewBank] = useState({ bankName: "", accountHolder: "", accountNumber: "", ifsc: "" });

  useEffect(() => {
    axiosAdmin.get("/api/admin/bank-details").then(res => setBankAccounts(res.data || [])).catch(console.error);
  }, []);

  const handleAddBank = async () => {
    try {
        await axiosAdmin.post("/api/admin/bank-details", newBank);
        const res = await axiosAdmin.get("/api/admin/bank-details");
        setBankAccounts(res.data);
        setShowAddForm(false);
        setNewBank({ bankName: "", accountHolder: "", accountNumber: "", ifsc: "" });
    } catch(err) { alert("Failed to add bank"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Remove this account?")) return;
    try {
        await axiosAdmin.delete(`/api/admin/bank-details/${id}`);
        setBankAccounts(prev => prev.filter(b => b.id !== id));
    } catch(err) { alert("Failed to delete"); }
  };

  return (
    <div className="seller-bank-details container-fluid inset-0">
      <div className="d-flex align-items-center mb-4">
        <Link to={"/admin/dashboard"}>
            <i className="bi bi-arrow-left-circle me-2 clickable-icon text-dark"></i>
        </Link>
        <h4 className="fw-semibold mb-0">Company Bank Details</h4>
      </div>

      <Row className="gy-4">
        {bankAccounts.map(bank => (
          <Col md={6} xl={4} key={bank.id}>
            <Card className="bank-card shadow-sm position-relative text-white">
              <div className="card-bg-icon"><i className="bi bi-bank2"></i></div>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="fw-semibold fs-5"><i className="bi bi-bank2 fs-4 me-2"></i> {bank.bankName}</div>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(bank.id)}><i className="bi bi-trash"></i></Button>
                </div>
                <div className="mb-2">{bank.accountHolder}</div>
                <div className="mb-2">{bank.accountNumber}</div>
                <div>IFSC: {bank.ifsc}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mt-5">
        {!showAddForm ? (
          <Button variant="dark" size="sm" onClick={() => setShowAddForm(true)}>
            <i className="bi bi-plus-circle me-1"></i> Add Company Bank Account
          </Button>
        ) : (
          <Card className="p-4 mt-3 shadow-sm border-0 rounded-4 add-bank-form-card" style={{maxWidth: '600px'}}>
             <h6 className="mb-3">Add New Account</h6>
             <Form>
                <Row className="g-2">
                    <Col md={6}><Form.Control placeholder="Bank Name" value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} /></Col>
                    <Col md={6}><Form.Control placeholder="Account Holder" value={newBank.accountHolder} onChange={e => setNewBank({...newBank, accountHolder: e.target.value})} /></Col>
                    <Col md={6}><Form.Control placeholder="Account Number" value={newBank.accountNumber} onChange={e => setNewBank({...newBank, accountNumber: e.target.value})} /></Col>
                    <Col md={6}><Form.Control placeholder="IFSC" value={newBank.ifsc} onChange={e => setNewBank({...newBank, ifsc: e.target.value})} /></Col>
                </Row>
                <div className="mt-3 text-end">
                    <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    <Button variant="dark" size="sm" onClick={handleAddBank}>Save</Button>
                </div>
             </Form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminBankDetailsPage;