import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';
import { storage } from '../utils/storage';

interface UserPermissions {
  bookings: boolean;
  rewards: boolean;
  time_off: boolean;
  campaigns: boolean;
  messaging: boolean;
  notifications: boolean;
}

interface UserPermissionsContextType {
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  isFeatureEnabled: (feature: keyof UserPermissions) => boolean;
}

const UserPermissionsContext = createContext<UserPermissionsContextType | undefined>(undefined);

interface UserPermissionsProviderProps {
  children: ReactNode;
}

export const UserPermissionsProvider: React.FC<UserPermissionsProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await storage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/owner/user/feature-permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.feature_permissions);
      } else {
        throw new Error('Failed to fetch user permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  const isFeatureEnabled = (feature: keyof UserPermissions): boolean => {
    if (!permissions) return false;
    return permissions[feature];
  };

  const value: UserPermissionsContextType = {
    permissions,
    loading,
    error,
    refreshPermissions,
    isFeatureEnabled,
  };

  return (
    <UserPermissionsContext.Provider value={value}>
      {children}
    </UserPermissionsContext.Provider>
  );
};

export const useUserPermissions = (): UserPermissionsContextType => {
  const context = useContext(UserPermissionsContext);
  if (context === undefined) {
    throw new Error('useUserPermissions must be used within a UserPermissionsProvider');
  }
  return context;
};

