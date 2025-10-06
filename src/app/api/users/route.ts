import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from '@/lib/server-auth';
import { requireRole, handleApiError, ApiAuthError } from '@/lib/api-auth';
import { Role } from '@/lib/rbac';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

// GET /api/users - List all users (admin/moderator only)
export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user
    const user = await requireApiAuth(request);
    
    // ✅ SECURITY: Only moderators and admins can view user list
    if (user.role === Role.USER) {
      throw new ApiAuthError('Insufficient permissions to view users', 403);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      data: users,
      error: null,
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user
    const user = await requireApiAuth(request);
    
    // ✅ SECURITY: Only admins can create users
    requireRole(user, Role.ADMIN);

    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({
        error: { 
          message: "Email, password, and name are required", 
          details: null 
        }
      }, { status: 400 });
    }

    // Validate role
    if (role && !Object.values(Role).includes(role)) {
      return NextResponse.json({
        error: { 
          message: "Invalid role specified", 
          details: null 
        }
      }, { status: 400 });
    }

    // ✅ SECURITY: Prevent privilege escalation - only admins can create other admins
    if (role === Role.ADMIN && user.role !== Role.ADMIN) {
      return NextResponse.json({
        error: { 
          message: "Only admins can create admin users", 
          details: null 
        }
      }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({
        error: { 
          message: "User with this email already exists", 
          details: null 
        }
      }, { status: 409 });
    }

    // ✅ SECURITY: Hash password with strong settings
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || Role.USER,
      },
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
      data: newUser,
      error: null,
    }, { status: 201 });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
