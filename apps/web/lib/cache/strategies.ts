import { CacheManager } from './manager'
import { CACHE_DURATIONS } from './keys'

export class CacheStrategies {
  // Cache-aside pattern
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_DURATIONS.DEFAULT
  ): Promise<T> {
    const cached = await CacheManager.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const fresh = await fetchFn()
    await CacheManager.set(key, fresh, ttl)
    return fresh
  }

  // Write-through cache
  static async setAndCache<T>(
    key: string,
    value: T,
    persistFn: (value: T) => Promise<void>,
    ttl: number = CACHE_DURATIONS.DEFAULT
  ): Promise<void> {
    await persistFn(value)
    await CacheManager.set(key, value, ttl)
  }

  // Cache with tags for bulk invalidation
  static async setWithTags(
    key: string,
    value: unknown,
    tags: string[],
    ttl: number = CACHE_DURATIONS.DEFAULT
  ) {
    await CacheManager.set(key, value, ttl)
    
    // Store reverse mapping for tag-based invalidation
    for (const tag of tags) {
      const tagKey = `tag:${tag}`
      const existingKeys = await CacheManager.get<string[]>(tagKey) || []
      existingKeys.push(key)
      await CacheManager.set(tagKey, existingKeys, ttl)
    }
  }

  static async invalidateByTag(tag: string) {
    const tagKey = `tag:${tag}`
    const keys = await CacheManager.get<string[]>(tagKey)
    
    if (keys && keys.length > 0) {
      await CacheManager.del([tagKey, ...keys])
    }
  }
}