import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { CartContext } from '../context/CartContext';
import '../styles/ProductGrid.css';

import ImageWithLoader from '../components/ImageWithLoader';
import SkeletonCard    from '../components/SkeletonCard';

function CategoryProductsPage() {
  const { categoryId } = useParams();
  const [products, setProducts]   = useState([]);
  const [gridLoading, setLoading] = useState(true);
  const { cartItems } = useContext(CartContext);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/products/category/${categoryId}`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId]);

  const isInCart = id => cartItems.some(item => item.id === id);

  return (
    <div className="container py-5">
      <h3 className="product-heading">Products</h3>

      <div className="row g-4 justify-content-center">
        {gridLoading
          ? <SkeletonCard count={8} />
          : products.map(product => (
              <div className="col-6 col-sm-4 col-md-3" key={product.id}>
                <Link to={`/product/${product.id}`} className="text-decoration-none text-dark">
                  <div className="product-card">
                    <div className="prod-img-wrapper">
                      <ImageWithLoader
                        src={
                          product.image_path
                            ? `http://localhost:5000${product.image_path}`
                            : `http://localhost:5000/static/default-product.png`
                        }
                        alt={product.name}
                        className="w-100 h-100 object-fit-contain rounded-3"
                      />


                      {product.discount_percent > 0 && (
                        <div className="discount-tag">
                          <span className="tag-hole"></span>
                          <span className="tag-text">{product.discount_percent}% OFF</span>
                        </div>
                      )}
                    </div>

                    <div className="product-name">{product.name}</div>

                    <div className="product-price">
                      {product.discount_percent > 0 ? (
                        <>
                          <span className="current-price fw-bold me-1">
                            ₹{(product.price * (1 - product.discount_percent / 100)).toFixed(0)}
                          </span>
                          <span className="original-price">₹{product.price}</span>
                        </>
                      ) : (
                        <>₹{product.price}</>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
      </div>
    </div>
  );
}

export default CategoryProductsPage;
