import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithLoader from "@/shared/components/ImageWithLoader";     // ✅ per‑image loader
import "@/app/styles/ProductGrid.css";                  // reuse grid styles

const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE = envBase ? envBase.replace(/\/$/, '') : 'http://localhost:5000';

export default function ProductCard({ product }) {
  const {
    id,
    name,
    price,
    discount,
    image_url,
    stock
  } = product;

  const discountedPrice = discount
    ? Math.round(price - (price * discount) / 100)
    : price;

  const fullImg = image_url?.startsWith('http')
    ? image_url
    : `${API_BASE}${image_url}`;

  return (
    <Link to={`/product/${id}`} className="text-decoration-none text-dark">
      <div className="product-card">
        {/* 🖼 image + swinging tag */}
        <div className="prod-img-wrapper">
          <ImageWithLoader
            src={fullImg}
            alt={name}
            className="w-100 h-100 object-fit-contain rounded-3"
          />

          {discount > 0 && (
            <div className="discount-tag">
              <span className="tag-hole" />
              <span className="tag-text">{discount}% OFF</span>
            </div>
          )}
        </div>

        {/* name & price */}
        <div className="product-name">{name}</div>
        <div className="product-price">
          {discount > 0 ? (
            <>
              <span className="current-price fw-bold me-1">₹{discountedPrice}</span>
              <span className="original-price">₹{price}</span>
            </>
          ) : (
            <>₹{price}</>
          )}
        </div>
      </div>
    </Link>
  );
}
