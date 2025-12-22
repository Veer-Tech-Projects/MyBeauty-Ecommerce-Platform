/*
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "@/app/styles/ProductGrid.css";
import "@/app/styles/RelatedProducts.css"; // for any custom slider tweaks

function RelatedProducts({ categoryId, excludeProductId }) {
  const [related, setRelated] = useState([]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!categoryId) return;
    fetch(`http://localhost:5000/api/products/category/${categoryId}/best-sellers`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(item => item.id !== excludeProductId);
        setRelated(filtered.slice(0, 8)); // ⬅️ LIMIT to 5 items only
      })
      .catch(console.error);
  }, [categoryId, excludeProductId]);

  const scroll = (direction) => {
    const cardWidth = 180; // card width + margin
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth'
      });
    }
  };

  if (related.length === 0) return null;

  
  return (
    <>
      <hr className="my-4" />
    <div className="position-relative px-2">
      <div className="d-flex justify-content-between align-items-center mb-3 px-1">
        <h5 className="fw-bold mb-0">Related Products</h5>
        <i
          className="bi bi-chevron-right fs-5 text-secondary cursor-pointer"
          onClick={() => navigate(`/category/${categoryId}/best-sellers`)}
        ></i>
      </div>
      <i
        className="bi bi-chevron-left fs-5 text-secondary slider-icon left"
        onClick={() => scroll('left')}
      ></i>
      <i
        className="bi bi-chevron-right fs-5 text-secondary slider-icon right"
        onClick={() => scroll('right')}
      ></i>
      <div className="d-flex related-scroll px-1" ref={scrollRef}>

        {related.map(prod => {
          const discounted = Math.round(prod.price - (prod.price * prod.discount / 100));
          return (
            <div
              className="me-3 related-product-item"
              key={prod.id}
              onClick={() => navigate(`/product/${prod.id}`)}
            >
              <div className="product-card">
                <div className="prod-img-wrapper">
                  <img src={`http://localhost:5000${prod.image_path}`} alt={prod.name} />
                  {prod.discount > 0 && (
                    <div className="discount-tag">
                      <span className="tag-hole"></span>
                      <span className="tag-text">{Math.round(prod.discount)}% OFF</span>
                    </div>
                  )}
                </div>
                <div className="product-name text-truncate">
                  {prod.brand} {prod.name}
                </div>
                <div className="product-price">
                  <span className="current-price">₹{discounted}</span>
                  <span className="original-price">₹{prod.mrp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}

export default RelatedProducts;
*/