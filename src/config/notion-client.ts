import { Client } from '@notionhq/client';
import { RateLimiter } from '../utils/rate-limiter';
import { Cache } from '../utils/cache';
import { env } from './environment';

class NotionClientWrapper {
  private client: Client;
  private rateLimiter: RateLimiter;
  private cache: Cache;

  constructor() {
    this.client = new Client({ auth: env.NOTION_API_KEY });
    this.rateLimiter = new RateLimiter(env.RATE_LIMIT_REQUESTS, env.RATE_LIMIT_INTERVAL_MS);
    this.cache = new Cache(env.CACHE_TTL_MS);
  }

  async request<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (env.ENABLE_CACHING) {
      const cached = this.cache.get<T>(key);
      if (cached) return cached;
    }

    await this.rateLimiter.acquire();
    const result = await operation();
    
    if (env.ENABLE_CACHING) {
      this.cache.set(key, result);
    }
    
    return result;
  }

  get raw(): Client {
    return this.client;
  }
}

export const notionClient = new NotionClientWrapper();
