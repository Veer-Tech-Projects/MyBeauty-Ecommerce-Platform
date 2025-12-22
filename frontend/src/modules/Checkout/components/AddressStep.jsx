//AddressStep.jsx:

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Modal,
  Form,
  Spinner,
  Badge,
  Stack,
} from "react-bootstrap";
import { toast } from "react-toastify";
import "@/app/styles/AddressForm.css"; // custom styles (provided below)
import { useNavigate, useLocation } from "react-router-dom"; // ✅ useLocation added
import api from "@/shared/networking/api"; // NEW
import { FaCheckCircle } from "react-icons/fa";

/**
 * AddressForm
 * Props:
 *  - onAddressSelected(addressObject) : called when user confirms delivery to an address
 */
const MAX_ADDRESSES = 5;

export default function AddressForm({ onAddressSelected }) {
  const navigate = useNavigate();
  const location = useLocation();
   // ✅ Extract BuyNow params if present
  const buyMode = location.state?.buyMode === true;
  const buyNowItem = buyMode ? location.state?.buyNowItem || null : null;

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal states
  const [showModal, setShowModal] = useState(false);
  const [editAddress, setEditAddress] = useState(null);

  // delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  // selected
  const [selectedId, setSelectedId] = useState(null);

  // form submission state
  const [submitting, setSubmitting] = useState(false);

  // form model aligned with backend
  const emptyForm = {
    fullname: "",
    phone: "",
    alternate_phone: "",
    pincode: "",
    state: "",
    city: "",
    house: "",
    road: "",
    landmark: "",
    type: "home",
    country: "India",
    is_default: false,
  };
  const [form, setForm] = useState(emptyForm);

  const handleContinue = () => {
    const selected = addresses.find((a) => a.id === selectedId);
    if (!selected) {
      toast.warn("Please select an address before continuing.");
      return;
    }
    if (onAddressSelected) onAddressSelected(selected);

    // ✅ Preserve BuyNow flow OR Cart flow
    navigate("/checkout/summary", {
      state: {
        address: selected,
        buyMode,
        ...(buyMode ? { buyNowItem } : {}),
      },
    });
  };  

 const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/addresses");
      const list = res.data.addresses || [];
      setAddresses(list);
      const def = list.find((a) => a.is_default) || list[0];
      if (def) setSelectedId(def.id);
    } catch (err) {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  // ----- open add modal (or edit)
  const openAddModal = () => {
    if (addresses.length >= MAX_ADDRESSES) {
      toast.info(`You can save up to ${MAX_ADDRESSES} addresses only.`);
      return;
    }
    setEditAddress(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (addr) => {
    setEditAddress(addr);
    // map DB fields to form model
    setForm({
      fullname: addr.fullname || "",
      phone: addr.phone || "",
      alternate_phone: addr.alternate_phone || "",
      pincode: addr.pincode || "",
      state: addr.state || "",
      city: addr.city || "",
      house: addr.house || "",
      road: addr.road || "",
      landmark: addr.landmark || "",
      type: addr.type || "home",
      country: addr.country || "India",
      is_default: !!addr.is_default,
    });
    setShowModal(true);
  };

  // ----- input changed
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // CHANGED: Use api.put / api.post
      if (editAddress) {
        await api.put(`/addresses/${editAddress.id}`, form);
        toast.success("Address updated");
      } else {
        await api.post("/addresses", form);
        toast.success("Address saved");
      }
      setShowModal(false);
      await fetchAddresses();
    } catch (err) {
      toast.error("Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- delete flow (open confirm)
  const confirmDelete = (id) => {
    setToDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!toDeleteId) return;
    try {
      // CHANGED: Use api.delete
      await api.delete(`/addresses/${toDeleteId}`);
      toast.success("Address removed");
      setShowDeleteModal(false);
      await fetchAddresses();
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  // ----- select address for checkout
  const chooseAddress = (addr) => {
    setSelectedId(addr.id);
    // pass object to parent for immediate summary display
    if (onAddressSelected) onAddressSelected(addr);
    toast.success("Address selected");
  };

  // ----- small UI helpers
  const renderAddressCard = (addr) => {
    const isSelected = selectedId === addr.id;
    return (
      <Col xs={12} md={6} lg={4} key={addr.id}>
        <Card
          className={`ab-card ${isSelected ? "selected" : ""}`}
          onClick={() => chooseAddress(addr)}
          role="button"
        >
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                
                <div className="ab-title">

                  {addr.fullname || "—"}{" "}

                  {isSelected && <FaCheckCircle className="text-success ms-1" />}

                </div>

                <div className="ab-sub small text-muted">Phone: {addr.phone}</div>
              </div>
              <div className="text-end">
                {addr.is_default ? <Badge bg="warning" text="dark">Default</Badge> : null}
              </div>
            </div>

            <div className="ab-address small text-muted mb-3">
              {addr.house}{addr.road ? ", " + addr.road : ""}<br />
              {addr.city}, {addr.state} — {addr.pincode}
            </div>

            <Stack direction="horizontal" gap={2}>
              <Button

                variant={isSelected ? "success" : "outline-primary"}

                size="sm"

              >
                {isSelected ? "Selected" : "Deliver to this address"}
              </Button>
              <Button
               className="btn-edit"
                size="sm"
                onClick={(e) => { e.stopPropagation(); openEditModal(addr); }}
              >
                Edit
              </Button>
              <Button
                className="btn-delete"
                size="sm"
                onClick={(e) => { e.stopPropagation(); confirmDelete(addr.id); }}
              >
                Delete
              </Button>
            </Stack>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <>
      <div className="address-step-root">
        <h4 className="mb-4 ab-heading">Select Delivery Address</h4>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" /></div>
        ) : (
          <>
            <Row className="g-4">
              {/* Add card */}
              <Col xs={12} md={6} lg={4}>
                <Card className="ab-add-card" onClick={openAddModal} role="button">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                    <div className="add-plus">+</div>
                    <div className="add-text">Add New Address</div>
                    <div className="add-sub small text-muted">Save up to {MAX_ADDRESSES} addresses</div>
                  </Card.Body>
                </Card>
              </Col>

              {/* list */}
              {addresses.length === 0 ? (
                <Col><div className="text-muted">No saved addresses — add one now.</div></Col>
              ) : (
                addresses.map((a) => renderAddressCard(a))
              )}
            </Row>

            {/* NEW: Continue button */}
            {addresses.length > 0 && (
              <div className="continue-btn-wrapper mt-4 text-end">
                <Button className="continue-btn" onClick={handleContinue}>
                  Continue to Summary
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editAddress ? "Edit Address" : "Add New Address"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full name</Form.Label>
              <Form.Control name="fullname" value={form.fullname} onChange={handleChange} required />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control name="phone" value={form.phone} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Alternate phone</Form.Label>
                  <Form.Control name="alternate_phone" value={form.alternate_phone} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>House / Building</Form.Label>
              <Form.Control name="house" value={form.house} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Road / Area / Colony</Form.Label>
              <Form.Control name="road" value={form.road} onChange={handleChange} required />
            </Form.Group>

            <Row>
              <Col md={5}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control name="city" value={form.city} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control name="state" value={form.state} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control name="pincode" value={form.pincode} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                label="Set as default address"
                name="is_default"
                checked={!!form.is_default}
                onChange={handleChange}
              />
            </Form.Group>
            <div className="text-muted small">We do basic pincode checks; for accurate delivery estimates we'll validate at summary.</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? "Saving..." : "Save address"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove address?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to remove this address? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button className="btn-delete" onClick={handleDelete}>Remove</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}