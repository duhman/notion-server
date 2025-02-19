import { Client } from '@notionhq/client';
import { RateLimiter } from '../utils/rate-limiter.js';
import { Cache } from '../utils/cache.js';
import { env } from './environment.js';
export class NotionClientWrapper {
    client;
    rateLimiter;
    cache;
    constructor() {
        this.client = new Client({ auth: env.NOTION_API_KEY });
        this.rateLimiter = new RateLimiter(env.RATE_LIMIT_REQUESTS, env.RATE_LIMIT_INTERVAL_MS);
        this.cache = new Cache(env.CACHE_TTL_MS);
    }
    async request(key, operation) {
        if (env.ENABLE_CACHING) {
            const cached = this.cache.get(key);
            if (cached)
                return cached;
        }
        await this.rateLimiter.acquire();
        const result = await operation();
        if (env.ENABLE_CACHING) {
            this.cache.set(key, result);
        }
        return result;
    }
    get raw() {
        return this.client;
    }
}
export const notionClient = new NotionClientWrapper();
