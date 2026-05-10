import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendTextMessage } from '@/lib/whatsapp';

// GET /api/conversations/[id] — Get single conversation with full messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const clinicId = (session.user as any).clinicId;

    const conversation = await prisma.conversation.findFirst({
      where: { id, patient: { clinicId } },
      include: {
        patient: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { message: 'Conversation not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// POST /api/conversations/[id] — Send a reply message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const clinicId = (session.user as any).clinicId;
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Message text is required', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, patient: { clinicId } },
      include: { patient: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { message: 'Conversation not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    // Send via WhatsApp
    const result = await sendTextMessage(conversation.patient.phone, text.trim());

    // Append to conversation messages regardless of send success
    const existingMessages = (conversation.messages as any[]) || [];
    const newMessage = {
      id: result.messageId || `manual-${Date.now()}`,
      from: 'clinic',
      text: text.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      sentBy: session.user.name || 'Staff',
      delivered: result.success,
    };

    await prisma.conversation.update({
      where: { id },
      data: {
        messages: [...existingMessages, newMessage],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: newMessage,
        whatsappSent: result.success,
        whatsappError: result.error,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// PUT /api/conversations/[id] — Update conversation status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const clinicId = (session.user as any).clinicId;
    const body = await request.json();

    const existing = await prisma.conversation.findFirst({
      where: { id, patient: { clinicId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Conversation not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    const updateData: any = {};
    if (body.status) updateData.status = body.status;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
