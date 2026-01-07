/**
 * API Route: POST /api/meta-tags/save
 * Save edited meta tags to database
 * Week 4, Days 4-5
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, metaTags, url } = body;

    if (!serviceId || !metaTags) {
      return NextResponse.json(
        { error: 'serviceId and metaTags are required', success: false },
        { status: 400 }
      );
    }

    // In a real application, this would save to database
    // For now, we'll validate the data and return success

    const { title, description, canonical, ogTitle, ogDescription, ogImage, twitterCard } = metaTags;

    // Validate required fields
    if (!title || title.length < 10) {
      return NextResponse.json(
        { error: 'Title must be at least 10 characters', success: false },
        { status: 400 }
      );
    }

    if (!description || description.length < 50) {
      return NextResponse.json(
        { error: 'Description must be at least 50 characters', success: false },
        { status: 400 }
      );
    }

    // Validate URLs
    const urlFields = [canonical, url];
    for (const field of urlFields) {
      if (field) {
        try {
          new URL(field);
        } catch {
          return NextResponse.json(
            { error: 'Invalid URL provided', success: false },
            { status: 400 }
          );
        }
      }
    }

    // Log saved meta tags (in production, save to database)
    console.log('Meta tags saved for service:', {
      serviceId,
      title,
      description,
      canonical,
      ogTitle,
      ogDescription,
      ogImage,
      twitterCard,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        data: {
          serviceId,
          metaTags,
          savedAt: new Date().toISOString(),
        },
        success: true,
        message: 'Meta tags saved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Meta tags save error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
