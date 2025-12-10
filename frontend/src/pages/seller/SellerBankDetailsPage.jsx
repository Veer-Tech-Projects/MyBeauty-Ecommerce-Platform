import React, { useState } from "react";
import { Card, Button, Form, Row, Col, Modal } from "react-bootstrap";
import "../../styles/SellerBankDetailsPage.css";
import { Link } from "react-router-dom";

const SellerBankDetailsPage = () => {
  const [bankAccounts, setBankAccounts] = useState([
    {
      id: 1,
      bankName: "HDFC Bank",
      accountHolder: "Rahul Sharma",
      accountNumber: "XXXX XXXX XXXX 4125",
      ifsc: "HDFC0001234",
      isPrimary: true,
    },
    {
      id: 2,
      bankName: "ICICI Bank",
      accountHolder: "Rahul Sharma",
      accountNumber: "XXXX XXXX XXXX 8995",
      ifsc: "ICIC0005678",
      isPrimary: false,
    },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [newBank, setNewBank] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = () => {
    setBankAccounts(prev => prev.filter(acc => acc.id !== deleteId));
    setShowDeleteModal(false);
  };

  const handleMakePrimary = (id) => {
    setBankAccounts(prev =>
      prev.map(acc => ({
        ...acc,
        isPrimary: acc.id === id,
      }))
    );
  };

  const handleEditSave = (id, updatedData) => {
    setBankAccounts(prev =>
      prev.map(acc => (acc.id === id ? { ...acc, ...updatedData } : acc))
    );
    setEditingId(null);
  };

  const handleAddBank = () => {
    const newId = bankAccounts.length + 1;
    setBankAccounts([
      ...bankAccounts,
      { ...newBank, id: newId, isPrimary: false, accountNumber: `XXXX XXXX XXXX ${newBank.accountNumber.slice(-4)}` },
    ]);
    setNewBank({ bankName: "", accountHolder: "", accountNumber: "", ifsc: "" });
    setShowAddForm(false);
  };

  return (
    <div className="seller-bank-details container-fluid inset-0">
      <div className="d-flex align-items-center mb-4">
      <Link to={"/seller/dashboard"}>
        <i className="bi bi-arrow-left-circle me-2 clickable-icon"></i>
      </Link>
        <h4 className="fw-semibold mb-0">Bank Details</h4>
      </div>

      <Row className="gy-4">
        {bankAccounts.map(bank => (
          <Col md={6} xl={4} key={bank.id}>
            <Card className="bank-card shadow-sm position-relative text-white">
              <div className="card-bg-icon">
                <i className="bi bi-bank2"></i>
              </div>
              <Card.Body>
                {editingId === bank.id ? (
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (bank.accountNumber !== bank.confirmAccountNumber) {
                        alert("Account numbers do not match.");
                        return;
                      }
                      handleEditSave(bank.id, {
                        ...bank,
                        accountNumber: `XXXX XXXX XXXX ${bank.accountNumber.slice(-4)}`
                      });
                    }}
                  >
                    <Form.Group className="mb-2">
                      <Form.Control
                        value={bank.bankName}
                        onChange={(e) =>
                          setBankAccounts(prev =>
                            prev.map(acc =>
                              acc.id === bank.id ? { ...acc, bankName: e.target.value } : acc
                            )
                          )
                        }
                        placeholder="Bank Name"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Control
                        value={bank.accountHolder}
                        onChange={(e) =>
                          setBankAccounts(prev =>
                            prev.map(acc =>
                              acc.id === bank.id ? { ...acc, accountHolder: e.target.value } : acc
                            )
                          )
                        }
                        placeholder="Account Holder"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Control
                        value={bank.accountNumber}
                        onChange={(e) =>
                          setBankAccounts(prev =>
                            prev.map(acc =>
                              acc.id === bank.id ? { ...acc, accountNumber: e.target.value } : acc
                            )
                          )
                        }
                        placeholder="Account Number"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Control
                        type="text"
                        value={bank.confirmAccountNumber || ""}
                        onChange={(e) =>
                          setBankAccounts(prev =>
                            prev.map(acc =>
                              acc.id === bank.id ? { ...acc, confirmAccountNumber: e.target.value } : acc
                            )
                          )
                        }
                        placeholder="Confirm Account Number"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Control
                        value={bank.ifsc}
                        onChange={(e) =>
                          setBankAccounts(prev =>
                            prev.map(acc =>
                              acc.id === bank.id ? { ...acc, ifsc: e.target.value } : acc
                            )
                          )
                        }
                        placeholder="IFSC Code"
                        required
                      />
                    </Form.Group>

                    <div className="d-flex gap-2 justify-content-end">
                      <Button type="submit" size="sm" variant="dark">
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-light"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="fw-semibold fs-5 d-flex align-items-center gap-2">
                        <i className="bi bi-bank2 fs-4"></i> {bank.bankName}
                      </div>
                      {bank.isPrimary && <span className="badge bg-success">Primary</span>}
                    </div>
                    <div className="mb-2"><i className="bi bi-person me-2"></i> {bank.accountHolder}</div>
                    <div className="mb-2"><i className="bi bi-credit-card me-2"></i> {bank.accountNumber}</div>
                    <div className="mb-3"><i className="bi bi-123 me-2"></i> IFSC: {bank.ifsc}</div>
                    <div className="d-flex justify-content-between align-items-center">
                      {!bank.isPrimary && (
                        <Button
                          size="sm"
                          variant="outline-light"
                          onClick={() => handleMakePrimary(bank.id)}
                        >
                          Make Primary
                        </Button>
                      )}
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => setEditingId(bank.id)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setDeleteId(bank.id);
                            setShowDeleteModal(true);
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Add Bank Account */}
     <div className="mt-5">
        {!showAddForm ? (
          <Button variant="dark" size="sm" onClick={() => setShowAddForm(true)}>
            <i className="bi bi-plus-circle me-1"></i> Add Bank Account
          </Button>
        ) : (
          <Card className="p-4 mt-3 shadow-sm border-0 rounded-4 add-bank-form-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-semibold text-dark">
                <i className="bi bi-bank2 me-2 "></i> Add New Bank Account
              </h6>
              <Button
                variant="outline-dark"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>

            <Form
              onSubmit={(e) => {
                e.preventDefault();
                if (newBank.accountNumber !== newBank.confirmAccountNumber) {
                  alert("Account numbers do not match.");
                  return;
                }
                handleAddBank();
              }}
            >
              <Row className="gy-3">
                <Col md={6}>
                  <Form.Label className="mb-1">Bank Name</Form.Label>
                  <Form.Control
                    placeholder="Enter Bank Name"
                    value={newBank.bankName}
                    onChange={(e) =>
                      setNewBank({ ...newBank, bankName: e.target.value })
                    }
                    required
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="mb-1">Account Holder Name</Form.Label>
                  <Form.Control
                    placeholder="Enter Account Holder Name"
                    value={newBank.accountHolder}
                    onChange={(e) =>
                      setNewBank({ ...newBank, accountHolder: e.target.value })
                    }
                    required
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="mb-1">Account Number</Form.Label>
                  <Form.Control
                    placeholder="Enter Account Number"
                    value={newBank.accountNumber}
                    onChange={(e) =>
                      setNewBank({ ...newBank, accountNumber: e.target.value })
                    }
                    required
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="mb-1">Confirm Account Number</Form.Label>
                  <Form.Control
                    placeholder="Re-enter Account Number"
                    value={newBank.confirmAccountNumber || ""}
                    onChange={(e) =>
                      setNewBank({
                        ...newBank,
                        confirmAccountNumber: e.target.value,
                      })
                    }
                    required
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="mb-1">IFSC Code</Form.Label>
                  <Form.Control
                    placeholder="Enter IFSC Code"
                    value={newBank.ifsc}
                    onChange={(e) =>
                      setNewBank({ ...newBank, ifsc: e.target.value })
                    }
                    required
                  />
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button type="submit" variant="dark" size="sm" className="px-3">
                  <i className="bi bi-check2-circle me-1"></i> Add Account
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="px-3"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card>
        )}
      </div>


      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-2"></i>
          </div>
          <h6 className="fw-semibold mb-2">Remove Bank Account?</h6>
          <p className="text-muted small mb-4">
            This action cannot be undone. Are you sure you want to remove this bank account?
          </p>

          <div className="d-flex justify-content-center gap-3">
            <Button variant="danger" size="sm" className="px-3" onClick={handleDelete}>
              <i className="bi bi-trash me-1"></i> Remove
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              className="px-3"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default SellerBankDetailsPage;
