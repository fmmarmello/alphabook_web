import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'especificacoes.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const specifications = JSON.parse(fileContent);

    return NextResponse.json(specifications);
  } catch (error) {
    console.error('Error reading specifications:', error);
    return NextResponse.json({ error: 'Failed to load specifications' }, { status: 500 });
  }
}