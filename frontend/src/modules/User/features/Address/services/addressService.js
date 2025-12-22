import api from "@/shared/networking/api";

const BASE_URL = "/addresses"; // Matches your new Backend Blueprint prefix

export const addressService = {
  getAll: async () => {
    const { data } = await api.get(BASE_URL);
    return data.data.addresses;
  },

  add: async (addressData) => {
    const { data } = await api.post(BASE_URL, addressData);
    return data.data;
  },

  update: async (id, addressData) => {
    const { data } = await api.put(`${BASE_URL}/${id}`, addressData);
    return data.data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`${BASE_URL}/${id}`);
    return data;
  }
};