import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAgent360Report } from '@/lib/kpi/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { token: string; id: string } }
) {
  try {
    const { token, id: agentId } = params;

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

    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get('date_range') || searchParams.get('dateRange') || 'this_month';
    const startDate = searchParams.get('start_date') || searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('end_date') || searchParams.get('endDate') || undefined;
    const dateBasis = searchParams.get('date_basis') || searchParams.get('dateBasis') || 'won';
    const segregationField = searchParams.get('segregation_field') || searchParams.get('segregationField') || 'contact.nationality';

    const report = await getAgent360Report(share.locationId, agentId, {
      dateRange,
      startDate,
      endDate,
      dateBasis,
      segregationField,
    });

    return NextResponse.json(
      { success: true, report },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (err: any) {
    console.error('[Public Agent 360 API] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to load agent report' }, { status: 500 });
  }
}
