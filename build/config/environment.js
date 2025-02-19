import { z } from 'zod';
import dotenv from 'dotenv';
const envSchema = z.object({
    NOTION_API_KEY: z.string().min(1),
    RATE_LIMIT_REQUESTS: z.string().transform(Number).default('50'),
    RATE_LIMIT_INTERVAL_MS: z.string().transform(Number).default('60000'),
    ENABLE_CACHING: z.string().transform(val => val === 'true').default('true'),
    CACHE_TTL_MS: z.string().transform(Number).default('300000'), // 5 minutes
});
dotenv.config();
export const env = envSchema.parse(process.env);
