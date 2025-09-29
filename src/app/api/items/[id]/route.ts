import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainDumpItems, brainDumps, brainDumpCollaborators } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';

// Delete an item
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

    const { id: itemId } = await params;

    // Check if user has permission to delete this item
    // They can delete if they created the item OR they own the brain dump
    const [item] = await db
      .select({
        itemId: brainDumpItems.id,
        itemCreatedById: brainDumpItems.createdById,
        brainDumpId: brainDumpItems.brainDumpId,
        brainDumpOwnerId: brainDumps.ownerId,
      })
      .from(brainDumpItems)
      .leftJoin(brainDumps, eq(brainDumpItems.brainDumpId, brainDumps.id))
      .where(eq(brainDumpItems.id, itemId));

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check permissions: user created the item OR user owns the brain dump
    const canDelete = item.itemCreatedById === userId || item.brainDumpOwnerId === userId;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this item' },
        { status: 403 }
      );
    }

    // Delete the item (this will cascade delete related votes and comments)
    await db.delete(brainDumpItems).where(eq(brainDumpItems.id, itemId));

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
