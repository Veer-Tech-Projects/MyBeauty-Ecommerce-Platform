import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useBuyNow } from '../context/BuyNowContext';
import Slider from 'react-slick';
import { Button, Badge, Alert } from 'react-bootstrap';
import ImageWithLoader from '../components/ImageWithLoader';
import '../styles/ProductDetailPage.css';
import { useUser } from "../context/UserContext";
import { jwtDecode } from "jwt-decode";

function ProductDetailPage() {
  const { user } = useUser();
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const sliderRef = useRef(null);
  const { addToCart } = useCart();
  const { triggerBuyNow } = useBuyNow();
  const navigate = useNavigate();


  const token = localStorage.getItem("token");
  let currentUserId = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentUserId = decoded.sub || decoded.id || decoded.identity;
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

    useEffect(() => {
      fetch(`http://localhost:5000/api/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data);
          if (data.variants?.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        })
        .catch(console.error);
    }, [productId]);


  const display = selectedVariant || product;
  const sizeStock = display?.size_stock ? JSON.parse(display.size_stock) : null;
  const availableSizes = sizeStock ? Object.keys(sizeStock) : [];
  const hasSizes = availableSizes.length > 0;
  const globalStock = display?.stock || 0;

  const discount = display?.discount || 0;
  const price = display?.price || 0;
  const discountedPrice = (price - (price * discount / 100)).toFixed(0);

  const imageList = selectedVariant?.variant_images?.length
  ? selectedVariant.variant_images
  : product?.images?.length
  ? [...new Set(product.images.map(img => img.image_path))]
  : []
  ;

  const PrevArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <i
        className="bi bi-chevron-left"
        onClick={onClick}
        style={{
          ...style,
          color: 'gray',
          fontSize: '1.5rem',
          position: 'absolute',
          left: '-30px',
          top: '45%',
          zIndex: 2,
          cursor: 'pointer',
        }}
      />
    );
  };

  const NextArrow = (props) => {
    const { className, style, onClick } = props;
    return (
      <i
        className="bi bi-chevron-right"
        onClick={onClick}
        style={{
          ...style,
          color: 'gray',
          fontSize: '1.5rem',
          position: 'absolute',
          right: '-30px',
          top: '45%',
          zIndex: 2,
          cursor: 'pointer',
        }}
      />
    );
  };


  const sliderSettings = {
    dots: imageList.length > 1,
    arrows: imageList.length > 1,
    infinite: imageList.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    className: "mb-3 pd-slider"
  };


  const selectedSizeStock = hasSizes ? sizeStock[selectedSize] || 0 : globalStock;

  const incQty = () => setQuantity(q => Math.min(q + 1, selectedSizeStock));
  const decQty = () => setQuantity(q => Math.max(1, q - 1));

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setSelectedSize(null);
    setQuantity(1);
    setTimeout(() => sliderRef.current?.slickGoTo(0), 100);
  };

  const handleAddToCart = () => {
  console.log('Add to cart clicked ✅');
  const variant = selectedVariant;

  // Safely extract usable single image string
  let imgSrc = null;
  if (variant?.image) {
    imgSrc = variant.image;
  } else if (variant?.variant_images?.length > 0) {
    imgSrc = variant.variant_images[0].image_path; // << correct
  } else if (product?.images?.length > 0) {
    // product.images can be array of objects or strings
    if (typeof product.images[0] === 'string') {
      imgSrc = product.images[0];
    } else {
      imgSrc = product.images[0].image_path;
    }
  } else {
    imgSrc = product?.image;
  }

  addToCart(
    {
      id: product.id,
      name: product.name,
      price: parseFloat(variant?.price || product.price || 0),
      discount: parseFloat(variant?.discount || product.discount || 0),
      stock: parseInt(variant?.stock || product.stock || 0),
      image: imgSrc,                       // ✅ ONLY STRING NOW
    },
    variant || null,
    selectedSize || null,
    quantity
  );
};


const handleBuyNow = () => {
    const variant = selectedVariant;

    // Normalize image (Flipkart-style: always absolute URLs)
    const normalizeImage = (img) => {
      if (!img) return '/fallback.png';
      if (img.startsWith('http')) return img;
      const clean = img.replace(/^\/+/, '');
      const base = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
      return `${base}/${clean}`;
    };

    // Pick the correct image
    let rawImage = null;
    if (variant?.image) {
      rawImage = variant.image;
    } else if (variant?.variant_images?.length > 0) {
      rawImage = variant.variant_images[0]?.image_path;
    } else if (product?.images?.length > 0) {
      rawImage = typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0]?.image_path;
    } else {
      rawImage = product?.image || null;
    }

    const finalImg = normalizeImage(rawImage);

    // Pricing logic
    const basePrice = variant?.price ?? product.price;
    const discountPct = variant?.discount ?? product.discount ?? 0;
    const finalPrice = Number((basePrice * (1 - discountPct / 100)).toFixed(2));

    // Payload for Buy Now
    const buyNowPayload = {
      product_id: product.id,
      variant_id: variant?.id || null,
      name: product.name,
      price: basePrice,
      discount_percent: discountPct,
      final_price: finalPrice,
      quantity,
      stock: variant?.stock ?? product.stock,
      size_stock: variant?.size_stock ?? product.size_stock,
      size: selectedSize || null,
      cod_available: Boolean(variant?.cod_available ?? product.cod_available),
      image: finalImg,
      variant_images: variant?.variant_images || [],
      weight: variant?.weight ?? product.weight ?? 2.000,
    };

    // Clear stale localStorage
    localStorage.removeItem("buyNowItem");
    console.log("🔥 BuyNow -> payload (before trigger):", buyNowPayload);

    // Trigger Buy Now
    triggerBuyNow(buyNowPayload);
    navigate("/checkout/address", { state: { buyMode: true } });

    // Debug logs
    console.log("🧩 Selected Variant:", selectedVariant);
    console.log("🧩 Product images:", product?.images);
  };


  const isOutOfStock = globalStock === 0;
  const disableActionButtons = hasSizes
    ? !selectedSize || sizeStock[selectedSize] === 0
    : isOutOfStock;

  if (!product) return <div className="container py-5">Loading…</div>;

  return (
    <div className="container mt-4 py-5 pd-page">
      <div className="row g-5">
        {/* LEFT COLUMN: Image + Variants */}
        <div className="col-md-6 text-center">
          {/* Slider */}
          {imageList.length > 0 && (
            <Slider {...sliderSettings} ref={sliderRef} className="slick-custom">
              {imageList.map((imgPath, index) => (
                <div key={index}>
                  <ImageWithLoader
                    src={`http://localhost:5000${imgPath}`}
                    className="pd-main-img"
                    alt={`Product ${index + 1}`}
                    style={{
                      height: '400px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                    }}
                  />
                </div>
              ))}
            </Slider>
          )}

          {/* Colour Variants Section */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2 px-2">
              <div className="fw-semibold">Colours</div>
              <div className="d-flex gap-2">
                {/* Main Swatch */}
                <div
                  onClick={() => handleVariantSelect(null)}
                  className="rounded-circle border"
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: product.color_code || '#ddd',
                    cursor: 'pointer',
                  }}
                  title={product.color_name}
                ></div>

                {/* Variant Swatches */}
                {product.variants?.map((variant) => (
                  <div
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    className="rounded-circle border"
                    style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: variant.color_code || '#ddd',
                      cursor: 'pointer',
                    }}
                    title={variant.color_name}
                  ></div>
                ))}
              </div>
            </div>


            {/* Thumbnails */}
            <div className="d-flex flex-wrap gap-3 justify-content-center">
              {/* Main Thumbnail */}
              {product.images?.[0] && (
                <div
                  className="text-center"
                  onClick={() => handleVariantSelect(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={`http://localhost:5000${product.images[0].image_path}`}
                    className={`pd-thumb-img ${!selectedVariant ? 'selected-ring' : ''}`}
                    alt="Main"
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: !selectedVariant ? '2px solid #000' : '1px solid #ccc',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <div className="text-muted small mt-1">{product.color_name}</div>
                </div>
              )}

              {/* Variant Thumbnails */}
              {product.variants?.map((variant) => (
                <div
                  key={variant.id}
                  className="text-center"
                  onClick={() => handleVariantSelect(variant)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={`http://localhost:5000${
                      variant.variant_images?.[0] || variant.image_path
                    }`}
                    className={`pd-thumb-img ${selectedVariant?.id === variant.id ? 'selected-ring' : ''}`}
                    alt={variant.color_name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: selectedVariant?.id === variant.id ? '2px solid #000' : '1px solid #ccc',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <div className="text-muted small mt-1">{variant.color_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Info */}
        <div className="col-md-6">
          <h2 className="fw-bold">{`${product.brand} ${product.name}`}</h2>

          {/* Price */}
          <div className="pd-price fs-4 fw-bold mt-2">
            ₹{discountedPrice}
            <span className="text-muted text-decoration-line-through ms-2">₹{price}</span>
            {discount > 0 && (
              <Badge bg="danger" className="ms-2">
                {Math.round(discount)}% OFF
              </Badge>
            )}
          </div>

          {/* Delivery & Policy */}
          <p className="text-muted mt-2">
            <i className="bi bi-truck"></i>{' '}
            {product.delivery_type === 'free' ? 'Free Delivery' : `₹${product.delivery_charge} Delivery`}<br />
            <i className="bi bi-cash"></i>{' '}
            {product.cod_available ? 'Cash on Delivery available' : 'No COD'}<br />
            <i className="bi bi-arrow-counterclockwise"></i>{' '}
            {product.return_policy || 'Returns not applicable'}
          </p>

          {/* Size Selector */}
          {hasSizes && (
            <div className="mb-3">
              <div className="form-label">Select Size:</div>
              <div className="d-flex gap-2 flex-wrap">
                {availableSizes.map(size => {
                  const stock = sizeStock[size];
                  const isUnavailable = stock === 0;
                  const isLowStock = stock < 10 && stock > 0;
                  const isSelected = selectedSize === size;

                  return (
                    <div
                      key={size}
                      className="position-relative text-center"
                      style={{
                        minWidth: isUnavailable ? '70px' : 'auto',
                        marginRight: isUnavailable ? '0.5rem' : 0,
                        marginBottom: '0.5rem',
                      }}
                    >
                      <Button
                        size="sm"
                        variant={isSelected ? 'dark' : 'outline-dark'}
                        disabled={isUnavailable}
                        className="px-2 py-1"
                        onClick={() => {
                          setSelectedSize(size);
                          setQuantity(1);
                        }}
                        style={{ width: '40px' }}
                      >
                        {size}
                      </Button>

                      {isUnavailable && (
                        <Badge
                          bg=""
                          className="position-absolute top-50 start-50 translate-middle rounded-pill border border-danger text-danger px-2"
                          style={{
                            fontSize: '0.6rem',
                            backgroundColor: 'transparent',
                            pointerEvents: 'none',
                            zIndex: 2,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Unavailable
                        </Badge>
                      )}

                      {isLowStock && !isUnavailable && (
                        <div className="text-danger small mt-1">{stock} left</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Status */}
          {globalStock === 0 && (
            <Alert variant="danger" className="fw-semibold py-2">Out of Stock</Alert>
          )}
          {globalStock > 0 && globalStock < 10 && (
            <p className="fw-semibold text-danger">Only {globalStock} left</p>
          )}

          {/* Quantity Selector */}
          {globalStock > 0 && (
            <div className="mb-3">
              <label className="form-label">Quantity</label>
              <div className="d-flex align-items-center gap-2">
                <Button variant="outline-secondary" onClick={decQty} disabled={quantity === 1}>−</Button>
                <span>{quantity}</span>
                <Button variant="outline-secondary" onClick={incQty} disabled={quantity === selectedSizeStock}>+</Button>
              </div>
            </div>
          )}

          {/* Cart + Buy Now */}
          <div className="d-grid gap-2 mt-3">
            <Button
              variant="outline-dark"
              onClick={handleAddToCart}
              disabled={disableActionButtons}
            >
              Add to Cart
            </Button>
            <Button
              variant="dark"
              onClick={handleBuyNow}
              disabled={disableActionButtons}
            >
              Buy Now
            </Button>
          </div>

          {/* Description */}
          <div className="mt-4">
            <h5>Product Details</h5>
            <p className="text-muted small">{product.description}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
