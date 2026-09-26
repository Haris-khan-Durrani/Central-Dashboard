import prisma from '../db';
import { decryptString } from '../crypto';
import { fastCache } from '../cache';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

export interface GhlApiConfig {
  locationId: string;
  privateKey: string;
}

export class GhlClient {
  private locationId: string;
  private privateKey: string;

  constructor(config: GhlApiConfig) {
    this.locationId = config.locationId;
    this.privateKey = config.privateKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${GHL_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.privateKey}`,
      'Version': GHL_API_VERSION,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const json = JSON.parse(errorText);
        parsedError = json.message || json.error || errorText;
      } catch {
        // use raw text
      }
      throw new Error(`GHL API Error (${response.status}): ${parsedError}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Tests API connectivity, checks pipelines, users/agents, and calendars.
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    pipelinesCount?: number;
    agents?: Array<{
      ghlUserId: string;
      name: string;
      email: string | null;
      role: string;
      avatarUrl: string | null;
    }>;
    calendars?: Array<{
      id: string;
      name: string;
      calendarType?: string;
      isActive?: boolean;
    }>;
    data?: any;
  }> {
    try {
      // 1. Fetch pipelines to verify permissions
      const pipeRes = await this.request<any>(`/opportunities/pipelines?locationId=${this.locationId}`);
      const pipelines = pipeRes.pipelines || [];

      // 2. Fetch users/agents for agent visibility selection
      let agents: any[] = [];
      try {
        const userRes = await this.request<any>(`/users/?locationId=${this.locationId}`);
        const rawUsers = userRes.users || [];
        agents = rawUsers.map((u: any) => ({
          ghlUserId: String(u.id || u._id || u.userId || ''),
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'User',
          email: u.email || null,
          role: u.roles?.role || u.role || 'Sales Consultant',
          avatarUrl: u.avatar || null,
        })).filter((u: any) => u.ghlUserId);
      } catch (userErr) {
        console.warn(`Could not fetch users during testConnection for location ${this.locationId}:`, userErr);
      }

      // 3. Fetch calendars for calendar selection
      let calendars: any[] = [];
      try {
        const calRes = await this.request<any>(`/calendars/?locationId=${this.locationId}`);
        const rawCalendars = calRes.calendars || [];
        calendars = rawCalendars.map((c: any) => ({
          id: String(c.id || c._id || ''),
          name: c.name || 'Calendar',
          calendarType: c.calendarType || 'standard',
          isActive: c.isActive !== false,
        })).filter((c: any) => c.id);
      } catch (calErr) {
        console.warn(`Could not fetch calendars during testConnection for location ${this.locationId}:`, calErr);
      }

      return {
        success: true,
        message: `Successfully connected to GoHighLevel! Found ${pipelines.length} pipeline${pipelines.length === 1 ? '' : 's'}, ${agents.length} agent${agents.length === 1 ? '' : 's'}, and ${calendars.length} calendar${calendars.length === 1 ? '' : 's'}.`,
        pipelinesCount: pipelines.length,
        agents,
        calendars,
        data: pipeRes,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to authenticate with GoHighLevel API.',
      };
    }
  }

  /**
   * Fetch calendars for this location
   */
  async getCalendars(): Promise<any[]> {
    try {
      const res = await this.request<any>(`/calendars/?locationId=${this.locationId}`);
      return res.calendars || [];
    } catch (err: any) {
      if (err?.message?.includes('scope') || err?.message?.includes('401')) {
        console.info(`[GHL Info] Calendars scope not granted for location ${this.locationId} - calendar sync skipped.`);
      } else {
        console.warn(`Could not fetch calendars for location ${this.locationId}:`, err?.message || err);
      }
      return [];
    }
  }

  /**
   * Fetch pipelines and stages for this location
   */
  async getPipelines(): Promise<any[]> {
    const res = await this.request<any>(`/opportunities/pipelines?locationId=${this.locationId}`);
    return res.pipelines || [];
  }

  /**
   * Fetch users for this location
   */
  async getUsers(): Promise<any[]> {
    const res = await this.request<any>(`/users/?locationId=${this.locationId}`);
    return res.users || [];
  }

  /**
   * Fetch calendar events / appointments for this location
   */
  async getCalendarEvents(startTime?: string, endTime?: string): Promise<any[]> {
    try {
      const now = new Date();
      // default: past 30 days to upcoming 30 days
      const start = startTime || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endTime || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await this.request<any>(`/calendars/events?locationId=${this.locationId}&startTime=${start}&endTime=${end}`);
      return res.events || res.appointments || [];
    } catch (err: any) {
      if (err?.message?.includes('scope') || err?.message?.includes('401')) {
        console.info(`[GHL Info] Calendars events scope not granted for location ${this.locationId} - appointments sync skipped.`);
      } else {
        console.warn(`Could not fetch calendar events for location ${this.locationId}:`, err?.message || err);
      }
      return [];
    }
  }

  /**
   * Search tasks for this location using official POST /locations/{locationId}/tasks/search
   */
  async searchTasks(completed = false, limit = 100, skip = 0): Promise<any[]> {
    try {
      const res = await this.request<any>(`/locations/${this.locationId}/tasks/search`, {
        method: 'POST',
        body: JSON.stringify({
          completed,
          limit,
          skip,
        }),
      });
      return res.tasks || [];
    } catch (err) {
      console.warn(`Could not search tasks for location ${this.locationId}:`, err);
      return [];
    }
  }

  /**
   * Search opportunities
   */
  async searchOpportunities(limit = 100, status?: string): Promise<any[]> {
    try {
      let query = `/opportunities/search?location_id=${this.locationId}&limit=${limit}`;
      if (status) query += `&status=${status}`;
      const res = await this.request<any>(query);
      return res.opportunities || [];
    } catch (err) {
      console.warn(`Could not search opportunities for location ${this.locationId}:`, err);
      return [];
    }
  }
}

/**
 * Creates an authenticated GhlClient instance by loading and decrypting credentials from DB.
 */
export async function getGhlClientForLocation(locationId: string): Promise<GhlClient> {
  const loc = await prisma.ghlLocation.findUnique({
    where: { locationId },
  });

  if (!loc) {
    throw new Error(`Location ${locationId} not found in database.`);
  }

  const decryptedKey = decryptString(loc.encryptedPrivateKey);
  if (!decryptedKey) {
    throw new Error(`Private key for location ${locationId} could not be decrypted.`);
  }

  return new GhlClient({
    locationId,
    privateKey: decryptedKey,
  });
}
