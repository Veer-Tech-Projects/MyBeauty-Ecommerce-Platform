import React, { useContext, useMemo } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import '../styles/CartPage.css';

function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, loading } = useContext(CartContext);

  const inStockItems = useMemo(
    () => cartItems.filter(item => item.effective_stock > 0),
    [cartItems]
  );

  const total = useMemo(
    () =>
      inStockItems.reduce((sum, item) => sum + item.final_price * item.quantity, 0),
    [inStockItems]
  );

  const totalSavings = useMemo(
    () =>
      inStockItems.reduce(
        (sum, item) => sum + (item.price - item.final_price) * item.quantity,
        0
      ),
    [inStockItems]
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container py-5">
        <h2 className="text-center fw-bold mb-4 cart-heading">Your Cart</h2>

        {cartItems.length === 0 ? (
          <p className="text-center text-muted">Your cart is empty.</p>
        ) : (
          <div className="row">
            <div className="col-md-8">
              {cartItems.map(item => {
                const outOfStock = item.is_out_of_stock || item.effective_stock <= 0;

                return (
                  <div
                    key={item.cart_id}
                    className={`cart-item d-flex align-items-center justify-content-between mb-3 ${outOfStock ? 'out-of-stock-item' : ''}`}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <Link to={`/product/${item.product_id}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cart-thumbnail"
                        />
                      </Link>

                      <div>
                        <h5 className="mb-1">
                          {item.name}
                          {item.discount_percent > 0 && (
                            <span className="text-muted ms-2 fs-6 text-decoration-line-through">
                              ₹{item.price.toFixed(0)}
                            </span>
                          )}
                          <span className="text-dark fw-semibold ms-2">
                            ₹{item.final_price.toFixed(0)}
                          </span>
                          {item.discount_percent > 0 && (
                            <span className="badge bg-success ms-2">
                              {item.discount_percent}% OFF
                            </span>
                          )}
                          {outOfStock && (
                            <span className="badge bg-danger ms-2">Out of Stock</span>
                          )}
                        </h5>

                        {item.size && (
                          <p className="mb-1 text-muted">Size: {item.size}</p>
                        )}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            Math.max(1, item.quantity - 1),
                            item.variant_id,
                            item.size
                          )
                        }
                        disabled={item.quantity <= 1 || outOfStock}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() =>
                          updateQuantity(
                            item.product_id,
                            Math.min(item.quantity + 1, item.effective_stock),
                            item.variant_id,
                            item.size
                          )
                        }
                        disabled={item.quantity >= item.effective_stock || outOfStock}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        removeFromCart(item.product_id, item.variant_id, item.size)
                      }
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="col-md-4">
              <div className="cart-summary shadow-sm p-4 rounded">
                <h5 className="fw-bold mb-4">Cart Summary</h5>

                {inStockItems.length === 0 ? (
                  <p className="text-muted">No in-stock items to checkout.</p>
                ) : (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal</span>
                      <span>₹{total.toFixed(0)}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="d-flex justify-content-between text-success mb-2">
                        <span>You Saved</span>
                        <span>₹{totalSavings.toFixed(0)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="d-flex justify-content-between fw-bold mb-3">
                      <span>Total</span>
                      <span>₹{total.toFixed(0)}</span>
                    </div>
                    <Link
                      to="/checkout"
                      className="btn btn-checkout w-100 rounded-pill"
                      disabled={inStockItems.length === 0}
                    >
                      Proceed to Checkout
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
