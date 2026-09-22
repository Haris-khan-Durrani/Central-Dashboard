interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class FastMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Get cached item if not expired
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Set cached item with TTL in seconds (default 15s to match dashboard ticker)
   */
  set<T>(key: string, value: T, ttlSeconds = 15): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate all keys matching locationId prefix
   */
  invalidateLocation(locationId: string): void {
    const prefix = `loc:${locationId}:`;
    const keys = Array.from(this.store.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }
}

export const fastCache = new FastMemoryCache();
