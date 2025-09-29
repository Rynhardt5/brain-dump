import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainDumpItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const { itemId } = await params;
    const body = await request.json();
    
    // Update the item
    const [updatedItem] = await db
      .update(brainDumpItems)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(brainDumpItems.id, itemId))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
