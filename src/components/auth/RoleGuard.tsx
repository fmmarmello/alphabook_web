"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Role, RBAC, Permission } from '@/lib/rbac';

interface RoleGuardProps {
  children: ReactNode;
  roles?: Role[];
  permissions?: Permission[];
  fallback?: ReactNode;
  requireAllPermissions?: boolean;
}

/**
 * RoleGuard component that conditionally renders children based on user roles/permissions
 */
export function RoleGuard({
  children,
  roles,
  permissions,
  fallback = null,
  requireAllPermissions = false
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // No user = no access
  if (!user) {
    return <>{fallback}</>;
  }

  // Check roles
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(user.role);
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    let hasPermission = false;

    if (requireAllPermissions) {
      // Must have ALL permissions
      hasPermission = RBAC.hasAllPermissions(user.role, permissions);
    } else {
      // Must have ANY of the permissions
      hasPermission = RBAC.hasAnyPermission(user.role, permissions);
    }

    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard roles={[Role.ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ModeratorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard roles={[Role.MODERATOR, Role.ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function UserOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard roles={[Role.USER, Role.MODERATOR, Role.ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Permission-based guards
export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback
}: {
  children: ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      permissions={permissions}
      requireAllPermissions={requireAll}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
