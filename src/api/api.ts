import axios from 'axios';
import { API_BASE_URL, getImageUrl as getImageUrlFromConfig } from '../utils/apiConfig';
import { storage } from '../utils/storage';
import { navigate } from '../navigation/navigationService';

// Auth types
interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: 'customer' | 'business_owner' | 'employee' | 'platform_admin';
  is_active: boolean;
  is_owner: boolean;
  is_admin: boolean;
  gdpr_data_processing_consent: boolean;
  gdpr_marketing_consent: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  user_type: 'customer' | 'business_owner' | 'employee' | 'platform_admin';
  gdpr_data_processing_consent: boolean;
  gdpr_marketing_consent: boolean;
  selected_plan_code?: string;
  place_id?: number;
}

interface AuthResponse {
  user: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    user_type: 'customer' | 'business_owner' | 'employee' | 'platform_admin';
    is_active: boolean;
    is_owner: boolean;
    is_admin: boolean;
    gdpr_data_processing_consent: boolean;
    gdpr_marketing_consent: boolean;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
}

// Temporary inline types to avoid import issues
export interface PlaceImage {
  id: number;
  place_id: number;
  image_url: string;
  image_alt?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface Place {
  id: number;
  slug?: string; // Optional until migration is run
  codigo?: string; // Made optional
  nome: string;
  tipo: string; // salon, clinic, office, etc.
  cidade: string;
  regiao: string;
  pais?: string;
  nif?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  rua?: string;
  porta?: string;
  cod_postal?: string;
  latitude?: number;
  longitude?: number;
  location_type?: 'fixed' | 'mobile';
  coverage_radius?: number;
  created_at?: string;
  owner_id?: number;
  is_bio_diamond?: boolean;
  booking_enabled?: boolean;
  is_active?: boolean;
  about?: string;
  updated_at?: string;
  services?: PlaceService[];
  employees?: PlaceEmployee[];
  images?: PlaceImage[];
  reviews?: {
    average_rating: number;
    total_reviews: number;
  };
  working_hours?: { [key: string]: any };
}

export interface PlaceService {
  id: number;
  place_id: number;
  service_id: number;
  name: string;
  category: string;
  description: string;
  is_bio_diamond: boolean;
  price: number;
  duration: number;
  is_available: boolean;
  created_at: string;
}

export interface PlaceEmployee {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  specialty?: string;
  color_code?: string;
  photo_url?: string;
  is_active: boolean;
  working_hours?: { [key: string]: any };
}

export interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  is_bio_diamond: boolean;
  usage_count?: number; // For admin views
}

interface SearchFilters {
  search?: string;
  tipo?: string;
  cidade?: string;
  regiao?: string;
  is_bio_diamond?: boolean;
  booking_enabled?: boolean;
}

interface SearchResults {
  places: Place[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// Campaign types
export interface CampaignInfo {
  campaign_id: number;
  name: string;
  banner_message: string;
  campaign_type: string;
  discount_type?: string;
  discount_value?: number;
  rewards_multiplier?: number;
  rewards_bonus_points?: number;
}

interface BookingRequest {
  salon_id: number;
  service_id: number;
  employee_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  any_employee_selected?: boolean;
  
  // Campaign fields - optional, included if booking is made during an active campaign
  campaign_id?: number;
  campaign_name?: string;
  campaign_type?: string;
  campaign_discount_type?: string;
  campaign_discount_value?: number;
  campaign_banner_message?: string;
}

interface Booking extends BookingRequest {
  id: number;
  duration: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilityResponse {
  available_slots: string[];
  time_slots: TimeSlot[];
  slots_with_campaigns?: Record<string, CampaignInfo[]>;
}

// API base URL is imported from apiConfig
// Re-export getImageUrl for convenience
export { getImageUrlFromConfig as getImageUrl };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.url);
    console.log('Base URL:', config.baseURL);
    console.log('Full URL:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add auth token to requests (async for React Native)
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If data is FormData, remove Content-Type header to let axios set it with boundary
  // This must be done before axios tries to serialize the data
  if (config.data instanceof FormData) {
    // Remove any existing Content-Type header
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
    // Ensure axios knows this is FormData
    config.headers['Accept'] = 'application/json';
  }
  return config;
});

// Add response interceptor for debugging, error handling, and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    // Check if it's a network error (no response object)
    const isNetworkError = !error.response && (error.message === 'Network Error' || error.code === 'NETWORK_ERROR' || error.message?.includes('Network'));
    
