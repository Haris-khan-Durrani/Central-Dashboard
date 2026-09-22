import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCommandCenterKpis } from '@/lib/kpi/engine';

// GET /api/shares/[token] — public read-only KPI data (NO private keys returned)
export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Share token is required' }, { status: 400 });
    }

    const share = await prisma.dashboardShare.findUnique({ where: { token } });

    if (!share || !share.isEnabled) {
      return NextResponse.json(
        { success: false, error: 'This share link is invalid or has been disabled.' },
        { status: 404 }
      );
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'This share link has expired.' }, { status: 410 });
    }

    // Parse saved filters as defaults
    let filters: Record<string, string> = {};
    if (share.filtersJson) {
      try {
        filters = JSON.parse(share.filtersJson);
      } catch {}
    }

    // Allow dynamic query params from public frontend
    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get('dateRange') || filters.dateRange || 'this_month') as any;
    const startDate = searchParams.get('startDate') || filters.startDate;
    const endDate = searchParams.get('endDate') || filters.endDate;
    const dateBasis = (searchParams.get('dateBasis') || filters.dateBasis || 'created') as any;
    const pipelineId = searchParams.get('pipelineId') || filters.pipelineId || 'all';
    const agentId = searchParams.get('agentId') || 'all';

    const t0 = Date.now();
    const data = await getCommandCenterKpis({
      locationId: share.locationId,
      dateRange,
      startDate,
      endDate,
      dateBasis,
      pipelineId,
      agentId,
    });
    const executionMs = Date.now() - t0;

    // Strip out any sensitive data before returning — NO private keys, NO encrypted fields
    const safeData = {
      ...data,
      location: {
        locationId: data.location.locationId,
        name: data.location.name,
        currency: data.location.currency,
        timezone: data.location.timezone,
        lastSyncAt: data.location.lastSyncAt,
        // ❌ NO encryptedPrivateKey or keyHint
      },
    };

    return NextResponse.json(
      {
        success: true,
        shareTitle: share.title,
        locationName: data.location.name,
        data: safeData,
        executionMs,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (err: any) {
    console.error('[Share API] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load dashboard data.' }, { status: 500 });
  }
}
