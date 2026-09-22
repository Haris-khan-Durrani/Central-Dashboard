import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { encryptString, getMaskedKeyHint } from '@/lib/crypto';
import { GhlClient } from '@/lib/ghl/client-factory';

export async function GET() {
  try {
    const locations = await prisma.ghlLocation.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        locationId: true,
        name: true,
        keyHint: true,
        currency: true,
        timezone: true,
        isActive: true,
        lastSyncAt: true,
        syncStatus: true,
        syncErrorMessage: true,
      },
    });

    return NextResponse.json({ success: true, locations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locationId, name, privateKey, currency = 'AED', timezone = 'Asia/Dubai' } = body;

    if (!locationId || !name || !privateKey) {
      return NextResponse.json(
        { success: false, error: 'Location ID, Name, and Private Integration Key are required.' },
        { status: 400 }
      );
    }

    // Encrypt Private Key
    const encryptedPrivateKey = encryptString(privateKey);
    const keyHint = getMaskedKeyHint(privateKey);

    const location = await prisma.ghlLocation.upsert({
      where: { locationId: locationId.trim() },
      update: {
        name: name.trim(),
        encryptedPrivateKey,
        keyHint,
        currency: currency.trim() || 'AED',
        timezone: timezone.trim() || 'Asia/Dubai',
        isActive: true,
      },
      create: {
        locationId: locationId.trim(),
        name: name.trim(),
        encryptedPrivateKey,
        keyHint,
        currency: currency.trim() || 'AED',
        timezone: timezone.trim() || 'Asia/Dubai',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sub-account saved successfully.',
      location: {
        id: location.id,
        locationId: location.locationId,
        name: location.name,
        keyHint: location.keyHint,
        currency: location.currency,
        timezone: location.timezone,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
