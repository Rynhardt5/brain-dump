import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainDumps, brainDumpItems, brainDumpCollaborators, itemVotes, users, comments } from '@/lib/db/schema';
import { eq, or, and, avg, countDistinct } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';

// Get all items for a brain dump with voting information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;
    const { id: brainDumpId } = await params;

    // First, check if the brain dump exists and is public
    const [publicBrainDump] = await db
      .select()
      .from(brainDumps)
      .where(
        and(
          eq(brainDumps.id, brainDumpId),
          eq(brainDumps.isPublic, true)
        )
      );

    // If it's public, allow access regardless of authentication
    if (publicBrainDump) {
      // Continue to fetch items below
    } else {
      // If not public, require authentication and check access
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if authenticated user has access to this private brain dump
      const [brainDump] = await db
        .select()
        .from(brainDumps)
        .leftJoin(brainDumpCollaborators, eq(brainDumps.id, brainDumpCollaborators.brainDumpId))
        .where(
          and(
            eq(brainDumps.id, brainDumpId),
            or(
              eq(brainDumps.ownerId, userId),
              eq(brainDumpCollaborators.userId, userId)
            )
          )
        );

      if (!brainDump) {
        return NextResponse.json(
          { error: 'Brain dump not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Get items with voting and comment information
    const items = await db
      .select({
        id: brainDumpItems.id,
        title: brainDumpItems.title,
        description: brainDumpItems.description,
        isCompleted: brainDumpItems.isCompleted,
        createdById: brainDumpItems.createdById,
        createdAt: brainDumpItems.createdAt,
        updatedAt: brainDumpItems.updatedAt,
        createdByName: users.name,
        avgVotePriority: avg(itemVotes.priority),
        voteCount: countDistinct(itemVotes.userId),
        commentCount: countDistinct(comments.id),
      })
      .from(brainDumpItems)
      .leftJoin(users, eq(brainDumpItems.createdById, users.id))
      .leftJoin(itemVotes, eq(brainDumpItems.id, itemVotes.itemId))
      .leftJoin(comments, eq(brainDumpItems.id, comments.itemId))
      .where(eq(brainDumpItems.brainDumpId, brainDumpId))
      .groupBy(
        brainDumpItems.id,
        brainDumpItems.title,
        brainDumpItems.description,
        brainDumpItems.isCompleted,
        brainDumpItems.createdById,
        brainDumpItems.createdAt,
        brainDumpItems.updatedAt,
        users.name
      )
      .orderBy(brainDumpItems.createdAt);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching brain dump items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new item in a brain dump
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
    const { title, description, priority } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if user has access to this brain dump
    const [brainDump] = await db
      .select()
      .from(brainDumps)
      .leftJoin(brainDumpCollaborators, eq(brainDumps.id, brainDumpCollaborators.brainDumpId))
      .where(
        and(
          eq(brainDumps.id, brainDumpId),
          or(
            eq(brainDumps.ownerId, userId),
            and(
              eq(brainDumpCollaborators.userId, userId),
              eq(brainDumpCollaborators.canEdit, true)
            )
          )
        )
      );

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      );
    }

    // Create the item (without priority field)
    const [item] = await db
      .insert(brainDumpItems)
      .values({
        brainDumpId,
        title: title.trim(),
        description: description?.trim() || '',
        createdById: userId,
      })
      .returning();

    // Create initial vote for the item with the selected priority
    if (priority) {
      await db
        .insert(itemVotes)
        .values({
          itemId: item.id,
          userId,
          priority: priority,
        });
    }

    // Get the complete item data with vote and comment information
    const [completeItem] = await db
      .select({
        id: brainDumpItems.id,
        title: brainDumpItems.title,
        description: brainDumpItems.description,
        isCompleted: brainDumpItems.isCompleted,
        createdById: brainDumpItems.createdById,
        createdAt: brainDumpItems.createdAt,
        updatedAt: brainDumpItems.updatedAt,
        createdByName: users.name,
        avgVotePriority: avg(itemVotes.priority),
        voteCount: countDistinct(itemVotes.userId),
        commentCount: countDistinct(comments.id),
      })
      .from(brainDumpItems)
      .leftJoin(users, eq(brainDumpItems.createdById, users.id))
      .leftJoin(itemVotes, eq(brainDumpItems.id, itemVotes.itemId))
      .leftJoin(comments, eq(brainDumpItems.id, comments.itemId))
      .where(eq(brainDumpItems.id, item.id))
      .groupBy(
        brainDumpItems.id,
        brainDumpItems.title,
        brainDumpItems.description,
        brainDumpItems.isCompleted,
        brainDumpItems.createdById,
        brainDumpItems.createdAt,
        brainDumpItems.updatedAt,
        users.name
      );

    return NextResponse.json({ item: completeItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating brain dump item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
