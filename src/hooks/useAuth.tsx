"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Role } from '@/lib/rbac';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Utility function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Initialize auth state from cookies
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = getCookie('accessToken');
        if (accessToken) {
          // Try to validate the existing token first
          try {
            const response = await fetch('/api/auth/validate', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              setUser(data.user);
              return;
            }
          } catch (error) {
            console.warn('Token validation failed, attempting refresh:', error);
          }

          // If token validation failed, try to refresh
          await refreshAuth();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (accessToken: string, userData: User) => {
    // Token is now stored in cookie by the API, no need to store in localStorage
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    // Clear tokens by calling logout API (removes cookies)
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
  };

  const refreshAuth = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        // Token is now stored in cookie by the API
        setUser(data.data.user);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Utility hooks for role checking
export function useHasRole(role: Role) {
  const { user } = useAuth();
  return user?.role === role;
}

export function useHasAnyRole(roles: Role[]) {
  const { user } = useAuth();
  return user ? roles.includes(user.role) : false;
}

export function useIsAdmin() {
  return useHasRole(Role.ADMIN);
}

export function useIsModerator() {
  const { user } = useAuth();
  return user ? [Role.MODERATOR, Role.ADMIN].includes(user.role) : false;
}