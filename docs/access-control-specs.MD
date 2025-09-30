# Access Control Specifications

## Role-Based Access Control (RBAC) System

This document outlines the role-based access control implementation for the application.

### Available Roles

- **`admin`** - Highest level access (full system access)
- **`user`** - Standard user access (default for new registrations)

### Role Hierarchy

- `admin` can access everything
- `user` can access standard features
- Future roles can be added by extending the role checks

## Usage Examples

### In API Routes - Require Authentication

```typescript
import { requireAuth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = requireAuth(request); // Throws if not authenticated
  // user.role contains the user's role
  // user.id contains the user's ID
  // user.email contains the user's email

  return Response.json({ message: "Authenticated access" });
}
```

### Require Specific Role

```typescript
import { requireRole } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  const user = requireRole(request, "admin"); // Requires admin role
  // Only admins can access this endpoint

  return Response.json({ message: "Admin-only operation completed" });
}
```

### Check Role in Component Logic

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth"; // You'll need to create this hook

export function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <div>Access denied. Admin role required.</div>;
  }

  return <div>Admin panel content</div>;
}
```

### Middleware Protection

```typescript
// In middleware.ts
import { requireAuth, requireRole } from "@/lib/auth";

export function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    try {
      requireRole(request, "admin");
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect API routes
  if (request.nextUrl.pathname.startsWith("/api/protected")) {
    try {
      requireAuth(request);
    } catch {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }
}
```

## Authentication Flow

### Login Process
1. User submits email/password to `/api/auth/login`
2. System validates credentials
3. Returns JWT access token (15min) and refresh token (7 days)
4. Access token stored in localStorage
5. Refresh token stored as httpOnly cookie

### Token Refresh
1. When access token expires, call `/api/auth/refresh`
2. System validates refresh token from cookie
3. Returns new access token and refresh token
4. Updates stored tokens

### Logout Process
1. Call `/api/auth/logout`
2. Clears refresh token cookie
3. Remove access token from localStorage

## Security Considerations

- JWT secrets should be environment variables
- Refresh tokens are httpOnly cookies
- Access tokens stored in localStorage (accessible to JavaScript)
- Passwords hashed with bcrypt (12 salt rounds)
- Role checks performed on both client and server

## Future Extensions

### Adding New Roles

1. Update the role enum in Prisma schema if needed
2. Add role-specific logic in components
3. Update API authorization checks
4. Create role management UI for admins

### Permission-Based Access

For more granular control, consider implementing permissions:

```typescript
enum Permission {
  READ_USERS = "read:users",
  WRITE_USERS = "write:users",
  DELETE_USERS = "delete:users",
  // etc.
}

const rolePermissions = {
  admin: Object.values(Permission),
  user: [Permission.READ_USERS],
};
```

## Testing Role-Based Access

### Unit Tests

```typescript
describe("requireAuth", () => {
  it("should throw when no token provided", () => {
    const request = new NextRequest("http://localhost/api/test");
    expect(() => requireAuth(request)).toThrow();
  });

  it("should return user when valid token provided", () => {
    // Mock request with valid JWT
    const user = requireAuth(request);
    expect(user.role).toBe("admin");
  });
});
```

### Integration Tests

```typescript
describe("Admin API", () => {
  it("should allow admin access", async () => {
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(response.status).toBe(200);
  });

  it("should deny user access", async () => {
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    expect(response.status).toBe(403);
  });
});