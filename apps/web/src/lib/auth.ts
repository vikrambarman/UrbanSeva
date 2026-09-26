// lib/auth.ts

import jwt, { SignOptions } from 'jsonwebtoken'
import { redis } from './redis'
import { NextRequest } from 'next/server'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
    userId: string
    role: "CUSTOMER" | "PROVIDER" | "ADMIN" | "SUPER_ADMIN"
    phone: string
    providerId?: string
}

function parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms])$/)
    if (!match) return 604800 // default 7 days
    
    const value = parseInt(match[1])
    const unit = match[2]
    
    switch (unit) {
        case 'd': return value * 24 * 60 * 60
        case 'h': return value * 60 * 60
        case 'm': return value * 60
        case 's': return value
        default: return 604800
    }
}

export function generateToken(payload: JWTPayload): string {
    const options: SignOptions = { 
        expiresIn: parseExpiry(JWT_EXPIRES_IN)
    }
    return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
        console.error('Token verification failed:', error)
        return null
    }
}

// ✅ Admin auth helper
export async function getAdminUser(request: NextRequest): Promise<JWTPayload | null> {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload) return null
    if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') return null

    return payload
}

// ✅ Enhanced Provider auth helper
export async function getProviderUser(request: NextRequest): Promise<{
    userId: string
    providerId: string
    role: string
    phone: string
} | null> {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No auth header found')
            return null
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)
        
        if (!payload) {
            console.log('❌ Invalid token')
            return null
        }

        if (payload.role !== 'PROVIDER') {
            console.log('❌ Not a provider role:', payload.role)
            return null
        }

        // Verify provider exists and is active
        const provider = await db.provider.findFirst({
            where: { userId: payload.userId }
        })

        if (!provider) {
            console.log('❌ Provider not found for userId:', payload.userId)
            return null
        }

        if (provider.status !== 'APPROVED') {
            console.log('❌ Provider not approved:', provider.status)
            return null
        }

        return {
            userId: payload.userId,
            providerId: provider.id,
            role: payload.role,
            phone: payload.phone
        }
    } catch (error) {
        console.error('Get Provider User Error:', error)
        return null
    }
}

// Redis session functions
export async function createSession(userId: string, token: string) {
    const sessionKey = `session:${userId}`
    const sessionData = {
        token,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
    }
    await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', 7 * 24 * 60 * 60)
}

export async function getSession(userId: string) {
    const sessionKey = `session:${userId}`
    const sessionData = await redis.get(sessionKey)
    if (!sessionData) return null
    return JSON.parse(sessionData)
}

export async function deleteSession(userId: string) {
    const sessionKey = `session:${userId}`
    await redis.del(sessionKey)
}

export async function updateSessionActivity(userId: string) {
    const sessionKey = `session:${userId}`
    const sessionData = await redis.get(sessionKey)
    if (sessionData) {
        const session = JSON.parse(sessionData)
        session.lastActivity = new Date().toISOString()
        await redis.set(sessionKey, JSON.stringify(session), 'EX', 7 * 24 * 60 * 60)
    }
}