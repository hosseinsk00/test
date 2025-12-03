import api from '../config/api';
import { ApiResponse, PaginatedResponse, Truck } from '../types';

export const truckService = {
  // Get all trucks with pagination
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await api.get<PaginatedResponse<Truck>>('/trucks', { params });
    return response.data;
  },

  // Get truck by ID
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Truck>>(`/trucks/${id}`);
    return response.data.data;
  },

  // Create new truck
  create: async (data: Partial<Truck>) => {
    const response = await api.post<ApiResponse<Truck>>('/trucks', data);
    return response.data.data;
  },

  // Update truck
  update: async (id: number, data: Partial<Truck>) => {
    const response = await api.put<ApiResponse<Truck>>(`/trucks/${id}`, data);
    return response.data.data;
  },

  // Delete truck
  delete: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/trucks/${id}`);
    return response.data;
  },

  // Get summary
  getSummary: async () => {
    const response = await api.get('/trucks/summary');
    return response.data.data;
  },
};
