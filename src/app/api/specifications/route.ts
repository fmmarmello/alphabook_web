import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user (throws if not authenticated)
    getAuthenticatedUser(req);
    
    // ✅ SECURITY: All authenticated users can access specifications
    
    const filePath = path.join(process.cwd(), 'src', 'lib', 'especificacoes.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const specifications = JSON.parse(fileContent);

    return NextResponse.json({
      data: specifications,
      error: null
    });
    
  } catch (error) {
    const { error: apiError, status } = handleApiError(error);
    return NextResponse.json(apiError, { status });
  }
}
