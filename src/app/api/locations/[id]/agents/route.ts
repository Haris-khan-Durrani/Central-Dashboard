import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fastCache } from '@/lib/cache';

// GET all agents for a location with their configured revenue targets
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;

    const [agents, targets] = await Promise.all([
      prisma.user.findMany({
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
      }),
      prisma.kpiTarget.findMany({ where: { locationId } }),
    ]);

    const targetMap = new Map(targets.map((t) => [t.ghlUserId, t.revenueTarget]));

    const enriched = agents.map((a: any) => ({
      ...a,
      targetRevenue: targetMap.get(a.ghlUserId) ?? 50000,
    }));

    return NextResponse.json({ success: true, agents: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT update agents visibility and individual targets
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;
    const body = await req.json();
    const { agents } = body; // Array of { ghlUserId: string, isActive: boolean, targetRevenue?: number }

    if (!Array.isArray(agents)) {
      return NextResponse.json({ success: false, error: 'Expected agents array.' }, { status: 400 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    for (const a of agents) {
      if (!a.ghlUserId) continue;
      const targetRev =
        typeof a.targetRevenue === 'number' && !isNaN(a.targetRevenue)
          ? a.targetRevenue
          : Number(a.targetRevenue) || 50000;

      await prisma.user.updateMany({
        where: { locationId, ghlUserId: a.ghlUserId },
        data: {
          isActive: a.isActive !== false,
        },
      });

      await prisma.kpiTarget.upsert({
        where: {
          locationId_ghlUserId_periodMonth: {
            locationId,
            ghlUserId: a.ghlUserId,
            periodMonth: currentMonth,
          },
        },
        create: {
          locationId,
          ghlUserId: a.ghlUserId,
          periodMonth: currentMonth,
          revenueTarget: targetRev,
        },
        update: {
          revenueTarget: targetRev,
        },
      });
    }

    fastCache.invalidateLocation(locationId);

    return NextResponse.json({
      success: true,
      message: 'Agent visibility and targets updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
