import { redis } from './client';
import { CACHE_KEYS, CACHE_DURATIONS } from './keys';

export class CacheManager {
  // Generic cache operations
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (typeof value === 'string') {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }   

  static async set(
    key: string,
    value: any,
    ttl: number = CACHE_DURATIONS.DEFAULT
  ): Promise<boolean> {
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  static async del(key: string | string[]): Promise<boolean> {
    try {
      if (Array.isArray(key)) {
        await Promise.all(key.map(k => redis.del(k)));
      } else {
        await redis.del(key);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Business-specific cache methods
  static async cacheUser(userId: string, userData: any) {
    return this.set(
      CACHE_KEYS.USER(userId),
      userData,
      CACHE_DURATIONS.USER_DATA
    );
  }

  static async getCachedUser(userId: string) {
    return this.get(CACHE_KEYS.USER(userId));
  }

  static async cacheMerchantData(merchantId: string, data: any) {
    return this.set(
      CACHE_KEYS.MERCHANT(merchantId),
      data,
      CACHE_DURATIONS.MERCHANT_DATA
    );
  }

  static async invalidateUserCache(userId: string) {
    const keys = [
      CACHE_KEYS.USER(userId),
      CACHE_KEYS.USER_REWARDS(userId),
      CACHE_KEYS.USER_TRANSACTIONS(userId)
    ];
    return this.del(keys);
  }
}