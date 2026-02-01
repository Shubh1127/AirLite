import { api } from './api';

export const listingsAPI = {
  // Get all listings
  getAll: () => api.get('/api/listings'),

  // Get listing by ID
  getById: (id: string) => api.get(`/api/listings/${id}`),

  // Get listings by location (coordinates)
  getByLocation: (latitude: number, longitude: number, radius: number = 20) =>
    api.get(`/api/listings?latitude=${latitude}&longitude=${longitude}&radius=${radius}`),

  // Create new listing
  create: (data: any) => api.post('/api/listings', data),

  // Update listing
  update: (id: string, data: any) => api.put(`/api/listings/${id}`, data),

  // Delete listing
  delete: (id: string) => api.delete(`/api/listings/${id}`),

  // Search listings
  search: (query: string) => api.get(`/api/search?query=${query}`),
};
