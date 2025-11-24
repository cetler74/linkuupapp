import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { PlaceProvider } from './src/contexts/PlaceContext';
import { UserPermissionsProvider } from './src/contexts/UserPermissionsContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { API_BASE_URL } from './src/utils/apiConfig';
import './src/i18n/i18n';

// Log API configuration on startup
console.log('🚀 App starting...');
console.log('📡 API Base URL:', API_BASE_URL);

// Enable better error logging
if (__DEV__) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    originalError('🔴 ERROR:', ...args);
  };
  
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalWarn('🟡 WARNING:', ...args);
  };
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PlaceProvider>
            <UserPermissionsProvider>
              <NotificationProvider>
                <AppNavigator />
                <StatusBar style="auto" />
              </NotificationProvider>
            </UserPermissionsProvider>
          </PlaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
