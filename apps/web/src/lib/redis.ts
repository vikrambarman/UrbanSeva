import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null
      return Math.min(times * 200, 1000)
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

// OTP helpers
export const setOTP = async (phone: string, otp: string): Promise<void> => {
  await redis.setex(`otp:${phone}`, 300, otp)
}

export const getOTP = async (phone: string): Promise<string | null> => {
  return redis.get(`otp:${phone}`)
}

export const deleteOTP = async (phone: string): Promise<void> => {
  await redis.del(`otp:${phone}`)
}

// Session helpers
export const setSession = async (
  token: string,
  data: object,
  expirySeconds = 604800
): Promise<void> => {
  await redis.setex(`session:${token}`, expirySeconds, JSON.stringify(data))
}

export const getSession = async (token: string): Promise<object | null> => {
  const data = await redis.get(`session:${token}`)
  return data ? JSON.parse(data) : null
}

export const deleteSession = async (token: string): Promise<void> => {
  await redis.del(`session:${token}`)
}
