import axiosInstance from './axios';
import { authHeader } from '../utils/authHeader';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const getExpenses = (params) =>
  axiosInstance.get('/expenses', { params });

export const getExpenseById = (id) => axiosInstance.get(`/expenses/${id}`);

export const createExpense = (data) => axiosInstance.post('/expenses', data);

export const updateExpense = (id, data) =>
  axiosInstance.put(`/expenses/${id}`, data);

export const deleteExpense = (id) => axiosInstance.delete(`/expenses/${id}`);

export const getUsersForDropdown = () => axiosInstance.get('/expenses/agents');

export const getExpensesByDateRange = (startDate, endDate, userId) =>
  axiosInstance.get('/expenses/date-range', {
    params: { startDate, endDate, userId },
  });
