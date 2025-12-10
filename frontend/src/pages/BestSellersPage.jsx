import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import '../styles/ProductGrid.css';

function BestSellersPage() {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/category/${categoryId}/best-sellers`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [categoryId]);

  return (
    <Container className="py-4">
      <h3 className="product-heading">Top Sellers in This Category</h3>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5 text-muted">No products found.</div>
      ) : (
        <div className="row g-4">
          {products.map(product => {
            const discounted = Math.round(product.price - (product.price * product.discount / 100));
            return (
              <div className="col-6 col-sm-4 col-md-3" key={product.id}>
                <div
                  className="product-card cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="prod-img-wrapper">
                    <img src={`http://localhost:5000${product.image_path}`} alt={product.name} />
                    {product.discount > 0 && (
                      <div className="discount-tag">
                        <span className="tag-hole"></span>
                        <span className="tag-text">{Math.round(product.discount)}% OFF</span>
                      </div>
                    )}
                  </div>
                  <div className="product-name text-truncate">{product.brand} {product.name}</div>
                  <div className="product-price">
                    <span className="current-price">₹{discounted}</span>
                    <span className="original-price">₹{product.mrp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}

export default BestSellersPage;
