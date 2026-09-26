import { NextResponse } from 'next/server';
import { getCommandCenterKpis } from '@/lib/kpi/engine';
import { autoSyncIfStale } from '@/lib/ghl/sync-manager';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const t0 = performance.now();
  try {
    const { searchParams } = new URL(req.url);
    let locationId = searchParams.get('location_id') || searchParams.get('locationId');

    // If no location provided, fallback to the first active location in DB
    if (!locationId) {
      const firstLoc = await prisma.ghlLocation.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!firstLoc) {
        return NextResponse.json(
          { success: false, error: 'No sub-accounts configured. Please add a sub-account first.' },
          { status: 404 }
        );
      }
      locationId = firstLoc.locationId;
    }

    // Automatically trigger non-blocking server-side background sync if data is stale (>60s)
    autoSyncIfStale(locationId, 60000);

    const dateRange = searchParams.get('dateRange') || 'this_month';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const dateBasis = searchParams.get('dateBasis') || 'created';
    const pipelineId = searchParams.get('pipelineId') || 'all';
    const agentId = searchParams.get('agentId') || 'all';

    const data = await getCommandCenterKpis({
      locationId,
      dateRange,
      startDate,
      endDate,
      dateBasis,
      pipelineId,
      agentId,
    });

    const elapsedMs = Math.round((performance.now() - t0) * 100) / 100;

    return NextResponse.json(
      {
        success: true,
        executionMs: elapsedMs,
        data,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
