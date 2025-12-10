import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { CartContext } from "../context/CartContext";
import "../styles/ProductGrid.css";

import ImageWithLoader from "../components/ImageWithLoader";
import SkeletonCard from "../components/SkeletonCard";

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [gridLoading, setGridLoading] = useState(true);
  const { cartItems } = useContext(CartContext);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("Invalid product response:", data);
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
      })
      .finally(() => setGridLoading(false));
  }, []);

  return (
    <div className="container mt-4 py-5">
      <div className="row g-4 justify-content-center">
        {gridLoading ? (
          <SkeletonCard count={12} />
        ) : (
          products.map((product) => {
            const discount = parseFloat(product.discount || 0);
            const originalPrice = parseFloat(product.mrp || 0);
            const discountedPrice = parseFloat(product.price || 0).toFixed(0);

            return (
              <div className="col-6 col-sm-4 col-md-3" key={product.id}>
                <Link
                  to={`/product/${product.id}`}
                  className="text-decoration-none text-dark"
                >
                  <div className="product-card">
                    {/* IMAGE */}
                    <div className="prod-img-wrapper">
                      <ImageWithLoader
                        src={`http://localhost:5000/${product.image_path}`}
                        alt={product.name}
                        className="w-100 h-100 object-fit-contain rounded-3"
                      />

                      {/* DISCOUNT TAG */}
                      {discount > 0 && (
                        <div className="discount-tag">
                          <span className="tag-hole"></span>
                          <span className="tag-text">{discount}% OFF</span>
                        </div>
                      )}
                    </div>

                    {/* NAME */}
                    <div className="product-name">{product.name}</div>

                    {/* PRICE */}
                    <div className="product-price">
                      {discount > 0 ? (
                        <>
                          <span className="current-price fw-bold me-1">
                            ₹{discountedPrice}
                          </span>
                          <span className="original-price text-muted">
                            ₹{originalPrice}
                          </span>
                        </>
                      ) : (
                        <span className="fw-bold">₹{originalPrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ShopPage;
