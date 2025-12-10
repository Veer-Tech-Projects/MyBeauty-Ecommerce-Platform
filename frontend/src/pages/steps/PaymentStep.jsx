//PaymentStep.jsx :

import React, { useEffect, useState, useMemo, useContext } from "react";
import { Card, Row, Col, Button, Form, Spinner, Badge, Modal } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../utils/axiosUser";
import { toast } from "react-toastify";
import { CartContext } from "../../context/CartContext";
import { useBuyNow } from "../../context/BuyNowContext";
import "../../styles/PaymentStep.css";
import { debounce } from "lodash";

export default function PaymentStep() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useContext(CartContext);
  const { buyNowItem, clearBuyNow } = useBuyNow();

  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState("razorpay");
  const [showAwaitModal, setShowAwaitModal] = useState(false);
  const [polling, setPolling] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);
  const [codAllowed, setCodAllowed] = useState(false);
  const [codReasons, setCodReasons] = useState([]);
  const [codLoading, setCodLoading] = useState(false);

  const { address, buyMode = false } = location.state || {};

  // Debug context changes
  useEffect(() => {
    console.log("Context Update:", { cartItems, buyNowItem });
  }, [cartItems, buyNowItem]);

  // Memoized items payload
  const itemsPayload = useMemo(() => {
    console.log("ItemsPayload recomputed:", { buyMode, buyNowItem, cartItems });
    if (buyMode && buyNowItem) {
      return [{
        product_id: buyNowItem.product_id || buyNowItem.id,
        quantity: buyNowItem.quantity || 1,
        seller_id: buyNowItem.seller_id || null,
        product_name: buyNowItem.name || "Unnamed Product",
        image_url: buyNowItem.image || "http://example.com/fallback.png",
        price: buyNowItem.price || 0.00,
        weight: buyNowItem.weight || 2.000,
        size: buyNowItem.size || null,
        variant_id: buyNowItem.variant_id || null
      }];
    }
    return cartItems?.map(c => ({
      product_id: c.product_id,
      quantity: c.quantity,
      seller_id: c.seller_id || null,
      product_name: c.name || "Unnamed Product",
      image_url: c.image || "http://example.com/fallback.png",
      price: c.price || 0.00,
      weight: c.weight || 2.000,
      size: c.size || null,
      variant_id: c.variant_id || null
    })) || [];
  }, [buyMode, buyNowItem, cartItems]);

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0, saving = 0;
    const items = buyMode && buyNowItem ? [buyNowItem] : cartItems || [];
    items.forEach(item => {
      const mrp = Number(item.price);
      const discount = (Number(item.discount_percent || 0) / 100) * mrp;
      subtotal += mrp * (item.quantity || 1);
      saving += discount * (item.quantity || 1);
    });
    return { subtotal, saving, total: subtotal - saving };
  }, [buyMode, buyNowItem, cartItems]);

  // Debounced COD validation
  const validateCod = useMemo(() => debounce(async () => {
    if (itemsPayload.length === 0) {
      setCodAllowed(false);
      setCodReasons(["No items to validate"]);
      setCodLoading(false);
      return;
    }

    setCodLoading(true);
    try {
      const res = await axios.post("/api/payment/cod-validate", { items: itemsPayload }, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("user_token")}` }
      });
      console.log("COD Validate Response:", res.data);
      setCodAllowed(res.data.cod_allowed);
      setCodReasons(res.data.reasons || []);
    } catch (err) {
      console.error("COD Validate Error:", err.response?.data || err.message);
      setCodAllowed(false);
      setCodReasons(["Failed to validate COD availability"]);
    } finally {
      setCodLoading(false);
    }
  }, 200), [itemsPayload]);

  // Fetch COD availability on items change
  useEffect(() => {
    validateCod();
    return () => validateCod.cancel();
  }, [itemsPayload, validateCod, cartItems.length, JSON.stringify(buyNowItem)]); // Fix: Deep comparison

  // Load Razorpay SDK
  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Redirect on invalid state
  useEffect(() => {
    if (!address) {
      toast.info("Please select delivery address");
      navigate("/checkout/address");
    }
    if (itemsPayload.length === 0) {
      toast.info("No items to checkout");
      navigate("/cart");
    }
  }, [address, itemsPayload, navigate]);

  const createOrder = async (mode = "online") => {
    setProcessing(true);
    try {
      const res = await axios.post("/api/payment/create", {
        address_id: address.id,
        items: itemsPayload,
        subtotal: totals.subtotal,
        total_amount: totals.total,
        payment_mode: mode,
      }, {
        headers: { "Idempotency-Key": `test-${Date.now()}` }
      });
      if (!res.data?.data?.order_id) throw new Error(res.data?.data?.message || res.data?.message || "Order creation failed");
      setOrderResponse(res.data.data);
      return res.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const openRazorpay = (checkout, parentOrderId) => {
    if (!window.Razorpay) return toast.error("Payment service unavailable");
    const options = {
      key: checkout.key,
      amount: checkout.amount,
      currency: checkout.currency,
      order_id: checkout.order_id,
      handler: async (response) => {
        console.log("=== RAZORPAY RESPONSE FOR TESTING ===");
        console.log("Order ID (Backend):", parentOrderId);
        console.log("Razorpay Order ID:", response.razorpay_order_id);
        console.log("Razorpay Payment ID:", response.razorpay_payment_id);
        console.log("Razorpay Signature:", response.razorpay_signature);
        console.log("=====================================");

        try {
          const verifyRes = await axios.post("/api/payment/verify", {
            order_id: parentOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("user_token")}`,
              "X-Razorpay-Signature": response.razorpay_signature || ""
            }
          });
          if (verifyRes.data.status === "success") {
            toast.success("Payment verified. Redirecting...");
            clearCart();
            clearBuyNow();
            navigate("/checkout/success", { state: { orderId: parentOrderId, paymentMode: "online" } });
          }
        } catch (err) {
          console.error("Verify Error:", err.response?.data || err.message);
          toast.error("Payment verification failed");
          setShowAwaitModal(true);
        }
      },
      prefill: { name: "Test User", contact: "9999999999" },
      notes: { user_id: getJwtIdentity() },
      theme: { color: "#3399cc" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleSubmit = async () => {
    try {
      const responseData = await createOrder(selected === "cod" ? "cod" : "online");
      const parentOrderId = responseData.order_id;
      if (selected === "cod") {
        toast.success("Order placed with COD");
        clearCart();
        clearBuyNow();
        navigate("/checkout/success", { state: { orderId: parentOrderId, paymentMode: "cod" } });
      } else {
        const checkout = Array.isArray(responseData.razorpay) ? responseData.razorpay[0] : responseData.razorpay;
        if (checkout) {
          openRazorpay(checkout, parentOrderId);
        } else {
          throw new Error("No Razorpay checkout data");
        }
      }
    } catch (err) {
      console.error("Submit Error:", err);
      if (err.response?.data?.error.includes("COD not available")) {
        toast.error(`COD not available: ${err.response.data.reasons.join(", ")}`);
      } else {
        toast.error("Failed to place order");
      }
    }
  };

  const checkOrderStatus = async (parentOrderId) => {
    setPolling(true);
    try {
      const res = await axios.get(`/api/orders/status/${parentOrderId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("user_token")}` }
      });
      const order = res.data?.parent;
      if (order?.payment_status === "paid") {
        toast.success("Payment confirmed");
        clearCart();
        clearBuyNow();
        setShowAwaitModal(false);
        navigate("/checkout/success", { state: { orderId: order.id } });
      } else {
        toast.info("Still confirming payment. Please retry.");
      }
    } catch (err) {
      console.error("Status Check Error:", err.response?.data || err.message);
      toast.error("Failed to check order status");
    } finally {
      setPolling(false);
    }
  };

  const getJwtIdentity = () => {
    return localStorage.getItem("userId") || 10;
  };

  return (
    <div className="payment-step container py-3">
      <Row className="g-3">
        {/* Payment Options */}
        <Col lg={7}>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Choose Payment Method</h5>
              <Form>
                <div
                  className={`pay-option ${selected === "razorpay" ? "selected" : ""}`}
                  onClick={() => setSelected("razorpay")}
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold">
                        <i className="bi bi-credit-card me-2" /> Pay Online
                      </div>
                      <div className="small text-muted">Cards, UPI, Wallets</div>
                    </div>
                    <i
                      className={`bi ${
                        selected === "razorpay"
                          ? "bi-check-circle-fill text-success"
                          : "bi-circle"
                      } fs-4`}
                    />
                  </div>
                  <img src="/assets/razorpay1.png" alt="razorpay" height="28" />
                </div>

                <div
                  className={`pay-option ${selected === "cod" ? "selected" : ""} ${
                    !codAllowed ? "disabled" : ""
                  }`}
                  onClick={() => codAllowed && setSelected("cod")}
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold">
                        <i className="bi bi-cash-coin me-2" /> Cash on Delivery
                        {codLoading && <Spinner size="sm" className="ms-2" />}
                      </div>
                      <div className="small text-muted">Pay at delivery</div>
                    </div>
                    <i
                      className={`bi ${
                        selected === "cod"
                          ? "bi-check-circle-fill text-success"
                          : "bi-circle"
                      } fs-4`}
                    />
                  </div>
                  {!codAllowed && (
                    <Badge bg="warning" text="dark" className="mt-2">
                      {codReasons.length > 0
                        ? codReasons.join(", ")
                        : "COD not available for selected items"}
                    </Badge>
                  )}
                </div>
              </Form>

              <div className="mt-3 text-muted small">
                By placing the order you agree to our Terms & Conditions.
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Price + Address */}
        <Col lg={5}>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <h6 className="fw-semibold">Price Details</h6>
              <hr />
              <div className="d-flex justify-content-between small"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="d-flex justify-content-between small text-success"><span>You Saved</span><span>- ₹{totals.saving.toFixed(2)}</span></div>
              <hr />
              <div className="d-flex justify-content-between fw-bold"><span>Total Payable</span><span>₹{totals.total.toFixed(2)}</span></div>
            </Card.Body>
          </Card>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <h6 className="fw-semibold">Delivering to</h6>
              {address ? (
                <>
                  <div className="fw-bold">{address.fullname} — {address.phone}</div>
                  <div className="text-muted small">{address.house}, {address.road}, {address.city} — {address.pincode}</div>
                </>
              ) : <div className="text-muted">No address selected</div>}
            </Card.Body>
          </Card>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="fw-semibold">Need help?</h6>
              <div className="small text-muted">Call our support at <strong>1800-XXX-XXX</strong> or email support@example.com</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sticky Bottom Button */}
      <div className="pay-btn-wrapper">
        <Button variant="primary" size="lg" disabled={processing || codLoading} onClick={handleSubmit}>
          {processing || codLoading ? <Spinner size="sm" /> : selected === "cod" ? "Place Order" : "Pay & Place Order"}
        </Button>
      </div>

      {/* Await Modal */}
      <Modal show={showAwaitModal} onHide={() => setShowAwaitModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirming Payment</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>Please wait while we confirm your payment. You can also check status manually.</p>
          <Button disabled={polling} onClick={() => checkOrderStatus(orderResponse?.order_id)}>
            {polling ? <Spinner size="sm" /> : "Check Status"}
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
}