// src/utils/axiosSeller.js
import axios from "axios";

const sellerAxios = axios.create({
  baseURL: "http://localhost:5000/api/seller",
  withCredentials: true,
});

sellerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("seller_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default sellerAxios;
