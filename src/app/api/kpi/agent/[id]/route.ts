import { NextResponse } from 'next/server';
import { getAgent360Report } from '@/lib/kpi/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('location_id') || searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'location_id is required' }, { status: 400 });
    }

    const { id: agentId } = params;
    const dateRange = searchParams.get('date_range') || searchParams.get('dateRange') || 'this_month';
    const startDate = searchParams.get('start_date') || searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('end_date') || searchParams.get('endDate') || undefined;
    const dateBasis = searchParams.get('date_basis') || searchParams.get('dateBasis') || 'won';

    const report = await getAgent360Report(locationId, agentId, {
      dateRange,
      startDate,
      endDate,
      dateBasis,
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
