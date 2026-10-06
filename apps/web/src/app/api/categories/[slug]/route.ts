// apps/web/src/app/api/categories/[slug]/route.ts
// CHANGE: API ab ID aur slug dono accept karegi
// CHANGE: Pehle slug se try karega, agar nahi mila toh ID se try karega
// WHY: Provider create/detail pages category ID bhejte hain, lekin API sirf slug expect karti thi.
//      Ab dono se kaam chalega — backward compatibility bhi maintain rahegi.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // CHANGE: Pehle slug se find karo
    let category = await db.category.findUnique({
      where: { slug },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            services: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            }
          }
        },
      },
    })

    // CHANGE: Agar slug se nahi mila, toh ID se try karo
    if (!category) {
      category = await db.category.findUnique({
        where: { id: slug }, // slug param mein ID aa rahi hai
        include: {
          subCategories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              services: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              }
            }
          },
        },
      })
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('Category detail error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}