// CartContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../utils/axiosUser';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  /** Normalize product/variant object for frontend use */
  const normalizeItem = (item) => {
    const parsedPrice = parseFloat(item.price ?? 0);
    const discount = parseFloat(item.discount_percent ?? 0);
    const finalPrice = parsedPrice * (1 - discount / 100);

    let stock = parseInt(item.stock ?? 999, 10);
    if (item.size && item.size_stock) {
      try {
        const sizeStock = JSON.parse(item.size_stock);
        stock = parseInt(sizeStock[item.size], 10) || stock;
      } catch {
        console.warn("⚠️ Failed to parse size_stock, fallback stock used.");
      }
    }

    return {
      ...item,
      price: parsedPrice,
      discount_percent: discount,
      final_price: parseFloat(finalPrice.toFixed(2)),
      quantity: parseInt(item.quantity ?? 1, 10),
      stock,
      size: item.size || null,
    };
  };

  /** Fetch cart from API */
  const loadCart = async () => {
    try {
      const { data } = await axios.get('/api/get-cart');
      if (Array.isArray(data.cart)) {
        const sorted = [...data.cart].sort(
          (a, b) =>
            new Date(b.added_at || b.created_at || 0) -
            new Date(a.added_at || a.created_at || 0)
        );
        setCartItems(sorted.map(normalizeItem));
      } else {
        console.error('❌ Unexpected cart response:', data);
        setCartItems([]);
      }
    } catch (err) {
      console.error('❌ Failed to load cart:', err.response?.data || err.message);
      toast.error("❌ Couldn't load cart. Please try again.");
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  /** Add item to cart */
  const addToCart = async (product, variant = null, size = null, quantity = 1) => {
    try {
      const res = await axios.post('/api/add-to-cart', {
        product_id: product.id,
        variant_id: variant?.id || null,
        quantity,
        size,
      });

      if (res.data?.message === 'Item added to cart') {
        toast.success('🛒 Added to cart!');
        await loadCart();
      } else if (res.data?.warning === 'Item already in cart') {
        toast.warning('⚠️ Product already in cart.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || '❌ Failed to add to cart.');
      console.error('❌ Add to cart failed:', err.response?.data || err.message);
    }
  };

  /** Remove item from cart */
  const removeFromCart = async (product_id, variant_id = null, size = null) => {
    try {
      await axios.post('/api/remove-from-cart', {
        product_id,
        variant_id,
        size,
      });
      toast.success('🗑️ Removed from cart');
      await loadCart();
    } catch (err) {
      toast.error('❌ Failed to remove item');
      console.error('❌ Remove from cart failed:', err.response?.data || err.message);
    }
  };

  /** Update item quantity */
  const updateQuantity = async (product_id, quantity, variant_id = null, size = null) => {
    try {
      await axios.post('/api/update-cart', {
        product_id,
        variant_id,
        quantity,
        size,
      });

      setCartItems((prev) =>
        prev.map((item) =>
          item.product_id === product_id &&
          item.variant_id === variant_id &&
          item.size === size
            ? { ...item, quantity }
            : item
        )
      );
    } catch (err) {
      toast.error('❌ Failed to update quantity');
      console.error('❌ Update quantity failed:', err.response?.data || err.message);
    }
  };

  /** Clear cart locally */
  const clearCart = () => {
    setCartItems([]);
    toast.info("🧹 Cart cleared");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);