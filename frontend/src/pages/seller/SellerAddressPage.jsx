import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  ToastContainer,
  Toast,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/SellerAddressPage.css";

export default function SellerAddressPage() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([
    {
      id: "addr1",
      name: "Rahul Mehta",
      phone: "9876543210",
      addressLine1: "Plot 45, Indira Nagar",
      addressLine2: "Near Metro Station",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      gstin: "27ABCDE1234F1Z5",
      addressType: "Pickup",
      pickupType: "Warehouse",
    },
  ]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    addressType: "Pickup",
    pickupType: "Warehouse",
  });

  const [editingAddress, setEditingAddress] = useState(null);
  const [primaryPickupId, setPrimaryPickupId] = useState("addr1");
  const [primaryReturnId, setPrimaryReturnId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [makePrimary, setMakePrimary] = useState(false);

  const handleSave = () => {
  if (editingAddress) {
    setAddresses((prev) =>
      prev.map((addr) =>
        addr.id === editingAddress ? { ...formData, id: editingAddress } : addr
      )
    );
    if (makePrimary) {
      if (formData.addressType === "Pickup" || formData.addressType === "Both")
        setPrimaryPickupId(editingAddress);
      if (formData.addressType === "Return" || formData.addressType === "Both")
        setPrimaryReturnId(editingAddress);
    }
    showToast("Address updated");
  } else {
    const newId = `addr${Date.now()}`;
    const newAddress = { ...formData, id: newId };
    setAddresses([...addresses, newAddress]);
    if (makePrimary) {
      if (formData.addressType === "Pickup" || formData.addressType === "Both")
        setPrimaryPickupId(newId);
      if (formData.addressType === "Return" || formData.addressType === "Both")
        setPrimaryReturnId(newId);
    }
    showToast("Address saved");
  }
  resetForm();
};


  const handleEdit = (id) => {
    const addr = addresses.find((a) => a.id === id);
    setFormData({ ...addr });
    setEditingAddress(id);
  };

  const handleDelete = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (id === primaryPickupId) setPrimaryPickupId(null);
    if (id === primaryReturnId) setPrimaryReturnId(null);
    showToast("Address deleted");
  };

  const resetForm = () => {
  setFormData({
    id: null,
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    addressType: "Pickup",
    pickupType: "Warehouse",
  });
  setEditingAddress(null);
  setMakePrimary(false);
};


  const setAsPrimary = (id, type) => {
    if (type === "Pickup" || type === "Both") setPrimaryPickupId(id);
    if (type === "Return" || type === "Both") setPrimaryReturnId(id);
    showToast("Primary address set");
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const renderAddressCard = (addr, isSaved = true) => {
    const isPrimaryPickup = addr.id === primaryPickupId;
    const isPrimaryReturn = addr.id === primaryReturnId;

    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="fw-bold mb-1">{addr.name}</h6>
              <p className="mb-1">{addr.phone}</p>
              <p className="mb-1">
                {addr.addressLine1}, {addr.addressLine2}
              </p>
              <p className="mb-1">
                {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <p className="mb-2">GSTIN: {addr.gstin}</p>
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="dark">{addr.addressType}</Badge>
                <Badge bg="secondary">{addr.pickupType}</Badge>
                {isPrimaryPickup && (
                  <Badge bg="success">
                    Primary <i className="bi bi-check-circle-fill"></i>
                  </Badge>
                )}
                {isPrimaryReturn && (
                  <Badge bg="success">
                    Primary <i className="bi bi-check-circle-fill"></i>
                  </Badge>
                )}
              </div>
            </div>
            {isSaved && (
              <div className="d-flex flex-column align-items-end gap-2">
                {!isPrimaryPickup && !isPrimaryReturn && (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => setAsPrimary(addr.id, addr.addressType)}
                  >
                    Set as Primary
                  </Button>
                )}
                <div className="d-flex gap-1">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => handleEdit(addr.id)}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="seller-address-page">
      <ToastContainer position="top-end" className="p-3 position-fixed top-0 end-0">
        {toastMsg && (
          <Toast show delay={3000} autohide>
            <Toast.Body>{toastMsg}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>

      <h5 className="fw-bold mb-4 d-flex align-items-center">
        <i
          className="bi bi-arrow-left-circle me-2 fs-5 clickable"
          onClick={() => navigate("/seller/dashboard")}
        ></i>
        Seller Address Management
      </h5>

      <Row>
        <Col md={6}>
          {/* Primary Pickup */}
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <h6 className="fw-semibold mb-2">Primary Pickup Address</h6>
              {primaryPickupId ? (
                renderAddressCard(
                  addresses.find((a) => a.id === primaryPickupId),
                  false
                )
              ) : (
                <div className="alert alert-warning mb-0">
                  No primary pickup address set.
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Primary Return */}
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <h6 className="fw-semibold mb-2">Primary Return Address</h6>
              {primaryReturnId ? (
                renderAddressCard(
                  addresses.find((a) => a.id === primaryReturnId),
                  false
                )
              ) : (
                <div className="alert alert-warning mb-0">
                  No primary return address set.
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Saved Addresses */}
          <h6 className="fw-semibold mt-4 mb-2">Saved Addresses</h6>
          {addresses.map((addr) => renderAddressCard(addr))}
        </Col>

        {/* Add/Edit Form */}
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="fw-semibold mb-3">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h6>
              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Label>Address Line 1</Form.Label>
                    <Form.Control
                      value={formData.addressLine1}
                      onChange={(e) =>
                        setFormData({ ...formData, addressLine1: e.target.value })
                      }
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Label>Address Line 2</Form.Label>
                    <Form.Control
                      value={formData.addressLine2}
                      onChange={(e) =>
                        setFormData({ ...formData, addressLine2: e.target.value })
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Pincode</Form.Label>
                    <Form.Control
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>GSTIN</Form.Label>
                    <Form.Control
                      value={formData.gstin}
                      onChange={(e) =>
                        setFormData({ ...formData, gstin: e.target.value })
                      }
                    />
                  </Col>

                  {/* Address Type (horizontal) */}
                  <Col md={12}>
                    <Form.Label className="fw-semibold d-block mb-1">
                      Address Type
                    </Form.Label>
                    <div className="d-flex gap-3">
                      {["Pickup", "Return", "Both"].map((type) => (
                        <Form.Check
                          inline
                          key={type}
                          type="radio"
                          label={type}
                          name="addressType"
                          checked={formData.addressType === type}
                          onChange={() =>
                            setFormData({ ...formData, addressType: type })
                          }
                        />
                      ))}
                    </div>
                  </Col>

                  {/* Pickup Type (horizontal) */}
                  <Col md={12}>
                    <Form.Label className="fw-semibold d-block mb-1">
                      Pickup Type
                    </Form.Label>
                    <div className="d-flex gap-3">
                      {["Warehouse", "Store", "Both"].map((type) => (
                        <Form.Check
                          inline
                          key={type}
                          type="radio"
                          label={type}
                          name="pickupType"
                          checked={formData.pickupType === type}
                          onChange={() =>
                            setFormData({ ...formData, pickupType: type })
                          }
                        />
                      ))}
                    </div>
                  </Col>

                 <Col md={12}>
                  <Form.Check
                    type="checkbox"
                    label="Make this my primary address"
                    checked={makePrimary}
                    onChange={(e) => setMakePrimary(e.target.checked)}
                  />
                </Col>

                </Row>

                <div className="text-end d-flex justify-content-end gap-2 mt-4">
                  {editingAddress && (
                    <Button
                      variant="outline-dark"
                      className="px-4 py-2 fw-medium rounded-pill"
                      onClick={resetForm}
                    >
                      <i className="bi bi-x-circle me-2"></i> Cancel
                    </Button>
                  )}
                  <Button
                    variant="dark"
                    className="px-4 py-2 fw-medium rounded-pill"
                    onClick={handleSave}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    {editingAddress ? "Update Address" : "Save Address"}
                  </Button>
                </div>

              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
