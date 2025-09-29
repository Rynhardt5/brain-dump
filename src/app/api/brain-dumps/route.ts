import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainDumps, brainDumpCollaborators, users } from '@/lib/db/schema'
import { eq, or, count, sql } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'

// Get all brain dumps for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get brain dumps owned by user, shared with user, or public brain dumps
    const userBrainDumps = await db
      .select({
        id: brainDumps.id,
        name: brainDumps.name,
        description: brainDumps.description,
        isPublic: brainDumps.isPublic,
        ownerId: brainDumps.ownerId,
        createdAt: brainDumps.createdAt,
        updatedAt: brainDumps.updatedAt,
        ownerName: users.name,
        isOwner: sql<boolean>`CASE WHEN ${brainDumps.ownerId} = ${userId} THEN true ELSE false END`,
        collaboratorCount: count(brainDumpCollaborators.userId),
      })
      .from(brainDumps)
      .leftJoin(users, eq(brainDumps.ownerId, users.id))
      .leftJoin(
        brainDumpCollaborators,
        eq(brainDumps.id, brainDumpCollaborators.brainDumpId)
      )
      .where(
        or(
          eq(brainDumps.ownerId, userId), // Owned by user
          eq(brainDumpCollaborators.userId, userId), // Shared with user
          eq(brainDumps.isPublic, true) // Public brain dumps
        )
      )
      .groupBy(
        brainDumps.id,
        brainDumps.name,
        brainDumps.description,
        brainDumps.isPublic,
        brainDumps.ownerId,
        brainDumps.createdAt,
        brainDumps.updatedAt,
        users.name
      )

    return NextResponse.json({ brainDumps: userBrainDumps })
  } catch (error) {
    console.error('Error fetching brain dumps:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new brain dump
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const { name, description, isPublic } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const [brainDump] = await db
      .insert(brainDumps)
      .values({
        name,
        description,
        isPublic: isPublic || false,
        ownerId: userId,
      })
      .returning()

    return NextResponse.json({ brainDump }, { status: 201 })
  } catch (error) {
    console.error('Error creating brain dump:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
