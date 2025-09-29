import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainDumps, brainDumpCollaborators, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';

// Share a brain dump with another user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const { id: brainDumpId } = await params;
    const { email, canEdit, canVote } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user owns this brain dump
    const [brainDump] = await db
      .select()
      .from(brainDumps)
      .where(and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId)));

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      );
    }

    // Find user to share with
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already shared
    const [existingCollaboration] = await db
      .select()
      .from(brainDumpCollaborators)
      .where(
        and(
          eq(brainDumpCollaborators.brainDumpId, brainDumpId),
          eq(brainDumpCollaborators.userId, targetUser.id)
        )
      );

    if (existingCollaboration) {
      return NextResponse.json(
        { error: 'Brain dump already shared with this user' },
        { status: 409 }
      );
    }

    // Add collaborator
    await db.insert(brainDumpCollaborators).values({
      brainDumpId,
      userId: targetUser.id,
      canEdit: canEdit || false,
      canVote: canVote !== false, // Default to true
    });

    return NextResponse.json({
      message: 'Brain dump shared successfully',
      collaborator: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        canEdit: canEdit || false,
        canVote: canVote !== false,
      },
    });
  } catch (error) {
    console.error('Error sharing brain dump:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get collaborators for a brain dump
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const { id: brainDumpId } = await params;

    // Check if user owns this brain dump
    const [brainDump] = await db
      .select()
      .from(brainDumps)
      .where(and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId)));

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      );
    }

    // Get collaborators
    const collaborators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        canEdit: brainDumpCollaborators.canEdit,
        canVote: brainDumpCollaborators.canVote,
        invitedAt: brainDumpCollaborators.invitedAt,
      })
      .from(brainDumpCollaborators)
      .leftJoin(users, eq(brainDumpCollaborators.userId, users.id))
      .where(eq(brainDumpCollaborators.brainDumpId, brainDumpId));

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
