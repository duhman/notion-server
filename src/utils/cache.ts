interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private readonly ttl: number;

  constructor(ttlMs: number) {
    this.ttl = ttlMs;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.store.clear();
  }
}
