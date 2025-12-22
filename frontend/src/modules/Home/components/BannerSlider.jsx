import React from 'react';
import { useNavigate } from 'react-router-dom';
import "@/app/styles/BannerSlider.css";

const slides = [
  {
    heading: 'Elegant Essentials',
    text: 'Discover timeless fashion curated just for you.',
    image: '/assets/model-design.png',
    button: 'Shop Now',
    to: '/shop',
  },
  {
    heading: 'Minimal Style',
    text: 'Crafted with comfort and beauty in mind.',
    image: '/assets/register-model.png',
    button: 'Explore',
    to: '/category/minimal',
  },
  {
    heading: 'Timeless Accessories',
    text: 'Style that lasts through every season.',
    image: '/assets/model-design.png',
    button: 'View Collection',
    to: '/category/accessories',
  },
];

const BannerSlider = () => {
  const navigate = useNavigate();

  const handleNavigate = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div className="container py-4">
      <div
        id="mainBannerCarousel"
        className="carousel slide"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        <div className="carousel-inner rounded-4 shadow-sm">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`carousel-item ${idx === 0 ? 'active' : ''}`}
            >
              <div className="banner-slide d-flex flex-column flex-md-row align-items-center px-4 px-md-5 py-5">
                {/* TEXT */}
                <div className="col-md-6 text-start mb-4 mb-md-0">
                  <h1 className="banner-title mb-3">{slide.heading}</h1>
                  <p className="banner-text">{slide.text}</p>

                  <button
                    className="btn banner-btn mt-2"
                    onClick={(e) => handleNavigate(e, slide.to)}
                  >
                    {slide.button}
                  </button>
                </div>

                {/* IMAGE */}
                <div className="col-md-6 d-flex justify-content-center">
                  <img
                    src={slide.image}
                    alt={slide.heading}
                    className="banner-img"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* arrows */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#mainBannerCarousel"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" />
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#mainBannerCarousel"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" />
        </button>
      </div>
    </div>
  );
};

export default BannerSlider;
