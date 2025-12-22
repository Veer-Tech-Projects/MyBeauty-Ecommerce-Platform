// src/pages/SummaryStep.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OrderSummary from '../components/OrderSummary';
import { useBuyNow } from "@/shared/context/BuyNowContext";

export default function SummaryStep() {
  const location = useLocation();
  const navigate = useNavigate();
  const { buyNowItem, setBuyNowItem } = useBuyNow(); // ✅ allow updating Buy Now product
  const [localBuyNowProduct, setLocalBuyNowProduct] = useState(buyNowItem);

  // Extract data from previous step
  const selectedAddress = location.state?.address || null;
  const buyMode = location.state?.buyMode === true;
  const newBuyNowProduct = location.state?.buyNowProduct || null;

  // ✅ Always sync latest Buy Now product when location changes
  useEffect(() => {
    if (buyMode && newBuyNowProduct) {
      setBuyNowItem(newBuyNowProduct);  // update context
      setLocalBuyNowProduct(newBuyNowProduct); // update local state
    }
  }, [buyMode, newBuyNowProduct, setBuyNowItem]);

  // Continue button → Payment step
  const handleContinue = () => {
    navigate('/checkout/payment', {
      state: {
        address: selectedAddress,
        buyMode: buyMode,
        buyNowProduct: localBuyNowProduct, // ✅ latest product passed
      },
    });
  };

  return (
    <div className="summary-step-container">
      <OrderSummary
        selectedAddress={selectedAddress}
        buyMode={buyMode}
        buyNowProduct={localBuyNowProduct} // ✅ ensures fresh item always used
        onContinue={handleContinue}
      />
    </div>
  );
}
