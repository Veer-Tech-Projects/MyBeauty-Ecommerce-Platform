//OrderSummary.jsx :

import React, { useMemo, useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import { useCart } from "../../context/CartContext";
import { useBuyNow } from "../../context/BuyNowContext"; // Add import
import "../../styles/OrderSummary.css";

const OrderSummary = ({ selectedAddress, onContinue, buyMode = false }) => {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const { buyNowItem, updateBuyNowQty } = useBuyNow(); // Add hook
  const [items, setItems] = useState([]);

  // Normalize image URLs
  const normalizeImage = (img) => {
    if (!img) return "/fallback.png";
    if (img.startsWith("http")) return img;
    const clean = img.replace(/^\/+/, "");
    const base = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
    return `${base}/${clean}`;
  };

  useEffect(() => {
    console.log("OrderSummary useEffect:", { buyMode, buyNowItem, cartItems }); // Debug
    if (buyMode) {
      if (buyNowItem && buyNowItem.product_id) {
        const effectiveStock = buyNowItem.effective_stock ?? buyNowItem.stock;
        if (effectiveStock > 0) {
          setItems([
            {
              ...buyNowItem,
              image: normalizeImage(buyNowItem.image),
              quantity: buyNowItem.quantity || 1,
            },
          ]);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } else {
      if (cartItems?.length) {
        const mapped = cartItems.map((c) => ({
          ...c,
          image: normalizeImage(c.image),
        }));
        setItems(mapped.filter((i) => (i.effective_stock ?? i.stock) > 0));
      } else {
        setItems([]);
      }
    }
    console.log("OrderSummary items set:", items); // Debug
  }, [cartItems, buyMode, buyNowItem]); // Add buyNowItem to deps

  // Flipkart-style totals
  const totals = useMemo(() => {
    let subtotal = 0, saving = 0;
    items.forEach((item) => {
      const mrp = item.price;
      const discount = (item.discount_percent / 100) * mrp;
      subtotal += mrp * item.quantity;
      saving += discount * item.quantity;
    });
    return {
      subtotal,
      saving,
      totalAmount: subtotal - saving,
    };
  }, [items]);

  // Handle qty change
  const handleQty = (item, q) => {
    if (buyMode) {
      updateBuyNowQty(item.product_id, q); // Update Buy Now quantity
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === item.product_id ? { ...i, quantity: q } : i
        )
      );
    } else {
      updateQuantity(item.product_id, q, item.variant_id, item.size);
    }
    console.log("OrderSummary qty updated:", { product_id: item.product_id, quantity: q }); // Debug
  };

  return (
    <div className="order-summary-page pt-3">
      {/* Delivery Address */}
      {selectedAddress && (
        <Card className="mb-3 shadow-sm border-0">
          <Card.Body>
            <h6 className="fw-bold mb-2">
              <i className="bi bi-geo-alt me-2"></i> Delivery Address
            </h6>
            <small>
              {selectedAddress.fullname} - {selectedAddress.phone}
            </small>
            <div className="text-muted small">
              {selectedAddress.house}, {selectedAddress.road},{" "}
              {selectedAddress.city} - {selectedAddress.pincode}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Items */}
      {items.map((item, idx) => (
        <Card key={idx} className="mb-2 product-mini-card shadow-sm">
          <Card.Body className="p-2">
            <Row className="align-items-center gx-2">
              <Col xs="auto" className="p-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="img-fluid rounded product-img"
                />
              </Col>
              <Col className="p-0">
                <div className="d-flex justify-content-between">
                  <div className="product-info">
                    <div className="fw-bold small">{item.name}</div>
                    {item.size && (
                      <small className="text-muted d-block">
                        Size: {item.size}
                      </small>
                    )}
                    <div className="d-flex align-items-center gap-1">
                      <span className="fw-bold">
                        ₹{item.final_price.toFixed(2)}
                      </span>
                      {item.discount_percent > 0 && (
                        <>
                          <small className="text-muted text-decoration-line-through">
                            ₹{item.price}
                          </small>
                          <Badge bg="success" className="ms-1">
                            {item.discount_percent}% OFF
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="d-flex flex-column align-items-end ms-2">
                    {/* Cart-only delete */}
                    {!buyMode && (
                      <i
                        className="bi bi-trash text-danger mb-2"
                        role="button"
                        onClick={() =>
                          removeFromCart(
                            item.product_id,
                            item.variant_id,
                            item.size
                          )
                        }
                      ></i>
                    )}
                    <div className="d-flex align-items-center gap-1">
                      <small className="text-muted">Qty</small>
                      <Form.Select
                        size="sm"
                        className="w-auto"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQty(item, parseInt(e.target.value))
                        }
                      >
                        {Array.from(
                          { length: item.effective_stock ?? item.stock ?? 1 },
                          (_, i) => i + 1
                        ).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}

      {/* Price Details */}
      {items.length > 0 && (
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <h6 className="fw-bold mb-2">
              <i className="bi bi-bag-fill me-1"></i> Price Details
            </h6>
            <hr className="my-2" />
            <div className="d-flex justify-content-between small mb-1">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between small text-success mb-1">
              <span>You Saved</span>
              <span>- ₹{totals.saving.toFixed(2)}</span>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total Payable</span>
              <span>₹{totals.totalAmount.toFixed(2)}</span>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Continue */}
      {items.length > 0 && (
        <div className="text-end mb-4">
          <Button
            variant="primary"
            size="sm"
            className="d-inline-flex align-items-center gap-2 px-3 py-2"
            onClick={onContinue}
          >
            Continue <i className="bi bi-arrow-right-circle-fill"></i>
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;