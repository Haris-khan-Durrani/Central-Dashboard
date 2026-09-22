import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { randomBytes } from 'crypto';

// POST /api/shares — create or refresh a share token for a location
export async function POST(req: Request) {
  try {
    const { locationId, title, dateRange, dateBasis, pipelineId, agentId } = await req.json();

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'locationId is required' }, { status: 400 });
    }

    // Verify location exists
    const loc = await prisma.ghlLocation.findUnique({ where: { locationId } });
    if (!loc) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    // Check if an active share already exists for this location
    const existing = await prisma.dashboardShare.findFirst({
      where: { locationId, isEnabled: true },
      orderBy: { createdAt: 'desc' },
    });

    const filtersJson = JSON.stringify({ dateRange, dateBasis, pipelineId, agentId });

    let share;
    if (existing) {
      // Update existing share (update filters but keep same token for stable URLs)
      share = await prisma.dashboardShare.update({
        where: { id: existing.id },
        data: {
          title: title || loc.name + ' - Sales Dashboard',
          filtersJson,
          isEnabled: true,
        },
      });
    } else {
      // Generate a new secure token
      const token = randomBytes(24).toString('hex');
      share = await prisma.dashboardShare.create({
        data: {
          token,
          locationId,
          title: title || loc.name + ' - Sales Dashboard',
          filtersJson,
          isEnabled: true,
          maskPii: true,
        },
      });
    }

    return NextResponse.json({ success: true, token: share.token, share });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/shares?locationId=xxx — get existing share for a location
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId') || searchParams.get('location_id');

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'locationId is required' }, { status: 400 });
    }

    const share = await prisma.dashboardShare.findFirst({
      where: { locationId, isEnabled: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!share) {
      return NextResponse.json({ success: true, share: null });
    }

    return NextResponse.json({ success: true, token: share.token, share });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/shares — disable share for a location
export async function DELETE(req: Request) {
  try {
    const { locationId } = await req.json();
    if (!locationId) {
      return NextResponse.json({ success: false, error: 'locationId is required' }, { status: 400 });
    }

    await prisma.dashboardShare.updateMany({
      where: { locationId },
      data: { isEnabled: false },
    });

    return NextResponse.json({ success: true, message: 'Share link disabled.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
