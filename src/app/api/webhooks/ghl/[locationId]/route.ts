import { NextResponse } from 'next/server';
import { processGhlWebhook } from '@/lib/ghl/webhook-handler';
import prisma from '@/lib/db';

/**
 * GET handler: Webhook Health Check & Verification
 * When visited in browser or pinged by GHL test request.
 */
export async function GET(req: Request, { params }: { params: { locationId: string } }) {
  try {
    const { locationId } = params;

    const loc = await prisma.ghlLocation.findUnique({
      where: { locationId },
      select: { locationId: true, name: true, syncStatus: true, lastSyncAt: true },
    });

    if (!loc) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Location ${locationId} is not configured in the database.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'active',
      healthy: true,
      message: `GoHighLevel Webhook listener is active and ready to receive POST events for "${loc.name}" (${locationId}).`,
      locationId: loc.locationId,
      subAccountName: loc.name,
      acceptedMethods: ['POST'],
      lastSyncAt: loc.lastSyncAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

/**
 * POST handler: Real-Time Webhook Ingestion from GoHighLevel
 */
export async function POST(req: Request, { params }: { params: { locationId: string } }) {
  try {
    const { locationId } = params;
    const body = await req.json();

    // Background processing for maximum speed (<15ms response to GHL)
    processGhlWebhook(locationId, body).catch((err) => {
      console.error(`Webhook processing error for location ${locationId}:`, err);
    });

    return NextResponse.json({
      success: true,
      received: true,
      locationId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
