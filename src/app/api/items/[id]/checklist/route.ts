import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checklistItems, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'

// Get all checklist items for an item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params

    const items = await db
      .select({
        id: checklistItems.id,
        title: checklistItems.title,
        isCompleted: checklistItems.isCompleted,
        position: checklistItems.position,
        createdById: checklistItems.createdById,
        createdByName: users.name,
        createdAt: checklistItems.createdAt,
      })
      .from(checklistItems)
      .leftJoin(users, eq(checklistItems.createdById, users.id))
      .where(eq(checklistItems.itemId, itemId))
      .orderBy(checklistItems.position, checklistItems.createdAt)

    return NextResponse.json({ checklistItems: items })
  } catch (error) {
    console.error('Error fetching checklist items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new checklist item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: itemId } = await params
    const { title, position } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get the highest position if not provided
    let checklistPosition = position
    if (checklistPosition === undefined) {
      const [lastItem] = await db
        .select({ position: checklistItems.position })
        .from(checklistItems)
        .where(eq(checklistItems.itemId, itemId))
        .orderBy(checklistItems.position)
        .limit(1)

      checklistPosition = lastItem ? lastItem.position + 1 : 0
    }

    const [item] = await db
      .insert(checklistItems)
      .values({
        itemId,
        title: title.trim(),
        position: checklistPosition,
        createdById: userId,
      })
      .returning()

    // Get the item with user name
    const [itemWithUser] = await db
      .select({
        id: checklistItems.id,
        title: checklistItems.title,
        isCompleted: checklistItems.isCompleted,
        position: checklistItems.position,
        createdById: checklistItems.createdById,
        createdByName: users.name,
        createdAt: checklistItems.createdAt,
      })
      .from(checklistItems)
      .leftJoin(users, eq(checklistItems.createdById, users.id))
      .where(eq(checklistItems.id, item.id))

    return NextResponse.json({ checklistItem: itemWithUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
