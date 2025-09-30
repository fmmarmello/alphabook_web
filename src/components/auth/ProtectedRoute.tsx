"use client";

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Role } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthOverlay } from '@/components/auth/AuthOverlay';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: Role[];
  fallback?: ReactNode;
  blockContent?: boolean; // If true, completely blocks content until authenticated
}

/**
 * Enhanced ProtectedRoute component that shows full-screen modal overlay for authentication
 * instead of redirecting to login page. Provides comprehensive route protection.
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
  blockContent = true
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, error, showLoginModal, setShowLoginModal } = useAuth();

  // Trigger authentication modal if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !showLoginModal) {
      setShowLoginModal(true);
    }
  }, [isLoading, isAuthenticated, showLoginModal, setShowLoginModal]);

  // Show error state if authentication check failed
  if (error) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </div>
        </div>
        <AuthOverlay />
      </>
    );
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Verifying authentication...</p>
            {/* Show skeleton content for better UX */}
            <div className="max-w-4xl mx-auto space-y-4 pt-8">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-64 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </div>
        </div>
        <AuthOverlay />
      </>
    );
  }

  // If not authenticated, show authentication overlay
  if (!isAuthenticated) {
    return (
      <>
        {/* Block content completely if blockContent is true */}
        {blockContent ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground">Authentication required to access this content.</p>
            </div>
          </div>
        ) : (
          // Show fallback content if provided
          fallback && <>{fallback}</>
        )}
        <AuthOverlay />
      </>
    );
  }

  // Check role-based access if specific roles are required
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user?.role === role);
    
    if (!hasRequiredRole) {
      return (
        <>
          {fallback ? (
            <>{fallback}</>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <Alert>
                  <AlertDescription>
                    You don't have the required permissions to access this content.
                    Required roles: {requiredRoles.join(', ')}.
                    Your role: {user?.role || 'None'}.
                  </AlertDescription>
                </Alert>
                <div className="mt-4">
                  <Button onClick={() => window.history.back()}>
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          )}
          <AuthOverlay />
        </>
      );
    }
  }

  // User is authenticated and has required permissions
  return (
    <>
      {children}
      <AuthOverlay />
    </>
  );
}

// Convenience components for common protection levels
export function AdminRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function ModeratorRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[Role.MODERATOR, Role.ADMIN]} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Component that prevents any content from rendering until user is authenticated
 * Use this for highly sensitive pages that should show absolutely nothing to unauthorized users
 */
export function SecureRoute({ children, requiredRoles }: { children: ReactNode; requiredRoles?: Role[] }) {
  return (
    <ProtectedRoute requiredRoles={requiredRoles} blockContent={true}>
      {children}
    </ProtectedRoute>
  );
}
