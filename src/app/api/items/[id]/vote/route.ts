import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainDumpItems, brainDumps, brainDumpCollaborators, itemVotes } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';

// Vote on an item's priority
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
    const { id: itemId } = await params;
    const { priority } = await request.json();

    if (!priority || ![1, 2, 3].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be 1 (low), 2 (medium), or 3 (high)' },
        { status: 400 }
      );
    }

    // Check if user has access to vote on this item
    const [item] = await db
      .select({
        itemId: brainDumpItems.id,
        brainDumpId: brainDumpItems.brainDumpId,
        ownerId: brainDumps.ownerId,
        canVote: brainDumpCollaborators.canVote,
      })
      .from(brainDumpItems)
      .leftJoin(brainDumps, eq(brainDumpItems.brainDumpId, brainDumps.id))
      .leftJoin(brainDumpCollaborators, eq(brainDumps.id, brainDumpCollaborators.brainDumpId))
      .where(
        and(
          eq(brainDumpItems.id, itemId),
          or(
            eq(brainDumps.ownerId, userId),
            and(
              eq(brainDumpCollaborators.userId, userId),
              eq(brainDumpCollaborators.canVote, true)
            )
          )
        )
      );

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or access denied' },
        { status: 404 }
      );
    }

    // Insert or update vote
    await db
      .insert(itemVotes)
      .values({
        itemId,
        userId,
        priority,
      })
      .onConflictDoUpdate({
        target: [itemVotes.itemId, itemVotes.userId],
        set: {
          priority,
          votedAt: new Date(),
        },
      });

    return NextResponse.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
