import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comments, users, brainDumpItems } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params

    // Get comments with user names
    const itemComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdById: comments.createdById,
        createdByName: users.name,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .leftJoin(users, eq(comments.createdById, users.id))
      .where(eq(comments.itemId, itemId))
      .orderBy(comments.createdAt)

    return NextResponse.json({ comments: itemComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Create the comment
    const [comment] = await db
      .insert(comments)
      .values({
        itemId,
        content: content.trim(),
        createdById: userId,
      })
      .returning()

    // Get the comment with user name
    const [commentWithUser] = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdById: comments.createdById,
        createdByName: users.name,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .leftJoin(users, eq(comments.createdById, users.id))
      .where(eq(comments.id, comment.id))

    // Update comment count on the item (in case triggers aren't set up yet)
    const [commentCountResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.itemId, itemId))

    await db
      .update(brainDumpItems)
      .set({ commentCount: commentCountResult.count })
      .where(eq(brainDumpItems.id, itemId))

    return NextResponse.json({ comment: commentWithUser })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
