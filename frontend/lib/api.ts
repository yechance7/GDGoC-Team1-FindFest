// Frontend API service for connecting to the backend
// This file contains all the API calls to the backend server

// Use relative URL to leverage Next.js proxy (configured in next.config.ts)
// This avoids CORS issues by making requests appear to come from the same origin
// The Next.js proxy will forward requests to http://localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Common fetch options for all API calls
// This helps ensure consistent behavior across all requests
const getDefaultFetchOptions = (): RequestInit => ({
  credentials: 'omit', // Don't send credentials unless needed
  cache: 'no-cache', // Don't cache requests
});

// Type definitions for API requests and responses
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const error: ApiError = await response.json();
      console.error('API error response:', error);
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    } catch (jsonError) {
      console.error('Failed to parse error response:', jsonError);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  return response.json();
}

// Helper function to make API requests with better error handling
async function apiRequest<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    // Merge default options with provided options
    const fetchOptions: RequestInit = {
      ...getDefaultFetchOptions(),
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    console.log(`Making ${options.method || 'GET'} request to:`, url);
    
    const response = await fetch(url, fetchOptions);
    
    console.log(`Response status: ${response.status}`);
    
    return handleResponse<T>(response);
  } catch (error) {
    console.error('API request failed:', error);
    
    // Check if it's a network error (no response from server)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to the server. Please make sure:\n' +
        '1. The backend is running (docker-compose up)\n' +
        '2. The backend is accessible at ' + API_BASE_URL + '\n' +
        '3. CORS is properly configured on the backend'
      );
    }
    
    // Re-throw other errors as-is
    throw error;
  }
}

// Authentication API calls

/**
 * Sign up a new user
 * @param data - User registration data (username, email, password)
 * @returns User information
 */
export async function signup(data: SignupRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log in a user
 * @param data - Login credentials (username, password)
 * @returns Access token and token type
 */
export async function login(data: LoginRequest): Promise<TokenResponse> {
  return apiRequest<TokenResponse>(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get current user information
 * @param token - Access token
 * @returns User information
 */
export async function getCurrentUser(token: string): Promise<UserResponse> {
  return apiRequest<UserResponse>(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Check if a username is available
 * @param username - Username to check
 * @returns Whether the username is available
 */
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string }> {
  return apiRequest<{ available: boolean; message: string }>(
    `${API_BASE_URL}/api/v1/auth/check-username/${username}`
  );
}

