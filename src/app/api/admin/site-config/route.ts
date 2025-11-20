import { NextRequest, NextResponse } from 'next/server';
import { updateSiteConfig } from '@/lib/actions/site-config';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateSiteConfig(body);

    if (result.success) {
      return NextResponse.json(result.config);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating site config:', error);
    return NextResponse.json(
      { error: 'Failed to update site configuration' },
      { status: 500 }
    );
  }
}
