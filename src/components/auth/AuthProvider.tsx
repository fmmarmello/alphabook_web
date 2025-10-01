"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Role } from '@/lib/rbac';
import { logAuth } from '@/lib/auth-logger';
// Removed unused token utility imports

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
  error: string | null;
  showLoginModal: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 🔧 FIXED: Use /api/auth/validate endpoint instead of trying to read HTTPOnly cookies
  const checkAuth = useCallback(async (showModalOnFail: boolean = true): Promise<boolean> => {
    try {
      setError(null);
      
      // Use the validate endpoint to check authentication (can read HTTPOnly cookies server-side)
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include', // Include HTTPOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data.user;
        
        logAuth.route('AuthProvider', true, false, false);
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        });
        setShowLoginModal(false);
        return true;
      } else if (response.status === 401) {
        // Token invalid or expired, try to refresh
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const userData = refreshData.data.user;
            
            logAuth.route('AuthProvider', true, false, false);
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
            });
            setShowLoginModal(false);
            return true;
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
        }

        // Both validation and refresh failed
        logAuth.route('AuthProvider', false, false, true);
        setUser(null);
        if (showModalOnFail) {
          setShowLoginModal(true);
        }
        return false;
      } else {
        throw new Error(`Validation failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logAuth.route('AuthProvider', false, false, true);
      setError('Authentication check failed. Please try again.');
      setUser(null);
      if (showModalOnFail) {
        setShowLoginModal(true);
      }
      return false;
    }
  }, []);

  // Initialize auth state from cookies with session persistence
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Check for existing session
        const hasSession = localStorage.getItem('hasAuthSession') === 'true';
        if (hasSession) {
          await checkAuth(false); // Don't show modal during initialization
        } else {
          // No previous session, user needs to login
          setUser(null);
          setShowLoginModal(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
        setUser(null);
        setShowLoginModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [checkAuth]);

  // Enhanced login function
  const login = useCallback((accessToken: string, userData: User) => {
    setUser(userData);
    setError(null);
    setShowLoginModal(false);
    // Mark that we have an active session
    localStorage.setItem('hasAuthSession', 'true');
    logAuth.route('AuthProvider', true, false, false);
  }, []);

  // Enhanced logout function
  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    setShowLoginModal(true);
    // Clear session persistence
    localStorage.removeItem('hasAuthSession');
    // Clear tokens by calling logout API (removes cookies)
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
    logAuth.route('AuthProvider', false, true, false);
  }, []);

  // Enhanced refresh auth function
  const refreshAuth = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
        setShowLoginModal(false);
        localStorage.setItem('hasAuthSession', 'true');
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setError('Session expired. Please login again.');
      logout();
      throw error;
    }
  }, [logout]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 🔧 FIXED: Auto-refresh token using server-side validation instead of reading HTTPOnly cookies
  useEffect(() => {
    if (user) {
      // Set up periodic token validation and refresh (every 10 minutes)
      const refreshTimer = setTimeout(() => {
        checkAuth(false).catch(() => {
          // Validation/refresh failed, user will be logged out by checkAuth
        });
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearTimeout(refreshTimer);
    }
  }, [user, checkAuth]);

  // Listen for storage changes (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hasAuthSession') {
        if (e.newValue === null || e.newValue === 'false') {
          // Another tab logged out
          setUser(null);
          setShowLoginModal(true);
        } else if (e.newValue === 'true' && !user) {
          // Another tab logged in
          checkAuth(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, checkAuth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    showLoginModal,
    login,
    logout,
    refreshAuth,
    clearError,
    setShowLoginModal,
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
