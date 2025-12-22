import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

const INITIAL_STATE = {
  fullname: "", phone: "", pincode: "",
  state: "", city: "", house: "", road: "",
  landmark: "", type: "home", is_default: false
};

const AddressFormModal = ({ show, onHide, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);

  // Load data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        is_default: !!initialData.is_default // Ensure boolean
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [initialData, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Strict Input Filtering
    if (name === "phone" && !/^\d*$/.test(value)) return; // Only numbers
    if (name === "pincode" && !/^\d*$/.test(value)) return;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await onSubmit(formData);
    setSubmitting(false);
    if (success) onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{initialData ? "Edit Address" : "Add New Address"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Full Name</Form.Label>
              <Form.Control required name="fullname" value={formData.fullname} onChange={handleChange} minLength={3} />
            </Col>
            
            <Col md={6}>
              <Form.Label>Phone (10 digits)</Form.Label>
              <Form.Control required name="phone" value={formData.phone} onChange={handleChange} maxLength={10} minLength={10} />
            </Col>
            
            <Col md={6}>
              <Form.Label>Pincode (6 digits)</Form.Label>
              <Form.Control required name="pincode" value={formData.pincode} onChange={handleChange} maxLength={6} minLength={6} />
            </Col>

            <Col md={12}>
              <Form.Label>Flat, House no., Building</Form.Label>
              <Form.Control required name="house" value={formData.house} onChange={handleChange} />
            </Col>

            <Col md={12}>
              <Form.Label>Area, Street, Sector</Form.Label>
              <Form.Control required name="road" value={formData.road} onChange={handleChange} />
            </Col>

            <Col md={6}>
              <Form.Label>City</Form.Label>
              <Form.Control required name="city" value={formData.city} onChange={handleChange} />
            </Col>

            <Col md={6}>
              <Form.Label>State</Form.Label>
              <Form.Control required name="state" value={formData.state} onChange={handleChange} />
            </Col>

            <Col md={12}>
              <Form.Label>Address Type</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check type="radio" label="Home" name="type" value="home" checked={formData.type === "home"} onChange={handleChange} />
                <Form.Check type="radio" label="Work" name="type" value="work" checked={formData.type === "work"} onChange={handleChange} />
              </div>
            </Col>

            <Col md={12}>
              <Form.Check type="checkbox" label="Make this my default address" name="is_default" checked={formData.is_default} onChange={handleChange} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Address"}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddressFormModal;