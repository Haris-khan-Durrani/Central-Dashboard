import { NextResponse } from 'next/server';
import { getAgent360Report } from '@/lib/kpi/engine';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('location_id') || searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'location_id is required' }, { status: 400 });
    }

    const { id: agentId } = params;
    const report = await getAgent360Report(locationId, agentId);

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
