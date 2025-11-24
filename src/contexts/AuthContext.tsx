import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api/api';
import { storage } from '../utils/storage';
import { navigate } from '../navigation/navigationService';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../utils/apiConfig';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Auth types
interface User {
  id: number;
  email: string;
  name: string;
  customer_id?: string;
  user_type?: 'customer' | 'business_owner' | 'platform_admin' | 'employee';
  token?: string;
  is_admin?: boolean;
  profile_picture?: string;
  oauth_provider?: string;
  oauth_id?: string;
  phone?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: 'customer' | 'business_owner';
  gdpr_data_processing_consent: boolean;
  gdpr_marketing_consent: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<string>;
  register: (userData: RegisterRequest) => Promise<string>;
  logout: () => void;
  loginWithGoogle: (userType?: 'customer' | 'business_owner', planCode?: string, action?: 'login' | 'register') => Promise<void>;
  loginWithFacebook: (userType?: 'customer' | 'business_owner', planCode?: string, action?: 'login' | 'register') => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBusinessOwner: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check for stored tokens
      const token = await storage.getItem('auth_token');
      if (token) {
        try {
          console.log('🔑 Token found, fetching user data...');
          const userData = await authAPI.getCurrentUser();
          console.log('✅ User data fetched:', userData);
          const identifiedUser = {
            id: userData.id,
            email: userData.email,
            name: userData.first_name || userData.email,
            is_admin: userData.is_admin,
            user_type: userData.user_type,
            profile_picture: (userData as any).profile_picture,
            oauth_provider: (userData as any).oauth_provider,
            oauth_id: (userData as any).oauth_id,
            phone: (userData as any).phone,
          };
          setUser(identifiedUser);
          console.log('✅ User logged in successfully');
        } catch (error: any) {
          // Check if it's a network error (no response object)
          const isNetworkError = !error.response && (error.message === 'Network Error' || error.code === 'NETWORK_ERROR' || error.message?.includes('Network'));
          
          if (isNetworkError) {
            console.warn('⚠️ Network error while fetching user data. User may be offline or server unreachable.');
            // Keep the token - user might just be offline temporarily
            // The app can still function with cached data
          } else if (error.response?.status === 401 || error.response?.status === 403) {
            // Authentication error - token is invalid
            console.error('❌ Authentication failed, removing tokens');
            await storage.removeItem('auth_token');
            await storage.removeItem('refresh_token');
          } else {
            // Other errors (500, etc.) - log but keep token
            console.error('❌ Failed to fetch user data:', error.message || error);
          }
        }
      } else {
        console.log('ℹ️ No token found in storage');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);
      const accessToken = response.tokens?.access_token || (response as any).access_token;
      const refreshToken = response.tokens?.refresh_token || (response as any).refresh_token;
      await storage.setItem('auth_token', accessToken);
      await storage.setItem('refresh_token', refreshToken);
      
      // Get user info after successful login
      const userData = await authAPI.getCurrentUser();
      const newUser = {
        id: userData.id,
        email: userData.email,
        name: userData.first_name || userData.email,
        is_admin: userData.is_admin,
        user_type: userData.user_type,
        profile_picture: (userData as any).profile_picture,
        oauth_provider: (userData as any).oauth_provider,
        oauth_id: (userData as any).oauth_id,
        phone: (userData as any).phone,
      };
      setUser(newUser);
      
      // Redirect based on user type
      if (newUser.user_type === 'platform_admin' || newUser.is_admin) {
        return 'AdminDashboard';
      } else if (newUser.user_type === 'business_owner' || userData.is_owner) {
        return 'OwnerDashboard';
      } else {
        return 'Home';
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await authAPI.register(userData);
      await storage.setItem('auth_token', response.tokens.access_token);
      await storage.setItem('refresh_token', response.tokens.refresh_token);
      const newUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.first_name || response.user.email,
        is_admin: response.user.is_admin,
        user_type: response.user.user_type,
        profile_picture: (response.user as any).profile_picture,
        oauth_provider: (response.user as any).oauth_provider,
        oauth_id: (response.user as any).oauth_id,
        phone: (response.user as any).phone,
      };
      setUser(newUser);
      
      // Redirect based on user type
      if (newUser.user_type === 'platform_admin' || newUser.is_admin) {
        return 'AdminDashboard';
      } else if (newUser.user_type === 'business_owner' || response.user.is_owner) {
        return 'OwnerDashboard';
      } else {
        return 'Home';
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await storage.removeItem('auth_token');
    await storage.removeItem('refresh_token');
    setUser(null);
    navigate('Welcome');
  };

