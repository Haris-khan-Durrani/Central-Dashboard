import { NextResponse } from 'next/server';
import { runSyncWithLock } from '@/lib/ghl/sync-manager';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;
    const { searchParams } = new URL(req.url);
    const isIncremental = searchParams.get('mode') === 'incremental';
    const result = await runSyncWithLock(locationId, { incremental: isIncremental });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
