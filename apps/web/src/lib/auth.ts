import jwt from 'jsonwebtoken'
import { redis } from './redis'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
    userId: string
    role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SUPER_ADMIN'
    phone: string
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
        return null
    }
}

// Store session in Redis
export async function createSession(userId: string, token: string) {
    const sessionKey = `session:${userId}`
    const sessionData = {
        token,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
    }

    await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', 7 * 24 * 60 * 60) // 7 days
}

// Get session from Redis
export async function getSession(userId: string) {
    const sessionKey = `session:${userId}`
    const sessionData = await redis.get(sessionKey)

    if (!sessionData) return null

    return JSON.parse(sessionData)
}

// Delete session (logout)
export async function deleteSession(userId: string) {
    const sessionKey = `session:${userId}`
    await redis.del(sessionKey)
}

// Update session activity
export async function updateSessionActivity(userId: string) {
    const sessionKey = `session:${userId}`
    const sessionData = await redis.get(sessionKey)

    if (sessionData) {
        const session = JSON.parse(sessionData)
        session.lastActivity = new Date().toISOString()
        await redis.set(sessionKey, JSON.stringify(session), 'EX', 7 * 24 * 60 * 60)
    }
}