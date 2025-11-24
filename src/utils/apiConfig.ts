// Platform-agnostic API configuration

// Detect platform
const isWeb = typeof window !== 'undefined' && typeof window.location !== 'undefined';
const isReactNative = !isWeb;

// Get API base URL based on platform
const getApiBaseUrl = (): string => {
  if (isReactNative) {
    // React Native: Use environment variable or production URL
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 
           'https://linkuup.com/api/v1';
    
    // Ensure we're not using the /docs endpoint (common mistake)
    const cleanUrl = apiUrl.replace('/docs', '');
    
    console.log('🔧 API Base URL configured:', cleanUrl);
    return cleanUrl;
  } else {
    // Web: Use environment variable or relative URL
    // Note: For web builds, use process.env or Constants.expoConfig
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '/api/v1';
    const cleanUrl = apiUrl.replace('/docs', '');
    return cleanUrl;
  }
};

export const API_BASE_URL = getApiBaseUrl();
export const BACKEND_BASE_URL = API_BASE_URL.replace('/api/v1', '');

// Helper to get image URL (works for both platforms)
export const getImageUrl = (imageUrl: string | null | undefined): string => {
  // Handle null, undefined, or non-string values
  if (!imageUrl || typeof imageUrl !== 'string') return '';
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // For React Native, always use full URL
  if (isReactNative) {
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    return `${baseUrl}${imageUrl}`;
  }
  
  // For web, use relative or full URL
  return `${BACKEND_BASE_URL}${imageUrl}`;
};

