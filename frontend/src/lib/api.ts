/**
 * API Client for Learning Platform
 * Handles all HTTP requests to backend with authentication
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const UPLOAD_BASE = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:8000';

/**
 * Get auth token from localStorage
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Set auth token in localStorage
 */
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

/**
 * Remove auth token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
};

/**
 * Get full upload URL
 */
export const getUploadUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${UPLOAD_BASE}${path}`;
};

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Make API request
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for JSON if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 - Unauthorized
      if (response.status === 401) {
        removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw new ApiError(
        response.status,
        data.message || 'Something went wrong',
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error. Please check your connection.');
  }
}

/**
 * API Methods
 */
export const api = {
  // GET request
  get: <T = unknown>(endpoint: string) => {
    return apiRequest<T>(endpoint, { method: 'GET' });
  },

  // POST request with JSON body
  post: <T = unknown>(endpoint: string, data?: unknown) => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // POST request with FormData (for file uploads)
  postForm: <T = unknown>(endpoint: string, formData: FormData) => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  },

  // PATCH request
  patch: <T = unknown>(endpoint: string, data?: unknown) => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PATCH request with FormData
  patchForm: <T = unknown>(endpoint: string, formData: FormData) => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: formData,
    });
  },

  // DELETE request
  delete: <T = unknown>(endpoint: string) => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },
};

export default api;
