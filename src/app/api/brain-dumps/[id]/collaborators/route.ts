import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainDumps, brainDumpCollaborators, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'

// Get collaborators for a brain dump
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: brainDumpId } = await params

    // Check if user owns this brain dump
    const [brainDump] = await db
      .select()
      .from(brainDumps)
      .where(
        and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId))
      )

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      )
    }

    // Get collaborators
    const collaborators = await db
      .select({
        userId: brainDumpCollaborators.userId,
        userName: users.name,
        userEmail: users.email,
        canEdit: brainDumpCollaborators.canEdit,
        canVote: brainDumpCollaborators.canVote,
        invitedAt: brainDumpCollaborators.invitedAt,
      })
      .from(brainDumpCollaborators)
      .leftJoin(users, eq(brainDumpCollaborators.userId, users.id))
      .where(eq(brainDumpCollaborators.brainDumpId, brainDumpId))

    return NextResponse.json({ collaborators })
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json({ error: 'Internal server error' })
  }
}

// Invite collaborator
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
    const { id: brainDumpId } = await params
    const { collaboratorUserId, canEdit, canVote } = await request.json()

    // Check if user owns this brain dump
    const [brainDump] = await db
      .select()
      .from(brainDumps)
      .where(
        and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId))
      )

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      )
    }

    // Update collaborator permissions
    const [updatedCollaborator] = await db
      .update(brainDumpCollaborators)
      .set({
        canEdit: canEdit !== undefined ? canEdit : undefined,
        canVote: canVote !== undefined ? canVote : undefined,
      })
      .where(
        and(
          eq(brainDumpCollaborators.userId, collaboratorUserId),
          eq(brainDumpCollaborators.brainDumpId, brainDumpId)
        )
      )
      .returning()

    return NextResponse.json({ collaborator: updatedCollaborator })
  } catch (error) {
    console.error('Error updating collaborator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update collaborator permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: brainDumpId } = await params
    const { collaboratorUserId, canEdit, canVote } = await request.json()

    // Check if user owns this brain dump
    const [brainDump] = await db
      .select()
      .from(brainDumps)
      .where(
        and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId))
      )

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      )
    }

    // Update collaborator permissions
    const [updatedCollaborator] = await db
      .update(brainDumpCollaborators)
      .set({
        canEdit: canEdit !== undefined ? canEdit : undefined,
        canVote: canVote !== undefined ? canVote : undefined,
      })
      .where(
        and(
          eq(brainDumpCollaborators.userId, collaboratorUserId),
          eq(brainDumpCollaborators.brainDumpId, brainDumpId)
        )
      )
      .returning()

    return NextResponse.json({ collaborator: updatedCollaborator })
  } catch (error) {
    console.error('Error updating collaborator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id: brainDumpId } = await params
    const { collaboratorUserId } = await request.json()

    // Check if user owns this brain dump
    const [brainDump] = await db
      .select()
      .from(brainDumps)
      .where(
        and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId))
      )

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      )
    }

    // Remove collaborator
    await db
      .delete(brainDumpCollaborators)
      .where(
        and(
          eq(brainDumpCollaborators.userId, collaboratorUserId),
          eq(brainDumpCollaborators.brainDumpId, brainDumpId)
        )
      )

    return NextResponse.json({ message: 'Collaborator removed successfully' })
  } catch (error) {
    console.error('Error removing collaborator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
