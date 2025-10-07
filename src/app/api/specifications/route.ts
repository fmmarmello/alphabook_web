import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireApiAuth } from '@/lib/server-auth';
import { handleApiError } from '@/lib/api-auth';
import { SpecificationData } from '@/lib/specifications-enums';

interface SpecificationResponse {
  data: SpecificationData;
  metadata: {
    version: string;
    lastUpdated: string;
    source: 'json' | 'database';
    categories: string[];
    totalOptions: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    await requireApiAuth(req);

    // ✅ SECURITY: All authenticated users can access specifications

    const filePath = path.join(process.cwd(), 'src', 'lib', 'especificacoes.json');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Specifications file not found');
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const specifications = JSON.parse(fileContent) as SpecificationData;

    // Calculate metadata
    const totalOptions = Object.values(specifications).reduce(
      (total, options) => total + options.length,
      0
    );

    const stats = fs.statSync(filePath);

    const response: SpecificationResponse = {
      data: specifications,
      metadata: {
        version: '1.0',
        lastUpdated: stats.mtime.toISOString(),
        source: 'json', // Phase 1, later 'database'
        categories: Object.keys(specifications),
        totalOptions,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching specifications:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}

// Optional: POST endpoint for updating specifications (admin only)
export async function POST(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user
    const user = await requireApiAuth(req);

    // ✅ SECURITY: Only admins can update specifications
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    if (!body.data || typeof body.data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request: data object is required' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'src', 'lib', 'especificacoes.json');

    // Backup existing file
    const backupPath = `${filePath}.backup.${Date.now()}`;
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }

    // Write new specifications
    fs.writeFileSync(filePath, JSON.stringify(body.data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Specifications updated successfully',
      backupPath,
    });

  } catch (error) {
    console.error('Error updating specifications:', error);
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
