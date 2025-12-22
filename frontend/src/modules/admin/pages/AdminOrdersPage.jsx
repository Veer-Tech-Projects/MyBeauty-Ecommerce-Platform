import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin"; // Admin Axios
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/app/styles/SellerOrdersPage.css"; // Preserving styles

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("New"); // "New" maps to "Pending" usually, or keep custom tabs
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: "", reason: "" });

  const itemsPerPage = 5;
  // Note: For production, totalPages should come from backend metadata
  const totalPages = Math.ceil(orders.length / itemsPerPage); 

  // Fetch Orders on Tab Change
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Mapping tabs to backend status query params if needed
      // If activeTab is "All", we might send empty status
      const statusParam = activeTab === "All" ? "" : activeTab;
      
      const res = await axiosAdmin.get("/api/admin/orders", {
        params: { status: statusParam }
      });
      setOrders(res.data.orders || []); 
    } catch (err) {
      console.error("Failed to fetch orders", err);
      // Fallback for UI testing if backend isn't ready
      // setOrders([]); 
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axiosAdmin.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order ${orderId} updated to ${newStatus}`);
      fetchOrders(); // Refresh list
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleCancelClick = (orderId) => {
    setCancelModal({ show: true, orderId, reason: "" });
  };

  const confirmCancel = async () => {
    try {
      await axiosAdmin.post(`/api/admin/orders/${cancelModal.orderId}/cancel`, {
        reason: cancelModal.reason
      });
      toast.success("Order cancelled successfully");
      setCancelModal({ show: false, orderId: "", reason: "" });
      fetchOrders();
    } catch (err) {
      toast.error("Failed to cancel order");
    }
  };

  // Client-side pagination for now (switch to server-side if list is huge)
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="seller-orders-page container-fluid py-4 px-3 px-md-4">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="d-flex align-items-center mb-4">
        <NavLink to="/admin/dashboard" className="me-2 text-dark">
          <i className="bi bi-arrow-left-circle fs-5 clickable-icon"></i>
        </NavLink>
        <h4 className="fw-semibold mb-0">Admin Orders</h4>
      </div>

      <ul className="nav nav-pills nav-custom mb-3">
        {["All", "New", "Ready for dispatch", "Shipped", "Delivered", "Cancelled"].map((tab) => (
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
        {loading ? (
           <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
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
              <th>Action</th>
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
                          src={order.productImage || "/default-product.png"}
                          alt="product"
                          className="order-product-img rounded shadow-sm"
                        />
                      </div>
                      <span className="text-truncate" style={{maxWidth: '200px'}}>
                        {Array.isArray(order.products) ? order.products.join(", ") : order.productName}
                      </span>
                    </div>
                  </td>
                  <td>{order.quantity}</td>
                  <td>
                    {order.buyerName}
                    <br />
                    <small className="text-muted" style={{fontSize: '0.8rem'}}>{order.addressCity}</small>
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
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td>{new Date(order.created_at || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <select 
                        className="form-select form-select-sm" 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Ready for dispatch">Ready for dispatch</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
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
                    ) : order.status === "Delivered" ? (
                        <span className="text-success">Completed</span>
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
                <td colSpan="11" className="text-center text-muted py-4">
                  No orders found in this tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}

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