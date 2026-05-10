import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/conversations — List conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const clinicId = (session.user as any).clinicId;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    const where: any = {
      patient: { clinicId },
    };

    if (status && status !== 'all') where.status = status;
    if (channel && channel !== 'all') where.channel = channel;

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
