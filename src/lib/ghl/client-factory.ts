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
   * Tests API connectivity and checks if location credentials are valid.
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Test location endpoint or pipelines endpoint
      const res = await this.request<any>(`/opportunities/pipelines?locationId=${this.locationId}`);
      return {
        success: true,
        message: `Successfully connected to GoHighLevel! Found ${res.pipelines ? res.pipelines.length : 0} pipelines.`,
        data: res,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to authenticate with GoHighLevel API.',
      };
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
