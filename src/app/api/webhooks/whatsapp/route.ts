import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'dentalflow-webhook-verify-token';

// GET /api/webhooks/whatsapp — Webhook verification (required by Meta)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST /api/webhooks/whatsapp — Incoming messages from WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta sends webhook events in this structure
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const metadata = value.metadata;
        const messages = value.messages || [];
        const statuses = value.statuses || [];

        // Handle incoming messages
        for (const message of messages) {
          await handleIncomingMessage(message, metadata);
        }

        // Handle message status updates (sent, delivered, read)
        for (const status of statuses) {
          await handleStatusUpdate(status);
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function handleIncomingMessage(
  message: any,
  metadata: any,
) {
  const senderPhone = message.from; // e.g., "919876543210"
  const messageType = message.type; // text, image, document, etc.
  const timestamp = new Date(parseInt(message.timestamp) * 1000);
  const waMessageId = message.id;

  // Normalize phone number to include +
  const normalizedPhone = senderPhone.startsWith('+') ? senderPhone : `+${senderPhone}`;

  let messageText = '';
  if (messageType === 'text') {
    messageText = message.text?.body || '';
  } else if (messageType === 'interactive') {
    // Button or list replies
    messageText =
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      '';
  } else if (messageType === 'image' || messageType === 'document') {
    messageText = `[${messageType}] ${message[messageType]?.caption || 'Media received'}`;
  } else {
    messageText = `[${messageType}] Unsupported message type`;
  }

  console.log(`[WhatsApp] Message from ${normalizedPhone}: ${messageText}`);

  // Find or create patient by phone number
  // We look across all clinics — in a multi-clinic setup, this should be scoped
  let patient = await prisma.patient.findUnique({
    where: { phone: normalizedPhone },
  });

  // Find or create conversation
  let conversation = patient
    ? await prisma.conversation.findFirst({
        where: {
          patientId: patient.id,
          channel: 'WHATSAPP',
          status: { in: ['ACTIVE', 'ESCALATED'] },
        },
        orderBy: { updatedAt: 'desc' },
      })
    : null;

  if (!conversation) {
    // If no patient exists, we need to create one as a lead
    if (!patient) {
      // Find the first clinic (in production, map phone to clinic)
      const clinic = await prisma.clinic.findFirst();
      if (!clinic) {
        console.error('[WhatsApp] No clinic found to assign patient');
        return;
      }

      patient = await prisma.patient.create({
        data: {
          name: `WhatsApp User ${normalizedPhone.slice(-4)}`,
          phone: normalizedPhone,
          source: 'WHATSAPP',
          clinicId: clinic.id,
        },
      });
    }

    // Create new conversation
    conversation = await prisma.conversation.create({
      data: {
        patientId: patient.id,
        channel: 'WHATSAPP',
        status: 'ACTIVE',
        messages: [],
      },
    });
  }

  // Append message to conversation
  const existingMessages = (conversation.messages as any[]) || [];
  const newMessage = {
    id: waMessageId,
    from: 'patient',
    text: messageText,
    type: messageType,
    timestamp: timestamp.toISOString(),
    waMessageId,
  };

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      messages: [...existingMessages, newMessage],
      updatedAt: new Date(),
    },
  });

  // TODO: Phase 4 — pass message to AI chatbot for auto-response
  // TODO: Phase 5 — check for appointment confirmation replies
}

async function handleStatusUpdate(status: any) {
  // Log delivery/read status for analytics
  console.log(
    `[WhatsApp] Status update: ${status.id} → ${status.status} (${status.recipient_id})`,
  );
}
