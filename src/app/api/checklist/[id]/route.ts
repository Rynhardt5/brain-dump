import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checklistItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'

// Update a checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: checklistItemId } = await params
    const body = await request.json()

    // Allow updating title, isCompleted, or position
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.isCompleted !== undefined)
      updateData.isCompleted = body.isCompleted
    if (body.position !== undefined) updateData.position = body.position
    updateData.updatedAt = new Date()

    const [updated] = await db
      .update(checklistItems)
      .set(updateData)
      .where(eq(checklistItems.id, checklistItemId))
      .returning()

    return NextResponse.json({ checklistItem: updated })
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: checklistItemId } = await params

    await db
      .delete(checklistItems)
      .where(eq(checklistItems.id, checklistItemId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
