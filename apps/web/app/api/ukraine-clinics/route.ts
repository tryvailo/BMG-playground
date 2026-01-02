import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read TSV file from temp directory
    // Path relative to apps/web directory: ../../temp/medical_centers_ukraine.tsv
    const tsvPath = join(process.cwd(), '../../temp/medical_centers_ukraine.tsv');
    const content = readFileSync(tsvPath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error reading Ukraine clinics TSV:', error);
    return NextResponse.json(
      { error: 'Failed to load clinics data' },
      { status: 500 }
    );
  }
}

