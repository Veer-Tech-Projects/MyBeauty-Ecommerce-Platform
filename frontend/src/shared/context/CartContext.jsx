import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/shared/networking/api'; // NEW: Use the Enterprise API
import { useAuth } from '@/modules/User/auth/context/AuthProvider'; // NEW: Use Enterprise Auth
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false); // Added loading state
  
  // NEW: Get user state from the new AuthProvider
  const { user, isInitialized } = useAuth();

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
        // silent fail on json parse
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
    // If auth is not ready or user is not logged in, clear cart and exit
    if (!isInitialized || !user) {
      setCartItems([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get('/get-cart');
      if (Array.isArray(data.cart)) {
        const sorted = [...data.cart].sort(
          (a, b) =>
            new Date(b.added_at || b.created_at || 0) -
            new Date(a.added_at || a.created_at || 0)
        );
        setCartItems(sorted.map(normalizeItem));
      } else {
        setCartItems([]);
      }
    } catch (err) {
      // 401s are handled globally by api.js, but we ensure state is clean
      console.error('Failed to load cart:', err);
      setCartItems([]); 
    } finally {
      setLoading(false);
    }
  };

  // Re-load cart whenever the User changes (Login/Logout)
  useEffect(() => {
    if (isInitialized) {
      loadCart();
    }
  }, [user, isInitialized]);

  /** Add item to cart */
  const addToCart = async (product, variant = null, size = null, quantity = 1) => {
    if (!user) {
        toast.info("Please login to add items to cart");
        return;
    }

    try {
      const res = await api.post('/add-to-cart', {
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
      toast.error(err.message || '❌ Failed to add to cart.');
    }
  };

  /** Remove item from cart */
  const removeFromCart = async (product_id, variant_id = null, size = null) => {
    try {
      await api.post('/remove-from-cart', {
        product_id,
        variant_id,
        size,
      });
      toast.success('🗑️ Removed from cart');
      await loadCart();
    } catch (err) {
      toast.error('❌ Failed to remove item');
    }
  };

  /** Update item quantity */
  const updateQuantity = async (product_id, quantity, variant_id = null, size = null) => {
    try {
      await api.post('/update-cart', {
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
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);