import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

export const uploadContent = async (formData) => {
  const response = await api.post('/upload', formData);
  return response.data;
};

export const getContent = async (id, password = null) => {
  const response = await api.post(`/content/${id}`, { password });
  return response.data;
};

export const downloadFile = async (id, password = null) => {
  const params = password ? { password } : {};
  const response = await api.get(`/download/${id}`, {
    params,
    responseType: 'blob'
  });
  return response;
};

export const deleteContent = async (id) => {
  const response = await api.delete(`/content/${id}`);
  return response.data;
};

export default api;
