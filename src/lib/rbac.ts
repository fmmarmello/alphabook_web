export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export enum Permission {
  // User management
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',

  // Content management
  READ_CONTENT = 'read:content',
  WRITE_CONTENT = 'write:content',
  DELETE_CONTENT = 'delete:content',
  MODERATE_CONTENT = 'moderate:content',

  // System administration
  READ_SYSTEM = 'read:system',
  WRITE_SYSTEM = 'write:system',
  DELETE_SYSTEM = 'delete:system',

  // Reports and analytics
  READ_REPORTS = 'read:reports',
  WRITE_REPORTS = 'write:reports',

  // Orders and budgets
  READ_ORDERS = 'read:orders',
  WRITE_ORDERS = 'write:orders',
  APPROVE_ORDERS = 'approve:orders',

  // Centers and clients
  READ_CENTERS = 'read:centers',
  WRITE_CENTERS = 'write:centers',
  READ_CLIENTS = 'read:clients',
  WRITE_CLIENTS = 'write:clients'
}

// Role hierarchy and permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_CONTENT,
    Permission.WRITE_CONTENT,
    Permission.READ_ORDERS,
    Permission.WRITE_ORDERS,
    Permission.READ_CENTERS,
    Permission.READ_CLIENTS,
    Permission.WRITE_CLIENTS,
    Permission.READ_REPORTS
  ],
  [Role.MODERATOR]: [
    // All user permissions plus
    Permission.READ_USERS,
    Permission.MODERATE_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.APPROVE_ORDERS,
    Permission.WRITE_CENTERS,
    Permission.WRITE_REPORTS
  ],
  [Role.ADMIN]: [
    // All permissions
    ...Object.values(Permission)
  ]
};

// Role hierarchy for checking if one role can access another level
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.MODERATOR]: 2,
  [Role.ADMIN]: 3
};

export class RBAC {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a role can perform an action on another user's role
   * (e.g., admin can modify moderator, but moderator cannot modify admin)
   */
  static canManageRole(actorRole: Role, targetRole: Role): boolean {
    const actorLevel = ROLE_HIERARCHY[actorRole];
    const targetLevel = ROLE_HIERARCHY[targetRole];
    return actorLevel > targetLevel;
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if role has any of the specified permissions
   */
  static hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if role has all of the specified permissions
   */
  static hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Get roles that can be managed by the given role
   */
  static getManageableRoles(role: Role): Role[] {
    const currentLevel = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
      .filter(([, level]) => level < currentLevel)
      .map(([roleName]) => roleName as Role);
  }

  /**
   * Validate role transition (for promotions/demotions)
   */
  static canChangeRole(actorRole: Role, currentRole: Role, newRole: Role): boolean {
    // Actor must be able to manage both current and new roles
    return this.canManageRole(actorRole, currentRole) && this.canManageRole(actorRole, newRole);
  }
}

// Utility functions for common checks
export const canReadUsers = (role: Role) => RBAC.hasPermission(role, Permission.READ_USERS);
export const canWriteUsers = (role: Role) => RBAC.hasPermission(role, Permission.WRITE_USERS);
export const canDeleteUsers = (role: Role) => RBAC.hasPermission(role, Permission.DELETE_USERS);

export const canReadContent = (role: Role) => RBAC.hasPermission(role, Permission.READ_CONTENT);
export const canWriteContent = (role: Role) => RBAC.hasPermission(role, Permission.WRITE_CONTENT);
export const canModerateContent = (role: Role) => RBAC.hasPermission(role, Permission.MODERATE_CONTENT);

export const canApproveOrders = (role: Role) => RBAC.hasPermission(role, Permission.APPROVE_ORDERS);
export const canReadReports = (role: Role) => RBAC.hasPermission(role, Permission.READ_REPORTS);

export const isAdmin = (role: Role) => role === Role.ADMIN;
export const isModerator = (role: Role) => role === Role.MODERATOR || role === Role.ADMIN;
export const isUser = (role: Role) => role === Role.USER || role === Role.MODERATOR || role === Role.ADMIN;