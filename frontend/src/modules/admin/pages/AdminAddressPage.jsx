import React, { useState, useEffect } from "react";
import { Row, Col, Card, Form, Button, Badge, ToastContainer, Toast } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin";
import "@/app/styles/SellerAddressPage.css"; // Reuse styles

export default function AdminAddressPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({
    id: null, name: "", phone: "", addressLine1: "", addressLine2: "",
    city: "", state: "", pincode: "", gstin: "",
    addressType: "Pickup", pickupType: "Warehouse"
  });
  const [editingAddress, setEditingAddress] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await axiosAdmin.get("/api/admin/address");
      setAddresses(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    try {
      if (editingAddress) {
        await axiosAdmin.put(`/api/admin/address/${editingAddress}`, formData);
        showToast("Address updated");
      } else {
        await axiosAdmin.post("/api/admin/address", formData);
        showToast("Address saved");
      }
      fetchAddresses();
      resetForm();
    } catch(err) { showToast("Failed to save"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete address?")) return;
    try {
        await axiosAdmin.delete(`/api/admin/address/${id}`);
        fetchAddresses();
        showToast("Deleted");
    } catch(err) { showToast("Delete failed"); }
  };

  const resetForm = () => {
    setFormData({ id: null, name: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", gstin: "", addressType: "Pickup", pickupType: "Warehouse" });
    setEditingAddress(null);
  };

  const handleEdit = (id) => {
    const addr = addresses.find(a => a.id === id);
    if(addr) { setFormData(addr); setEditingAddress(id); }
  };

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  return (
    <div className="seller-address-page">
      <ToastContainer position="top-end" className="p-3"><Toast show={!!toastMsg}><Toast.Body>{toastMsg}</Toast.Body></Toast></ToastContainer>
      <h5 className="fw-bold mb-4 d-flex align-items-center">
        <i className="bi bi-arrow-left-circle me-2 fs-5 clickable" onClick={() => navigate("/admin/dashboard")}></i>
        Warehouse & Store Addresses
      </h5>
      <Row>
        <Col md={6}>
            <h6 className="fw-semibold mb-3">Saved Locations</h6>
            {addresses.map(addr => (
                <Card key={addr.id} className="mb-3 shadow-sm">
                    <Card.Body className="d-flex justify-content-between">
                        <div>
                            <strong>{addr.name}</strong> <Badge bg="dark" className="ms-2">{addr.pickupType}</Badge>
                            <div>{addr.addressLine1}, {addr.city}, {addr.pincode}</div>
                            <small>GST: {addr.gstin}</small>
                        </div>
                        <div>
                            <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => handleEdit(addr.id)}><i className="bi bi-pencil"></i></Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(addr.id)}><i className="bi bi-trash"></i></Button>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </Col>
        <Col md={6}>
            <Card className="shadow-sm">
                <Card.Body>
                    <h6>{editingAddress ? "Edit Address" : "Add New Location"}</h6>
                    <Form>
                        <Form.Group className="mb-2"><Form.Label>Location Name</Form.Label><Form.Control value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-2"><Form.Label>Address</Form.Label><Form.Control value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} /></Form.Group>
                        <Row>
                            <Col><Form.Control placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="mb-2" /></Col>
                            <Col><Form.Control placeholder="Pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="mb-2" /></Col>
                        </Row>
                        <Form.Group className="mb-3"><Form.Label>GSTIN</Form.Label><Form.Control value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} /></Form.Group>
                        <Button variant="dark" className="w-100" onClick={handleSave}>{editingAddress ? "Update" : "Save"}</Button>
                    </Form>
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </div>
  );
}