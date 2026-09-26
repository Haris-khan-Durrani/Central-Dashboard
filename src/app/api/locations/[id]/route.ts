import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { encryptString, getMaskedKeyHint } from '@/lib/crypto';
import { fastCache } from '@/lib/cache';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;
    const body = await req.json();
    const { name, currency, timezone, privateKey, enableBookings, selectedCalendarIds, agents } = body;

    const existing = await prisma.ghlLocation.findUnique({
      where: { locationId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Sub-account not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (currency) updateData.currency = currency.trim().toUpperCase();
    if (timezone) updateData.timezone = timezone.trim();
    if (enableBookings !== undefined) updateData.enableBookings = Boolean(enableBookings);
    if (selectedCalendarIds !== undefined) {
      updateData.selectedCalendarIds =
        Array.isArray(selectedCalendarIds) && selectedCalendarIds.length > 0
          ? JSON.stringify(selectedCalendarIds)
          : typeof selectedCalendarIds === 'string' && selectedCalendarIds.trim()
          ? selectedCalendarIds
          : null;
    }

    if (privateKey && privateKey.trim()) {
      updateData.encryptedPrivateKey = encryptString(privateKey.trim());
      updateData.keyHint = getMaskedKeyHint(privateKey.trim());
    }

    const updated = await prisma.ghlLocation.update({
      where: { locationId },
      data: updateData,
      select: {
        id: true,
        locationId: true,
        name: true,
        keyHint: true,
        currency: true,
        timezone: true,
        isActive: true,
        enableBookings: true,
        lastSyncAt: true,
        syncStatus: true,
      },
    });

    // Update agents visibility if provided
    if (Array.isArray(agents) && agents.length > 0) {
      for (const a of agents) {
        if (!a.ghlUserId) continue;
        await prisma.user.upsert({
          where: {
            locationId_ghlUserId: {
              locationId,
              ghlUserId: a.ghlUserId,
            },
          },
          update: {
            isActive: a.isActive !== false,
          },
          create: {
            locationId,
            ghlUserId: a.ghlUserId,
            name: a.name || 'User',
            email: a.email || null,
            role: a.role || 'Sales Consultant',
            avatarUrl: a.avatarUrl || null,
            isActive: a.isActive !== false,
          },
        });
      }
    }

    fastCache.invalidateLocation(locationId);

    return NextResponse.json({
      success: true,
      message: 'Sub-account updated successfully.',
      location: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: locationId } = params;

    const existing = await prisma.ghlLocation.findUnique({
      where: { locationId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Sub-account not found.' }, { status: 404 });
    }

    // Delete location (cascade deletes related records)
    await prisma.ghlLocation.delete({
      where: { locationId },
    });

    fastCache.invalidateLocation(locationId);

    return NextResponse.json({
      success: true,
      message: `Sub-account ${existing.name} deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
