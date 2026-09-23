import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const addresses = await db.address.findMany({
      where: { userId: payload.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ success: true, data: addresses })
  } catch (error) {
    console.error('Get Addresses Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { label, fullAddress, area, landmark, pincode, latitude, longitude, isDefault } = body

    if (!label || !fullAddress || !area || !pincode) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: payload.userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await db.address.create({
      data: {
        userId: payload.userId,
        label,
        fullAddress,
        area,
        landmark,
        pincode,
        latitude,
        longitude,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ success: true, data: address })
  } catch (error) {
    console.error('Create Address Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create address' }, { status: 500 })
  }
}