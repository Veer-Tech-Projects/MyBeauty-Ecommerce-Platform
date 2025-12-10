import React, { useState } from "react";
import "../../styles/SellerOrdersPage.css";
import { Modal, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const mockOrders = {
  New: [
    {
      id: "ORD1001",
      productImage: "http://localhost:5000/static/products/earrings.jpg",
      products: ["Wireless Mouse", "USB Cable"],
      quantity: 2,
      buyer: "Amit Sharma",
      address: "Delhi, India",
      date: "2025-07-15",
      status: "Pending",
      isNew: true,
      paymentMethod: "Paid",
      price: "₹1299",
      deliveryAssigned: false,
    },
    {
      id: "ORD1002",
      productImage: "http://localhost:5000/static/products/earrings.jpg",
      products: ["Bluetooth Keyboard"],
      quantity: 1,
      buyer: "Reema Jain",
      address: "Mumbai, India",
      date: "2025-07-15 ",
      status: "Pending",
      isNew: true,
      paymentMethod: "COD",
      price: "₹799",
      deliveryAssigned: true,
    },
    {
      id: "ORD1002",
      productImage: "http://localhost:5000/static/products/earrings.jpg",
      products: ["Bluetooth Keyboard"],
      quantity: 1,
      buyer: "Reema Jain",
      address: "Mumbai, India",
      date: "2025-07-15 ",
      status: "Pending",
      isNew: true,
      paymentMethod: "COD",
      price: "₹799",
      deliveryAssigned: true,
    },
  ],
  All: [],
  Readyfordispatch: [],
  Shipped: [],
  Delivered: [],
  Cancelled: [],
};

export default function SellerOrdersPage() {
  const [activeTab, setActiveTab] = useState("New");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: "", reason: "" });

  const orders = mockOrders[activeTab] || [];
  const itemsPerPage = 5;
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCancelClick = (orderId) => {
    setCancelModal({ show: true, orderId, reason: "" });
  };

  const confirmCancel = () => {
    const updated = mockOrders[activeTab].map((o) =>
      o.id === cancelModal.orderId ? { ...o, status: "Cancelled" } : o
    );
    mockOrders[activeTab] = updated;
    setCancelModal({ show: false, orderId: "", reason: "" });
  };

  return (
    <div className="seller-orders-page container-fluid py-4 px-3 px-md-4">
      <div className="d-flex align-items-center mb-4">
        <NavLink to="/seller/dashboard" className="me-2 text-dark">
          <i className="bi bi-arrow-left-circle fs-5 clickable-icon"></i>
        </NavLink>
        <h4 className="fw-semibold mb-0">Orders</h4>
      </div>

      <ul className="nav nav-pills nav-custom mb-3">
        {["All","New","Ready for dispatch","Shipped", "Delivered", "Cancelled"].map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>No.</th>
              <th>Order ID</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Buyer</th>
              <th>Price</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Status</th>
              <th>Invoice</th>
              <th>Cancel</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order, index) => (
                <tr key={order.id}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{order.id}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="position-relative">
                        <img
                          src={order.productImage}
                          alt="product"
                          className="order-product-img rounded shadow-sm"
                        />
                        {order.isNew && (
                          <span className="badge bg-danger position-absolute top-0 start-100 translate-middle new-badge">
                            NEW
                          </span>
                        )}
                      </div>
                      <span>{order.products.join(", ")}</span>
                    </div>
                  </td>
                  <td>{order.quantity}</td>
                  <td>
                    {order.buyer}
                    <br />
                    <small>{order.address}</small>
                  </td>
                  <td>{order.price}</td>
                  <td>
                    <span
                      className={`badge d-inline-flex align-items-center ${
                        order.paymentMethod === "Paid"
                          ? "bg-success"
                          : order.paymentMethod === "COD"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {order.paymentMethod === "Paid" && (
                        <i className="bi bi-currency-rupee me-1"></i>
                      )}
                      {order.paymentMethod === "COD" && (
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      )}
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td>{order.date}</td>
                  <td>
                    <select className="form-select form-select-sm" defaultValue={order.status}>
                      <option value="Pending">Pending</option>
                      <option value="Ready to Dispatch">Ready to Dispatch</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-dark" title="Download Invoice">
                      <i className="bi bi-file-earmark-pdf"></i>
                    </button>
                  </td>
                  <td>
                    {order.status === "Cancelled" ? (
                      <span className="text-danger">Cancelled</span>
                    ) : order.deliveryAssigned ? (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled
                        title="Order already dispatched"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleCancelClick(order.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="text-center text-muted py-4">
                  No orders found in this tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {orders.length > itemsPerPage && (
          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Prev
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        show={cancelModal.show}
        onHide={() => setCancelModal({ show: false, orderId: "", reason: "" })}
      >
        <Modal.Header closeButton>
          <Modal.Title>Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label htmlFor="cancelReason" className="form-label">
            Reason for cancellation
          </label>
          <textarea
            id="cancelReason"
            rows="3"
            className="form-control"
            value={cancelModal.reason}
            onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
          />
          <div className="mt-3">Are you sure you want to cancel this order?</div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setCancelModal({ show: false, orderId: "", reason: "" })}
          >
            No
          </Button>
          <Button variant="danger" onClick={confirmCancel} disabled={!cancelModal.reason.trim()}>
            Yes, Cancel Order
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
