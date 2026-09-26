import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getGhlClientForLocation } from '@/lib/ghl/client-factory';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;

    const loc = await prisma.ghlLocation.findUnique({
      where: { locationId },
      select: { locationId: true, name: true, selectedCalendarIds: true },
    });

    if (!loc) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    let selectedIds: string[] = [];
    if (loc.selectedCalendarIds) {
      try {
        selectedIds = JSON.parse(loc.selectedCalendarIds);
      } catch {
        selectedIds = loc.selectedCalendarIds.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const client = await getGhlClientForLocation(locationId);
    const rawCalendars = await client.getCalendars();

    const calendars = rawCalendars.map((c: any) => {
      const calId = String(c.id || c._id || '');
      const isSelected = selectedIds.length === 0 || selectedIds.includes(calId);
      return {
        id: calId,
        name: c.name || 'Calendar',
        calendarType: c.calendarType || 'standard',
        description: c.description || '',
        isSelected,
      };
    });

    return NextResponse.json({
      success: true,
      selectedAll: selectedIds.length === 0,
      selectedCalendarIds: selectedIds,
      calendars,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;
    const body = await req.json();
    const { selectedCalendarIds } = body; // Array of calendar IDs, or null/empty array for all

    const serialized = Array.isArray(selectedCalendarIds) && selectedCalendarIds.length > 0
      ? JSON.stringify(selectedCalendarIds)
      : null;

    await prisma.ghlLocation.update({
      where: { locationId },
      data: { selectedCalendarIds: serialized },
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar configuration updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
