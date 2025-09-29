import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainDumps, brainDumpCollaborators } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';

// Get user permissions for a brain dump
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
      .where(eq(brainDumps.id, brainDumpId));

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found' },
        { status: 404 }
      );
    }

    // If user is the owner, they have all permissions
    if (brainDump.ownerId === userId) {
      return NextResponse.json({
        canEdit: true,
        canVote: true,
        isOwner: true
      });
    }

    // Check if user is a collaborator
    const [collaboration] = await db
      .select()
      .from(brainDumpCollaborators)
      .where(
        and(
          eq(brainDumpCollaborators.brainDumpId, brainDumpId),
          eq(brainDumpCollaborators.userId, userId)
        )
      );

    if (collaboration) {
      return NextResponse.json({
        canEdit: collaboration.canEdit,
        canVote: collaboration.canVote,
        isOwner: false
      });
    }

    // User has no access
    return NextResponse.json({
      canEdit: false,
      canVote: false,
      isOwner: false
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
