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

  // Location suggestions
  suggestions: (query: string) =>
    api.get(`/api/listings/suggestions?query=${encodeURIComponent(query)}`),

  // Address lookup (city/state/zip)
  addressLookup: (params: {
    zipCode?: string;
    city?: string;
    state?: string;
    country?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.zipCode) searchParams.set("zipCode", params.zipCode);
    if (params.city) searchParams.set("city", params.city);
    if (params.state) searchParams.set("state", params.state);
    if (params.country) searchParams.set("country", params.country);
    const queryString = searchParams.toString();
    return api.get(`/api/listings/address-lookup${queryString ? `?${queryString}` : ""}`);
  },
};
