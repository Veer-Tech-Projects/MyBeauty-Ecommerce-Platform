import React, { useState } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { useAddress } from "./hooks/useAddress";
import AddressCard from "./components/AddressCard";
import AddressFormModal from "./components/AddressFormModal";

const AddressLayout = () => {
  const { addresses, loading, error, addAddress, updateAddress, deleteAddress } = useAddress();
  
  const [showModal, setShowModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);

  const handleEdit = (addr) => {
    setEditingAddr(addr);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingAddr(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (data) => {
    if (editingAddr) {
      return await updateAddress(editingAddr.id, data);
    } else {
      return await addAddress(data);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">Saved Addresses</h3>
        <Button onClick={handleAdd} disabled={addresses.length >= 3}>
          {addresses.length >= 3 ? "Limit Reached (3)" : "+ Add New Address"}
        </Button>
      </div>

      {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
      
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && addresses.length === 0 && (
        <Alert variant="info" className="text-center">No saved addresses found.</Alert>
      )}

      <Row className="g-4">
        {addresses.map((addr) => (
          <Col key={addr.id} md={6} lg={4}>
            <AddressCard 
              address={addr} 
              onEdit={handleEdit} 
              onDelete={deleteAddress} 
            />
          </Col>
        ))}
      </Row>

      <AddressFormModal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        onSubmit={handleFormSubmit}
        initialData={editingAddr}
      />
    </Container>
  );
};

export default AddressLayout;