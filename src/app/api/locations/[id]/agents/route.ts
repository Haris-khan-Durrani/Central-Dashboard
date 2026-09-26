import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fastCache } from '@/lib/cache';

// GET all agents for a location
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;

    const agents = await prisma.user.findMany({
      where: { locationId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        ghlUserId: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, agents });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT update agents visibility
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;
    const body = await req.json();
    const { agents } = body; // Array of { ghlUserId: string, isActive: boolean }

    if (!Array.isArray(agents)) {
      return NextResponse.json({ success: false, error: 'Expected agents array.' }, { status: 400 });
    }

    for (const a of agents) {
      if (!a.ghlUserId) continue;
      await prisma.user.updateMany({
        where: { locationId, ghlUserId: a.ghlUserId },
        data: { isActive: a.isActive },
      });
    }

    fastCache.invalidateLocation(locationId);

    return NextResponse.json({
      success: true,
      message: 'Agent visibility updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
