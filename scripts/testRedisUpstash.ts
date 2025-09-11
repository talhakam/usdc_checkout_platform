import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../apps/web/.env.local' });

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!redisUrl || !redisToken) {
  throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env.local');
}

const redis = new Redis({ url: redisUrl, token: redisToken });

async function testRedis() {
  try {
    // Set a key
    await redis.set('nextjs_test_key', 'Hello from Next.js + Upstash!');
    // Get the key
    const value = await redis.get('nextjs_test_key');
    console.log('Redis value:', value);
    // Delete the key
    await redis.del('nextjs_test_key');
    console.log('Test key deleted.');
    process.exit(0);
  } catch (error) {
    console.error('Redis test failed:', error);
    process.exit(1);
  }
}

testRedis();
