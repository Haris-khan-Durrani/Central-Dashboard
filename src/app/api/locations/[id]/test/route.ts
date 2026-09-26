import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { decryptString } from '@/lib/crypto';
import { GhlClient } from '@/lib/ghl/client-factory';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;
    let privateKey: string | undefined;

    // Check if key provided in body
    try {
      const body = await req.json();
      if (body.privateKey) privateKey = body.privateKey;
    } catch {
      // no body
    }

    if (!privateKey) {
      const loc = await prisma.ghlLocation.findUnique({
        where: { locationId },
      });
      if (!loc) {
        return NextResponse.json({ success: false, error: 'Location not found.' }, { status: 404 });
      }
      privateKey = decryptString(loc.encryptedPrivateKey);
    }

    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: 'Could not resolve Private Integration Key.' },
        { status: 400 }
      );
    }

    const client = new GhlClient({ locationId, privateKey });
    const result = await client.testConnection();

    if (result.success && result.agents) {
      // Check if location or agents exist in DB to preserve saved isActive states & targetRevenue
      const [dbUsers, dbTargets] = await Promise.all([
        prisma.user.findMany({
          where: { locationId },
          select: { ghlUserId: true, isActive: true },
        }),
        prisma.kpiTarget.findMany({
          where: { locationId },
          select: { ghlUserId: true, revenueTarget: true },
        }),
      ]);
      const dbMap = new Map(dbUsers.map((u) => [u.ghlUserId, u.isActive]));
      const targetMap = new Map(dbTargets.map((t) => [t.ghlUserId, t.revenueTarget]));

      result.agents = result.agents.map((a: any) => ({
        ...a,
        isActive: dbMap.has(a.ghlUserId) ? (dbMap.get(a.ghlUserId) as boolean) : true,
        targetRevenue: targetMap.get(a.ghlUserId) ?? 50000,
      }));
    }

    if (result.success && Array.isArray(result.calendars)) {
      const loc = await prisma.ghlLocation.findUnique({
        where: { locationId },
        select: { selectedCalendarIds: true },
      });
      let selectedIds: string[] = [];
      if (loc?.selectedCalendarIds) {
        try {
          selectedIds = JSON.parse(loc.selectedCalendarIds);
        } catch {
          selectedIds = loc.selectedCalendarIds.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      result.calendars = result.calendars.map((c: any) => ({
        ...c,
        isSelected: selectedIds.length === 0 || selectedIds.includes(c.id),
      }));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
