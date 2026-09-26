import { redis } from './redis'

interface CacheOptions {
    key: string
    ttl?: number // in seconds, default 300 (5 minutes)
    fn: () => Promise<any>
}

export async function cached<T>({ key, ttl = 300, fn }: CacheOptions): Promise<T> {
    try {
        // Try to get from cache
        const cachedData = await redis.get(key)
        if (cachedData) {
            return JSON.parse(cachedData) as T
        }

        // If not in cache, execute function
        const data = await fn()

        // Store in cache
        await redis.set(key, JSON.stringify(data), 'EX', ttl)

        return data
    } catch (error) {
        console.error('Cache error:', error)
        // If cache fails, still return the data
        return fn()
    }
}

// Helper to invalidate cache
export async function invalidateCache(pattern: string) {
    try {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    } catch (error) {
        console.error('Cache invalidation error:', error)
    }
}