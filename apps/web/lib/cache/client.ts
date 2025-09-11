import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;
export { redis };