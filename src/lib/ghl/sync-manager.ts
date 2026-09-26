import prisma from '../db';
import { syncLocationData } from './sync';
import { fastCache } from '../cache';

// Active running sync promises to prevent race conditions & duplicate syncs
const activeSyncMap = new Map<string, Promise<{ success: boolean; message: string }>>();

// Track last auto sync timestamp per location
const lastAutoSyncAt = new Map<string, number>();

/**
 * Execute a synchronization with a location-level mutex lock.
 * Prevents concurrent duplicate syncs from creating conflicts or deadlocks.
 */
export async function runSyncWithLock(
  locationId: string,
  options: { incremental?: boolean } = {}
): Promise<{ success: boolean; message: string }> {
  // If a sync is already running for this location, await it instead of launching another
  const existing = activeSyncMap.get(locationId);
  if (existing) {
    return existing;
  }

  const syncPromise = (async () => {
    try {
      const result = await syncLocationData(locationId, options);
      lastAutoSyncAt.set(locationId, Date.now());
      fastCache.invalidateLocation(locationId);
      return result;
    } finally {
      activeSyncMap.delete(locationId);
    }
  })();

  activeSyncMap.set(locationId, syncPromise);
  return syncPromise;
}

/**
 * Automatically triggers a background incremental sync if data is older than maxAgeMs (default: 60s).
 * Does not block caller — runs asynchronously in the background.
 */
export async function autoSyncIfStale(locationId: string, maxAgeMs = 60000): Promise<void> {
  try {
    const loc = await prisma.ghlLocation.findUnique({
      where: { locationId },
      select: { lastSyncAt: true, syncStatus: true, isActive: true },
    });

    if (!loc || !loc.isActive) return;

    const now = Date.now();
    const lastSyncTime = loc.lastSyncAt ? loc.lastSyncAt.getTime() : 0;
    const isStale = now - lastSyncTime > maxAgeMs;

    if (isStale && !activeSyncMap.has(locationId)) {
      // Fire non-blocking server-side background sync
      runSyncWithLock(locationId, { incremental: true }).catch((err) => {
        console.warn(`Background auto-sync error for ${locationId}:`, err.message);
      });
    }
  } catch (err) {
    console.warn(`Error checking staleness for location ${locationId}:`, err);
  }
}

// Global server background sync interval runner (runs every 60s)
let daemonInterval: NodeJS.Timeout | null = null;

export function ensureAutoSyncDaemonStarted(): void {
  if (daemonInterval) return; // already started

  // Run initial pass after 10 seconds, then every 60 seconds
  setTimeout(() => {
    runDaemonPass();
  }, 10000);

  daemonInterval = setInterval(() => {
    runDaemonPass();
  }, 60000);

  if (daemonInterval.unref) daemonInterval.unref();
}

async function runDaemonPass() {
  try {
    const activeLocations = await prisma.ghlLocation.findMany({
      where: { isActive: true },
      select: { locationId: true, name: true, lastSyncAt: true },
    });

    for (const loc of activeLocations) {
      if (activeSyncMap.has(loc.locationId)) continue;

      const now = Date.now();
      const lastSync = loc.lastSyncAt ? loc.lastSyncAt.getTime() : 0;
      // Auto-sync if not synced in the last 60 seconds
      if (now - lastSync >= 60000) {
        runSyncWithLock(loc.locationId, { incremental: true }).catch((err) => {
          console.warn(`Daemon auto-sync for ${loc.name} (${loc.locationId}) failed:`, err.message);
        });
      }
    }
  } catch (e: any) {
    console.warn('Server auto-sync daemon pass encountered an error:', e.message);
  }
}

// Start daemon automatically when module is loaded by server
ensureAutoSyncDaemonStarted();