    if (isNetworkError) {
      console.warn('⚠️ Network error:', error.config?.url || 'unknown endpoint');
      console.warn('Network error details:', error.message);
      // Don't log as error - network issues are temporary
    } else {
      console.error('API error:', error.response?.status, error.response?.statusText, error.config?.url);
      console.error('Error details:', error.message);
    }
    
    // Redirect to Billing on payment required (React Native navigation)
    if (error.response?.status === 402) {
      navigate('Billing', { reason: 'payment_required' });
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    // Handle token refresh for 401 errors (only if we have a response)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = await storage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
          const { access_token, refresh_token } = response.data;
          
          await storage.setItem('auth_token', access_token);
          await storage.setItem('refresh_token', refresh_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          await storage.removeItem('auth_token');
          await storage.removeItem('refresh_token');
          navigate('Login');
        }
      }
    }
    
    // Handle FastAPI error format
    if (error.response?.data?.detail) {
      error.message = error.response.data.detail;
    }
    
    return Promise.reject(error);
  }
);

// Export all API modules - keeping the file structure but exporting the essential APIs
// Full implementation continues in the original file but for brevity, exporting key APIs
export const salonAPI = {
  getSalons: async (filters: SearchFilters = {}, page = 1, perPage = 20): Promise<SearchResults> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.cidade) params.append('cidade', filters.cidade);
    if (filters.regiao) params.append('regiao', filters.regiao);
    if (filters.is_bio_diamond) params.append('bio_diamond', 'true');
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    const response = await api.get(`/salons?${params.toString()}`);
    return response.data;
  },
  getSalon: async (id: number): Promise<Place> => {
    const response = await api.get(`/salons/${id}`);
    return response.data;
  },
  getAvailability: async (salonId: number, date: string, serviceId?: number): Promise<AvailabilityResponse> => {
    let url = `/salons/${salonId}/availability?date=${date}`;
    if (serviceId) url += `&service_id=${serviceId}`;
    const response = await api.get(url);
    return response.data;
  },
};

export const placeAPI = {
  getPlaces: async (filters: SearchFilters = {}, page = 1, perPage = 20): Promise<SearchResults> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.cidade) params.append('cidade', filters.cidade);
    if (filters.regiao) params.append('regiao', filters.regiao);
    if (filters.is_bio_diamond) params.append('is_bio_diamond', 'true');
    if (filters.booking_enabled) params.append('booking_enabled', 'true');
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    const response = await api.get(`/places?${params.toString()}`);
    return response.data;
  },
  getPlace: async (slug: string): Promise<Place> => {
    const response = await api.get(`/places/${slug}`);
    return response.data;
  },
  searchPlaces: async (query: string, page = 1, perPage = 20): Promise<SearchResults> => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    const response = await api.get(`/places/search?${params.toString()}`);
    return response.data;
  },
  getAvailability: async (placeId: number, date: string, serviceId?: number, employeeId?: number): Promise<AvailabilityResponse> => {
    let url = `/places/${placeId}/availability?date=${date}`;
    if (serviceId) url += `&service_id=${serviceId}`;
    if (employeeId) url += `&employee_id=${employeeId}`;
    const response = await api.get(url);
    return response.data;
  },
  getEmployeesByService: async (placeId: number, serviceId: number): Promise<PlaceEmployee[]> => {
    const response = await api.get(`/places/${placeId}/employees/by-service/${serviceId}`);
    return response.data;
  },
  getServicesByEmployee: async (placeId: number, employeeId: number): Promise<PlaceService[]> => {
    const response = await api.get(`/places/${placeId}/services/by-employee/${employeeId}`);
    return response.data;
  },
};

