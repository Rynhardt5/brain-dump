import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainDumps, brainDumpCollaborators } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';

// Get a specific brain dump
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
      return NextResponse.json({ brainDump: publicBrainDump });
    }

    // If not public, require authentication
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

    return NextResponse.json({ brainDump: brainDump.brain_dumps });
  } catch (error) {
    console.error('Error fetching brain dump:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a brain dump
export async function PATCH(
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
    const { name, description, isPublic } = await request.json();

    // Check if user owns this brain dump
    const [existingBrainDump] = await db
      .select()
      .from(brainDumps)
      .where(and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId)));

    if (!existingBrainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      );
    }

    const [updatedBrainDump] = await db
      .update(brainDumps)
      .set({
        name: name || existingBrainDump.name,
        description: description !== undefined ? description : existingBrainDump.description,
        isPublic: isPublic !== undefined ? isPublic : existingBrainDump.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(brainDumps.id, brainDumpId))
      .returning();

    return NextResponse.json({ brainDump: updatedBrainDump });
  } catch (error) {
    console.error('Error updating brain dump:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a brain dump
export async function DELETE(
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
    const [existingBrainDump] = await db
      .select()
      .from(brainDumps)
      .where(and(eq(brainDumps.id, brainDumpId), eq(brainDumps.ownerId, userId)));

    if (!existingBrainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or access denied' },
        { status: 404 }
      );
    }

    await db.delete(brainDumps).where(eq(brainDumps.id, brainDumpId));

    return NextResponse.json({ message: 'Brain dump deleted successfully' });
  } catch (error) {
    console.error('Error deleting brain dump:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
