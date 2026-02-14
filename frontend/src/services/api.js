import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

export const registerUser = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await api.post('/auth/login', payload);
  return response.data;
};

export const getCurrentUserProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getMyLinks = async () => {
  const response = await api.get('/dashboard/links');
  return response.data;
};

export const deactivateMyLink = async (id) => {
  const response = await api.patch(`/dashboard/links/${id}/deactivate`);
  return response.data;
};

export default api;
