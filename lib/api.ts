import axios from 'axios';

// Raw base (tanpa paksa /api) untuk assets statis seperti /uploads
const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

// Base khusus endpoint API selalu berakhiran /api
const API_URL = RAW_BASE.endsWith('/api') ? RAW_BASE : RAW_BASE + '/api';

// Base khusus file statis (strip trailing /api jika ada)
export const ASSET_BASE_URL = API_URL.replace(/\/api$/,'');

// Debug sekali di client (akan muncul hanya di browser)
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[API] baseURL =', API_URL, 'assetsBase =', ASSET_BASE_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// Products
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getByUser: (userId: number) => api.get(`/products/user/${userId}`),
};

// Users
export const usersAPI = {
  getProfile: () => api.get('/users/profile/me'),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  becomeSeller: (id: number) => api.put(`/users/${id}/become-seller`),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: number) => api.get(`/categories/${id}`),
};

// Orders
export const ordersAPI = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
  addReview: (id: number, data: any) => api.post(`/orders/${id}/review`, data),
};

// Cart
export const cartAPI = {
  getAll: () => api.get('/cart'),
  add: (data: any) => api.post('/cart', data),
  update: (id: number, quantity: number) => api.put(`/cart/${id}`, { quantity }),
  remove: (id: number) => api.delete(`/cart/${id}`),
};

// Upload
export const uploadAPI = {
  uploadImages: async (files: File[]) => {
    // Convert first 5 files to base64 payload expected by backend
    const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // result is data:<mime>;base64,XXXX – strip prefix
        const base64 = result.split(',')[1] || ''
        resolve(base64)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    const payloadFiles = []
    for (const f of files.slice(0,5)) {
      try {
        const b64 = await toBase64(f)
        payloadFiles.push({ name: f.name, base64: b64 })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[uploadImages] Failed to encode', f.name, e)
      }
    }
    return api.post('/upload', { files: payloadFiles })
  }
}

export default api;