export const serviceAPI = {
  getServices: async (bioDiamondOnly = false): Promise<Service[]> => {
    const params = bioDiamondOnly ? '?bio_diamond=true' : '';
    const response = await api.get(`/services${params}`);
    return response.data;
  },
};

export const bookingAPI = {
  createBooking: async (booking: BookingRequest): Promise<{ id: number; message: string }> => {
    const response = await api.post(`/places/${booking.salon_id}/bookings`, booking);
    return response.data;
  },
  getBooking: async (id: number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
};

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  refreshToken: async (refreshToken: string): Promise<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  validateToken: async (): Promise<{ message: string; is_valid: boolean; user_id?: number }> => {
    const response = await api.get('/auth/validate');
    return response.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateLanguagePreference: async (language: string): Promise<{ message: string; language: string }> => {
    const response = await api.patch('/auth/me/language', { language });
    return response.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },
};

// Export ownerAPI, customerAPI, adminAPI, etc. - simplified for now, full implementation can be added
export const ownerAPI = {
  getOwnerPlaces: async (): Promise<Place[]> => {
    const response = await api.get('/owner/places/');
    return response.data;
  },
  createPlace: async (placeData: any): Promise<Place> => {
    const response = await api.post('/owner/places/', placeData);
    return response.data;
  },
  updatePlace: async (placeId: number, placeData: any): Promise<Place> => {
    const response = await api.put(`/owner/places/${placeId}`, placeData);
    return response.data;
  },
  getPlace: async (placeId: number): Promise<Place> => {
    const response = await api.get(`/owner/places/${placeId}`);
    return response.data;
  },
  uploadPlaceImages: async (placeId: number, images: any[]): Promise<PlaceImage[]> => {
    const formData = new FormData();
    
    // Prepare all images for upload
    images.forEach((image, index) => {
      // React Native FormData format - ensure proper URI formatting
      let imageUri = image.uri;
      
      // Ensure URI is properly formatted (should already have file:// from expo-image-picker)
      if (imageUri && !imageUri.startsWith('http') && !imageUri.startsWith('file://')) {
        if (imageUri.startsWith('/')) {
          imageUri = `file://${imageUri}`;
        } else {
          imageUri = `file:///${imageUri}`;
        }
      }
      
      const fileExtension = image.name?.split('.').pop() || imageUri?.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = image.name || `image_${Date.now()}_${index}.${fileExtension}`;
      
      // Determine MIME type
      let mimeType = image.type;
      if (!mimeType) {
        if (fileExtension.toLowerCase() === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension.toLowerCase() === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension.toLowerCase() === 'webp') {
          mimeType = 'image/webp';
        } else {
          mimeType = 'image/jpeg';
        }
      }
      
      console.log(`📤 Preparing image ${index + 1}/${images.length}:`, {
        uri: imageUri.substring(0, 60) + (imageUri.length > 60 ? '...' : ''),
        type: mimeType,
        name: fileName,
      });
      
      // React Native FormData format - append file object
      // Backend accepts: images, image, file, or any field name
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);
    });
    
    try {
      console.log(`🚀 Uploading ${images.length} image(s) to /owner/places/${placeId}/multipart`);
      
      // Get auth token
      const token = await storage.getItem('auth_token');
      
      // Use the new multipart endpoint designed for React Native
      const url = `${API_BASE_URL}/owner/places/${placeId}/multipart`;
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Do NOT set Content-Type - fetch will set it automatically with boundary for FormData
      
      const response = await fetch(url, {
        method: 'PUT', // Backend uses PUT for this endpoint
        headers,
        body: formData,
      });
      
      console.log('📡 Upload response status:', response.status);
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      
      // Get response text first to handle both JSON and text errors
      const responseText = await response.text();
      
      if (!response.ok) {
        // Try to parse error response as JSON, but handle non-JSON errors
        let errorMessage = `Server error: ${response.status}`;
        try {
          if (isJson || responseText.startsWith('{') || responseText.startsWith('[')) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
          } else {
            errorMessage = responseText.substring(0, 500) || errorMessage;
          }
        } catch (parseError) {
          errorMessage = responseText.substring(0, 500) || `Server error: ${response.status}`;
        }
        
        console.error('❌ Server error response:', {
          status: response.status,
          contentType,
          errorMessage,
          responsePreview: responseText.substring(0, 200),
        });
        
        // Provide user-friendly error messages
        let userFriendlyError = errorMessage;
        if (response.status === 500) {
          userFriendlyError = 'Server error: The server encountered an issue processing your image. Please try again later.';
        } else if (response.status === 413) {
          userFriendlyError = 'File too large: Please select a smaller image.';
        } else if (response.status === 415) {
          userFriendlyError = 'Unsupported file type: Please select a JPEG or PNG image.';
        }
        
        throw new Error(userFriendlyError);
      }
      
      // Parse successful response
      let data;
      try {
        if (isJson || responseText.startsWith('{') || responseText.startsWith('[')) {
          data = JSON.parse(responseText);
        } else {
          console.warn('Response is not JSON, returning empty array');
          data = [];
        }
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Failed to parse server response');
      }
      
      // Backend should return PlaceImage[] or place object with images
      let uploadedImages: PlaceImage[] = [];
      if (Array.isArray(data)) {
        uploadedImages = data;
      } else if (data.images && Array.isArray(data.images)) {
        uploadedImages = data.images;
      } else if (data) {
        // If it's a single image object
        uploadedImages = [data];
      }
      
      console.log(`✅ Successfully uploaded ${uploadedImages.length} image(s)`);
      return uploadedImages;
    } catch (error: any) {
      console.error('❌ Image upload error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      
      // Provide more detailed error information
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        throw new Error('Upload timeout. Please check your connection and try again.');
      } else if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and ensure the server is accessible.');
      }
      throw error;
    }
  },
  getPlaceImages: async (placeId: number): Promise<PlaceImage[]> => {
    const response = await api.get(`/owner/places/${placeId}/images`);
    return response.data;
  },
  deletePlaceImage: async (imageId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/owner/places/images/${imageId}`);
    return response.data;
  },
  getDashboardStats: async (): Promise<any> => {
    const response = await api.get('/owner/dashboard/stats');
    return response.data;
  },
  getRecentBookings: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get(`/owner/dashboard/recent-bookings?limit=${limit}`);
    return response.data;
  },
  getUnreadNotificationCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/owner/notifications/unread-count');
    return response.data;
  },
  // Services Management
  getPlaceServices: async (placeId: number): Promise<PlaceService[]> => {
    const response = await api.get(`/owner/services/places/${placeId}/services`);
    return response.data;
  },
  addPlaceService: async (placeId: number, serviceData: any): Promise<{ id: number; message: string }> => {
    const response = await api.post(`/owner/services/places/${placeId}/services`, serviceData);
    return response.data;
  },
  updatePlaceService: async (placeId: number, serviceId: number, serviceData: any): Promise<{ message: string }> => {
    const response = await api.put(`/owner/services/${serviceId}`, serviceData);
    return response.data;
  },
  deletePlaceService: async (placeId: number, serviceId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/owner/services/${serviceId}`);
    return response.data;
  },
  // Employees Management
  getPlaceEmployees: async (placeId: number): Promise<PlaceEmployee[]> => {
    const response = await api.get(`/owner/employees/places/${placeId}/employees`);
    return response.data;
  },
  createEmployee: async (placeId: number, employeeData: any): Promise<PlaceEmployee> => {
    const response = await api.post(`/owner/employees/places/${placeId}/employees`, employeeData);
    return response.data;
  },
  getEmployee: async (employeeId: number): Promise<PlaceEmployee> => {
    const response = await api.get(`/owner/employees/${employeeId}`);
    return response.data;
  },
  updateEmployee: async (employeeId: number, employeeData: any): Promise<PlaceEmployee> => {
    const response = await api.put(`/owner/employees/${employeeId}`, employeeData);
    return response.data;
  },
  deleteEmployee: async (employeeId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/owner/employees/${employeeId}`);
    return response.data;
  },
  updateEmployeeHours: async (employeeId: number, hoursData: any): Promise<{ message: string }> => {
    const response = await api.put(`/owner/employees/${employeeId}/hours`, hoursData);
    return response.data;
  },
  getPlaceEmployeeSchedule: async (placeId: number): Promise<any> => {
    const response = await api.get(`/owner/employees/places/${placeId}/employees/schedule`);
    return response.data;
  },
  assignServicesToEmployee: async (employeeId: number, serviceIds: number[]): Promise<{ message: string }> => {
    const response = await api.post(`/owner/employees/${employeeId}/services`, { service_ids: serviceIds });
    return response.data;
  },
  getEmployeeServices: async (employeeId: number): Promise<PlaceService[]> => {
    const response = await api.get(`/owner/employees/${employeeId}/services`);
    const data = response.data;
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.services)) {
      return data.services;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  },
  uploadEmployeePhoto: async (employeeId: number, photo: FormData): Promise<{ message: string; photo_url: string }> => {
    // Use fetch API for FormData uploads (more reliable in React Native than axios)
    const token = await storage.getItem('auth_token');
    const url = `${API_BASE_URL}/owner/employees/${employeeId}/photo`;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Do NOT set Content-Type - fetch will set it automatically with boundary for FormData
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: photo,
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      let responseText = '';
      
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      let errorMessage = 'Failed to upload photo';
      if (isJson && responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the text as is
          errorMessage = responseText || errorMessage;
        }
      } else if (responseText) {
        errorMessage = responseText;
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).response = { status: response.status, statusText: response.statusText };
      throw error;
    }
    
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const responseText = await response.text();
    
    if (isJson) {
      return JSON.parse(responseText);
    } else {
      return { message: responseText, photo_url: '' };
    }
  },
  deleteEmployeePhoto: async (employeeId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/owner/employees/${employeeId}/photo`);
    return response.data;
  },
  // Bookings Management
  getPlaceBookings: async (placeId: number, params?: { start_date?: string; end_date?: string; status?: string; employee_id?: number }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('date_from', params.start_date);
    if (params?.end_date) searchParams.append('date_to', params.end_date);
    if (params?.status) searchParams.append('status_filter', params.status);
    if (params?.employee_id) searchParams.append('employee_id', params.employee_id.toString());
    const url = `/owner/bookings/places/${placeId}/bookings${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  updateBooking: async (bookingId: number, bookingData: any): Promise<any> => {
    const response = await api.put(`/owner/bookings/${bookingId}`, bookingData);
    return response.data;
  },
  cancelBooking: async (bookingId: number): Promise<{ message: string }> => {
    const response = await api.put(`/owner/bookings/${bookingId}/cancel`);
    return response.data;
  },
  // Customers Management
  getPlaceCustomers: async (placeId: number): Promise<any[]> => {
    const response = await api.get(`/owner/customers/places/${placeId}/customers`);
    return response.data;
  },
  // Notifications
  getNotifications: async (limit: number = 20, offset: number = 0, unreadOnly: boolean = false): Promise<any[]> => {
    const response = await api.get(`/owner/notifications?limit=${limit}&offset=${offset}&unread_only=${unreadOnly}`);
    return response.data;
  },
  markNotificationAsRead: async (notificationId: number): Promise<{ message: string; id: number }> => {
    const response = await api.put(`/owner/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllNotificationsAsRead: async (): Promise<{ message: string }> => {
    const response = await api.put('/owner/notifications/read-all');
    return response.data;
  },
  deleteNotification: async (notificationId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/owner/notifications/${notificationId}`);
    return response.data;
  },
  // Campaigns
  getAllCampaigns: async (params?: { page?: number; size?: number; status_filter?: string }): Promise<{ campaigns: any[]; total: number; page: number; size: number; pages: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());
    if (params?.status_filter) searchParams.append('status_filter', params.status_filter);
    const response = await api.get(`/campaigns?${searchParams.toString()}`);
    return response.data;
  },
  getPlaceCampaigns: async (placeId: number): Promise<any[]> => {
    const response = await api.get(`/campaigns/places/${placeId}/campaigns`);
    return response.data;
  },
  createCampaign: async (data: any): Promise<any> => {
    const response = await api.post('/campaigns', data);
    return response.data;
  },
  updateCampaign: async (campaignId: number, data: any): Promise<any> => {
    const response = await api.put(`/campaigns/${campaignId}`, data);
    return response.data;
  },
  deleteCampaign: async (campaignId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/campaigns/${campaignId}`);
    return response.data;
  },
  getCampaignStats: async (): Promise<any> => {
    const response = await api.get('/campaigns/stats');
    return response.data;
  },
  // Rewards
  getRewardSettings: async (placeId: number): Promise<any> => {
    const response = await api.get(`/owner/rewards/places/${placeId}/settings`);
    return response.data;
  },
  updateRewardSettings: async (placeId: number, data: any): Promise<any> => {
    const response = await api.put(`/owner/rewards/places/${placeId}/settings`, data);
    return response.data;
  },
  // Time Off
  getPlaceTimeOff: async (placeId: number): Promise<any[]> => {
    const response = await api.get(`/owner/time-off/places/${placeId}/time-off`);
    return response.data;
  },
  getPlaceTimeOffCalendar: async (placeId: number, startDate: string, endDate: string): Promise<any[]> => {
    const response = await api.get(`/owner/time-off/places/${placeId}/calendar?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  },
  createTimeOff: async (placeId: number, employeeId: number, data: any): Promise<any> => {
    const response = await api.post(`/owner/time-off/places/${placeId}/employees/${employeeId}/time-off`, data);
    return response.data;
  },
  updateTimeOff: async (timeOffId: number, data: any): Promise<any> => {
    const response = await api.put(`/owner/time-off/${timeOffId}`, data);
    return response.data;
  },
  deleteTimeOff: async (timeOffId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/owner/time-off/${timeOffId}`);
    return response.data;
  },
  approveTimeOff: async (timeOffId: number): Promise<any> => {
    const response = await api.put(`/owner/time-off/${timeOffId}/approve`);
    return response.data;
  },
  // Messaging
  getPlaceMessages: async (placeId: number): Promise<any[]> => {
    const response = await api.get(`/owner/messages/places/${placeId}/messages`);
    return response.data;
  },
  createMessage: async (placeId: number, data: any): Promise<any> => {
    const response = await api.post(`/owner/messages/places/${placeId}/messages`, data);
    return response.data;
  },
  updateMessage: async (messageId: number, data: any): Promise<any> => {
    const response = await api.put(`/owner/messages/${messageId}`, data);
    return response.data;
  },
  markMessageRead: async (messageId: number): Promise<any> => {
    const response = await api.put(`/owner/messages/${messageId}/read`);
    return response.data;
  },
  replyToMessage: async (messageId: number, content: string): Promise<any> => {
    const response = await api.post(`/owner/messages/${messageId}/reply`, { content });
    return response.data;
  },
};

