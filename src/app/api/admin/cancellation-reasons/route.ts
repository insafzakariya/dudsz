import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const reasons = await db.cancellationReason.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(reasons);
  } catch (error) {
    console.error('Error fetching cancellation reasons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancellation reasons' },
      { status: 500 }
    );
  }
}