  const loginWithGoogle = async (userType: 'customer' | 'business_owner' | any = 'customer', planCode?: string, action: 'login' | 'register' = 'register') => {
    try {
      console.log('🔵 Starting Google OAuth flow...');
      
      // Use proxy for Expo Go, native scheme for development builds
      const redirectUri = AuthSession.makeRedirectUri({ 
        useProxy: true,
        scheme: 'linkuup'
      });
      
      console.log('🔗 Redirect URI:', redirectUri);
      
      let validUserType: 'customer' | 'business_owner' = 'customer';
      if (typeof userType === 'string' && (userType === 'customer' || userType === 'business_owner')) {
        validUserType = userType;
      }
      
      const params = new URLSearchParams({ user_type: validUserType, action: action });
      if (planCode && typeof planCode === 'string') {
        params.append('selected_plan_code', planCode);
      }
      
      const authUrl = `${API_BASE_URL}/auth/google?${params.toString()}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log('🌐 Auth URL:', authUrl);
      
      // Use the modern API - AuthRequest with promptAsync
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );
      
      console.log('📥 OAuth result:', result.type, result);
      
      if (result.type === 'success') {
        // Parse the callback URL to extract tokens
        const url = result.url;
        console.log('✅ OAuth callback URL:', url);
        
        // Extract tokens from URL params
        const urlParams = new URLSearchParams(url.split('?')[1] || url.split('#')[1]);
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');
        
        // Alternative: check if tokens are in the URL hash or query
        const hashMatch = url.match(/[#&]access_token=([^&]+)/);
        const refreshMatch = url.match(/[#&]refresh_token=([^&]+)/);
        
        const token = access_token || (hashMatch ? decodeURIComponent(hashMatch[1]) : null);
        const refresh = refresh_token || (refreshMatch ? decodeURIComponent(refreshMatch[1]) : null);
        
        if (token && refresh) {
          console.log('💾 Storing tokens...');
          await storage.setItem('auth_token', token);
          await storage.setItem('refresh_token', refresh);
          
          // Fetch user and update state
          console.log('👤 Fetching user data...');
          const userData = await authAPI.getCurrentUser();
          const newUser = {
            id: userData.id,
            email: userData.email,
            name: userData.first_name || userData.email,
            is_admin: userData.is_admin,
            user_type: userData.user_type,
            profile_picture: (userData as any).profile_picture,
            oauth_provider: (userData as any).oauth_provider,
            oauth_id: (userData as any).oauth_id,
            phone: (userData as any).phone,
          };
          setUser(newUser);
          console.log('✅ Google OAuth login successful');
        } else {
          console.error('❌ Tokens not found in OAuth callback');
          throw new Error('Failed to extract tokens from OAuth callback');
        }
      } else if (result.type === 'cancel') {
        console.log('ℹ️ User cancelled Google OAuth');
      } else if (result.type === 'dismiss') {
        console.log('ℹ️ OAuth session dismissed');
      } else {
        console.error('❌ OAuth failed:', result.type);
        throw new Error(`OAuth failed: ${result.type}`);
      }
    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
      console.error('Error details:', error.message, error.stack);
      // Re-throw to allow UI to handle it
      throw error;
    }
  };

  const loginWithFacebook = async (userType: 'customer' | 'business_owner' | any = 'customer', planCode?: string, action: 'login' | 'register' = 'register') => {
    try {
      console.log('🔵 Starting Facebook OAuth flow...');
      
      const redirectUri = AuthSession.makeRedirectUri({ 
        useProxy: true,
        scheme: 'linkuup'
      });
      
      console.log('🔗 Redirect URI:', redirectUri);
      
      let validUserType: 'customer' | 'business_owner' = 'customer';
      if (typeof userType === 'string' && (userType === 'customer' || userType === 'business_owner')) {
        validUserType = userType;
      }
      
      const params = new URLSearchParams({ user_type: validUserType, action: action });
      if (planCode && typeof planCode === 'string') {
        params.append('selected_plan_code', planCode);
      }
      
      const authUrl = `${API_BASE_URL}/auth/facebook?${params.toString()}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log('🌐 Auth URL:', authUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );
      
      console.log('📥 OAuth result:', result.type, result);
      
      if (result.type === 'success') {
        const url = result.url;
        console.log('✅ OAuth callback URL:', url);
        
        // Extract tokens from URL
        const hashMatch = url.match(/[#&]access_token=([^&]+)/);
        const refreshMatch = url.match(/[#&]refresh_token=([^&]+)/);
        
        const token = hashMatch ? decodeURIComponent(hashMatch[1]) : null;
        const refresh = refreshMatch ? decodeURIComponent(refreshMatch[1]) : null;
        
        if (token && refresh) {
          console.log('💾 Storing tokens...');
          await storage.setItem('auth_token', token);
          await storage.setItem('refresh_token', refresh);
          
          console.log('👤 Fetching user data...');
          const userData = await authAPI.getCurrentUser();
          const newUser = {
            id: userData.id,
            email: userData.email,
            name: userData.first_name || userData.email,
            is_admin: userData.is_admin,
            user_type: userData.user_type,
            profile_picture: (userData as any).profile_picture,
            oauth_provider: (userData as any).oauth_provider,
            oauth_id: (userData as any).oauth_id,
            phone: (userData as any).phone,
          };
          setUser(newUser);
          console.log('✅ Facebook OAuth login successful');
        } else {
          console.error('❌ Tokens not found in OAuth callback');
          throw new Error('Failed to extract tokens from OAuth callback');
        }
      } else if (result.type === 'cancel') {
        console.log('ℹ️ User cancelled Facebook OAuth');
      } else {
        console.error('❌ OAuth failed:', result.type);
        throw new Error(`OAuth failed: ${result.type}`);
      }
    } catch (error: any) {
      console.error('❌ Facebook OAuth error:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithFacebook,
    loading,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin || user?.user_type === 'platform_admin',
    isBusinessOwner: user?.user_type === 'business_owner',
    isCustomer: user?.user_type === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

