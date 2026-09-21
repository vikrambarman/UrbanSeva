import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET() {
  const health = {
    success: true,
    app: process.env.NEXT_PUBLIC_APP_NAME || 'ServiceApp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  }

  // Database check
  try {
    await db.$queryRaw`SELECT 1`
    health.services.database = 'connected ✅'
  } catch (error) {
    health.services.database = 'disconnected ❌'
    health.success = false
  }

  // Redis check
  try {
    await redis.ping()
    health.services.redis = 'connected ✅'
  } catch (error) {
    health.services.redis = 'disconnected ❌'
    health.success = false
  }

  return NextResponse.json(health, {
    status: health.success ? 200 : 503,
  })
}