export const customerAPI = {
  getBookings: async (): Promise<any[]> => {
    const response = await api.get('/customer/bookings');
    return response.data;
  },
  getUpcomingBookings: async (): Promise<any[]> => {
    const response = await api.get('/customer/bookings/upcoming');
    return response.data;
  },
  getPastBookings: async (): Promise<any[]> => {
    const response = await api.get('/customer/bookings/past');
    return response.data;
  },
  cancelBooking: async (bookingId: number): Promise<{ message: string; booking_id: number }> => {
    const response = await api.put(`/customer/bookings/${bookingId}/cancel`);
    return response.data;
  },
  getRewards: async (): Promise<any> => {
    const response = await api.get('/customer/rewards');
    return response.data;
  },
};

export const billingAPI = {
  createSubscription: async (planCode: 'basic' | 'pro'): Promise<{ clientSecret?: string; subscriptionId: string; trialStarted?: boolean }> => {
    const response = await api.post('/billing/create-subscription', { planCode });
    return response.data;
  },
  getSubscription: async (): Promise<{ subscriptionId?: string; status?: string; planCode?: 'basic' | 'pro' | string }> => {
    const response = await api.get('/billing/subscription');
    return response.data;
  },
  getPlans: async (): Promise<{ plans: Array<{ id: number; code: string; name: string; price_cents: number; currency: string; trial_days: number; features: any[] }> }> => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },
};

export default api;

