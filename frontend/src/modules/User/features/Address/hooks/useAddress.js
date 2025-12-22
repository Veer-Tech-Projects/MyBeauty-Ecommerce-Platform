import { useState, useEffect, useCallback } from "react";
import { addressService } from "../services/addressService";
import { toast } from "react-toastify";

export const useAddress = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const list = await addressService.getAll();
      setAddresses(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load addresses");
      // toast.error("Could not load addresses"); // Optional: Don't spam toasts on load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = async (formData) => {
    try {
      await addressService.add(formData);
      toast.success("Address added successfully");
      await fetchAddresses(); // Refresh list to get new ID/Default status
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add address";
      toast.error(msg);
      return false;
    }
  };

  const updateAddress = async (id, formData) => {
    try {
      await addressService.update(id, formData);
      toast.success("Address updated");
      await fetchAddresses();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
      return false;
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await addressService.delete(id);
      toast.success("Address deleted");
      // Optimistic update
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      // Re-fetch in background to sync default fallback logic
      fetchAddresses();
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  return {
    addresses,
    loading,
    error,
    addAddress,
    updateAddress,
    deleteAddress,
    refresh: fetchAddresses
  };
};