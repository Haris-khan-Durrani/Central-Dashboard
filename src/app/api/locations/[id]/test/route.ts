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

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
