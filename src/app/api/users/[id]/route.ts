import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, handleApiError, ApiAuthError, canManageUser } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const currentUser = getAuthenticatedUser(request);
    
    const { id: paramId } = await params;
    const userId = parseInt(paramId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: { message: "Invalid user ID", details: null } },
        { status: 400 }
      );
    }

    // ✅ SECURITY: Users can read their own data, ADMIN/MODERATOR can read all
    if (currentUser.userId !== userId && currentUser.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to view user details', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found", details: null } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: user,
      error: null,
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const currentUser = getAuthenticatedUser(request);
    
    const { id: paramId } = await params;
    const userId = parseInt(paramId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: { message: "Invalid user ID", details: null } },
        { status: 400 }
      );
    }

    const { name, role, email } = await request.json();

    // ✅ SECURITY: Users can update their own profile, ADMIN/MODERATOR can update anyone
    const canUpdate = currentUser.userId === userId ||
                      currentUser.role === Role.ADMIN ||
                      currentUser.role === Role.MODERATOR;

    if (!canUpdate) {
      throw new ApiAuthError('Insufficient permissions to update user', 403);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: { message: "User not found", details: null } },
        { status: 404 }
      );
    }

    // Validate role changes
    if (role !== undefined) {
      if (!Object.values(Role).includes(role)) {
        return NextResponse.json(
          { error: { message: "Invalid role specified", details: null } },
          { status: 400 }
        );
      }

      // ✅ SECURITY: Check if current user can assign this role
      if (!canManageUser(currentUser.role, role)) {
        return NextResponse.json(
          { error: { message: "Cannot assign this role", details: null } },
          { status: 403 }
        );
      }
    }

    // Check email uniqueness if changing email
    if (email && email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: { message: "Email already in use", details: null } },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) updateData.email = email;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: updatedUser,
      error: null,
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    const currentUser = getAuthenticatedUser(request);
    
    // ✅ SECURITY: Only admins can delete users
    if (currentUser.role !== Role.ADMIN) {
      throw new ApiAuthError('Insufficient permissions to delete users', 403);
    }

    const { id: paramId } = await params;
    const userId = parseInt(paramId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: { message: "Invalid user ID", details: null } },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found", details: null } },
        { status: 404 }
      );
    }

    // Prevent deleting self
    if (currentUser.userId === userId) {
      return NextResponse.json(
        { error: { message: "Cannot delete your own account", details: null } },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      data: { message: "User deleted successfully" },
      error: null,
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
