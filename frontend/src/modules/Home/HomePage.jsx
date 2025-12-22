// src/modules/Home/HomePage.jsx
import React from "react";
// Adjust imports based on the new folder structure
import BannerSlider from "@/modules/Home/components/BannerSlider";
import CategorySection from "@/modules/Home/components/CategorySection";
import ProductGrid from "@/modules/Product/components/ProductGrid"; 
// Note: ProductGrid is imported from the Product module because it's shared/related to products

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <BannerSlider />

      {/* Categories */}
      <CategorySection />

      {/* Main Product Feed */}
      <div className="container py-4">
        <ProductGrid />
      </div>
    </div>
  );
};

export default HomePage;