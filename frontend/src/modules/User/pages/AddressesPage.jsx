// src/modules/User/pages/AddressesPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/shared/networking/api"; // Use your configured API
import { Modal, Button, Form, Card, Spinner, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import "@/app/styles/AddressForm.css"; // Reuse existing styles

export default function AddressesPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  // Fetch Addresses
  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get("/addresses");
      setAddresses(data.addresses || []);
    } catch (err) {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`/addresses/${id}`);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // Handle Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`/addresses/${form.id}`, form);
        toast.success("Address updated");
      } else {
        await axios.post("/addresses", form);
        toast.success("Address added");
      }
      setShowModal(false);
      fetchAddresses();
    } catch (err) {
      toast.error("Failed to save address");
    }
  };

  // Open Modal
  const openModal = (addr = null) => {
    setIsEdit(!!addr);
    setForm(addr || { 
        fullname: "", phone: "", house: "", road: "", city: "", 
        state: "", pincode: "", type: "home", is_default: false 
    });
    setShowModal(true);
  };

  return (
    <div className="container py-4" style={{ maxWidth: "800px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">My Addresses</h3>
        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
          + Add New
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-5 text-muted bg-light rounded">
          <p>No addresses saved yet.</p>
        </div>
      ) : (
        <div className="row g-3">
          {addresses.map((addr) => (
            <div className="col-md-6" key={addr.id}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <Badge bg="light" text="dark" className="border">{addr.type.toUpperCase()}</Badge>
                    {addr.is_default && <Badge bg="success">DEFAULT</Badge>}
                  </div>
                  <h6 className="fw-bold">{addr.fullname}</h6>
                  <p className="small text-muted mb-2">
                    {addr.house}, {addr.road}<br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="small fw-bold mb-3">Phone: {addr.phone}</p>
                  
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => openModal(addr)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(addr.id)}>Delete</Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{isEdit ? "Edit Address" : "New Address"}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control required value={form.fullname} onChange={e => setForm({...form, fullname: e.target.value})} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Phone</Form.Label><Form.Control required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></Form.Group>
            <div className="row">
                <div className="col"><Form.Group className="mb-2"><Form.Label>Pincode</Form.Label><Form.Control required value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} /></Form.Group></div>
                <div className="col"><Form.Group className="mb-2"><Form.Label>City</Form.Label><Form.Control required value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></Form.Group></div>
            </div>
            <Form.Group className="mb-2"><Form.Label>Address (House/Road)</Form.Label><Form.Control required value={form.house} onChange={e => setForm({...form, house: e.target.value})} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Road/Area</Form.Label><Form.Control required value={form.road} onChange={e => setForm({...form, road: e.target.value})} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>State</Form.Label><Form.Control required value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></Form.Group>
            <Form.Check type="checkbox" label="Set as Default" checked={form.is_default || false} onChange={e => setForm({...form, is_default: e.target.checked})} className="mt-2" />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}