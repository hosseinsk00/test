import api from '../config/api';
import { ApiResponse, DashboardStats } from '../types';

export const dashboardService = {
  // Get overview statistics
  getOverview: async (params?: { fromDate?: string; toDate?: string }) => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/overview', {
      params,
    });
    return response.data.data;
  },

  // Get daily stats for charts
  getDailyStats: async (days: number = 30) => {
    const response = await api.get('/dashboard/daily-stats', {
      params: { days },
    });
    return response.data.data;
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 20) => {
    const response = await api.get('/dashboard/recent-activities', {
      params: { limit },
    });
    return response.data.data;
  },

  // Get upcoming tasks
  getUpcomingTasks: async () => {
    const response = await api.get('/dashboard/upcoming-tasks');
    return response.data.data;
  },

  // Get truck performance
  getTruckPerformance: async (days: number = 90) => {
    const response = await api.get('/dashboard/truck-performance', {
      params: { days },
    });
    return response.data.data;
  },

  // Get alerts
  getAlerts: async () => {
    const response = await api.get('/dashboard/alerts');
    return response.data.data;
  },
};
