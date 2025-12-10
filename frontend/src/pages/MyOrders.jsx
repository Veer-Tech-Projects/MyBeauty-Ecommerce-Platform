// src/pages/MyOrdersPage.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/MyOrders.css';
import { getFullImageUrl } from '../utils/getFullImageUrl';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders once
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const { data } = await axios.get('http://localhost:5000/api/get-orders', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrders(data.orders || []);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const removeLocal = (orderId) => {
    setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '45vh' }}>
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-wrapper">
      <h3 className="mb-4">My Orders</h3>

      {orders.length === 0 ? (
        <p className="text-muted">No orders found.</p>
      ) : (
        orders.map((order) => {
          const placedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <div key={order.order_id} className="card order-card">
              {/* Order Header */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="m-0">
                    Order ID: {order.order_id}{' '}
                    <span className="badge bg-secondary">{order.status}</span>
                  </h6>
                  <small className="text-muted">Placed on {placedDate}</small>

                  {order.tracking_url && (
                    <div>
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tracking-link"
                      >
                        <i className="bi bi-truck me-1"></i>
                        Track shipment
                      </a>
                    </div>
                  )}
                </div>
                <button
                  className="remove-icon-btn"
                  title="Remove"
                  onClick={() => removeLocal(order.order_id)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Order Items */}
              <div className="row">
                {order.items.map((it, idx) => (
                  <div key={idx} className="col-6 col-md-4 col-lg-3 mb-3">
                    <div className="order-item-box">
                      <img
                        src={getFullImageUrl(it.image_url)}
                        alt={it.product_name}
                        className="order-item-thumb"
                        onError={(e) => (e.target.src = '/default-product.png')}
                      />
                      <div className="small fw-semibold mt-2">{it.product_name}</div>
                      <div className="small text-muted">
                        Qty {it.quantity} × ₹{it.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-total mt-1">Total: ₹{order.amount}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
