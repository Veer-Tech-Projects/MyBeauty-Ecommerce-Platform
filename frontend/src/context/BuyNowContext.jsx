import React, { createContext, useContext, useState, useEffect } from "react";

const BuyNowContext = createContext();

export const BuyNowProvider = ({ children }) => {
  const [buyNowItem, setBuyNowItem] = useState(null);

  // Load from localStorage on mount only
  useEffect(() => {
    try {
      const stored = localStorage.getItem("buyNowItem");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.cod_available = Boolean(parsed.cod_available);
        setBuyNowItem(parsed);
        console.log("BuyNow loaded from storage:", parsed);
      }
    } catch (e) {
      console.error("❌ Failed to parse buyNowItem:", e);
      localStorage.removeItem("buyNowItem");
    }
  }, []);

  const normalizeImage = (img) => {
    if (!img) return "/fallback.png";
    if (img.startsWith("http")) return img;
    const clean = img.replace(/^\/+/, "");
    return `${import.meta.env.VITE_BASE_URL}/static/uploads/${clean}`;
  };

  const calculateFinalPrice = (price, discountPercent) => {
    if (!price) return 0;
    if (discountPercent && discountPercent > 0) {
      return (price - (price * discountPercent) / 100).toFixed(2);
    }
    return parseFloat(price).toFixed(2);
  };

  const triggerBuyNow = (item) => {
    if (!item) return;

    // Clear stale localStorage
    localStorage.removeItem("buyNowItem");

    const priceVal = parseFloat(item.price || item.mrp || 0);
    const disc = parseFloat(item.discount_percent || 0);
    const finalVal = calculateFinalPrice(priceVal, disc);

    let stock = parseInt(item.stock ?? 999);
    if (item.size && item.size_stock) {
      try {
        const sizeMap = JSON.parse(item.size_stock);
        stock = parseInt(sizeMap[item.size]) || stock;
      } catch {
        console.warn("⚠️ Invalid size_stock JSON");
      }
    }

    const cod_available = Boolean(item.cod_available);

    const normalized = {
      ...item,
      cod_available,
      image: normalizeImage(item.image),
      price: priceVal,
      discount_percent: disc,
      final_price: parseFloat(finalVal),
      quantity: parseInt(item.quantity || 1),
      effective_stock: stock,
      variant_images: (item.variant_images || []).map((img) => normalizeImage(img)),
    };

    setBuyNowItem({ ...normalized });
    localStorage.setItem("buyNowItem", JSON.stringify(normalized));
    console.log("✅ BuyNow triggered →", normalized);
  };

  const updateBuyNowQty = (productId, qty) => {
    setBuyNowItem((prev) => {
      if (!prev || prev.product_id !== productId) return prev;
      const updated = { ...prev, quantity: qty };
      localStorage.setItem("buyNowItem", JSON.stringify(updated));
      console.log("BuyNow quantity updated:", updated);
      return updated;
    });
  };

  const clearBuyNow = () => {
    localStorage.removeItem("buyNowItem");
    setBuyNowItem(null);
    console.log("BuyNow cleared");
  };

  return (
    <BuyNowContext.Provider
      value={{ buyNowItem, triggerBuyNow, updateBuyNowQty, clearBuyNow }}
    >
      {children}
    </BuyNowContext.Provider>
  );
};

export const useBuyNow = () => useContext(BuyNowContext);