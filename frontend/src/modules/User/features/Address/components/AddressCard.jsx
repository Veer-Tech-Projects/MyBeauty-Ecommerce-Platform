import React from "react";
import { Card, Badge, Button, Stack } from "react-bootstrap";
import { FaHome, FaBriefcase, FaCheckCircle } from "react-icons/fa";

const AddressCard = ({ address, onEdit, onDelete }) => {
  const isDefault = address.is_default === 1 || address.is_default === true;
  const Icon = address.type === "work" ? FaBriefcase : FaHome;

  return (
    <Card className={`h-100 shadow-sm border-0 ${isDefault ? "border-start border-4 border-primary" : ""}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            <Icon className="text-muted" />
            <span className="badge bg-light text-dark border capitalize">{address.type}</span>
            {isDefault && <Badge bg="primary">Default</Badge>}
          </div>
        </div>

        <h6 className="fw-bold mb-1">{address.fullname}</h6>
        <p className="text-muted small mb-2">{address.phone}</p>

        <p className="small text-secondary mb-3" style={{ minHeight: "40px" }}>
          {address.house}, {address.road} <br />
          {address.city}, {address.state} - <strong>{address.pincode}</strong>
        </p>

        <Stack direction="horizontal" gap={2}>
          <Button variant="outline-primary" size="sm" onClick={() => onEdit(address)}>
            Edit
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => onDelete(address.id)}>
            Delete
          </Button>
        </Stack>
      </Card.Body>
    </Card>
  );
};

export default AddressCard;