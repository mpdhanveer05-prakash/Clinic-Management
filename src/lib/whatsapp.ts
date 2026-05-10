/**
 * WhatsApp Business Cloud API Client
 *
 * Wraps the Meta Cloud API for sending WhatsApp messages.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a text message via WhatsApp
 */
export async function sendTextMessage(
  to: string,
  text: string,
): Promise<SendMessageResult> {
  return sendWhatsAppRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'text',
    text: { preview_url: false, body: text },
  });
}

/**
 * Send a template message (required for initiating conversations)
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components: any[] = [],
): Promise<SendMessageResult> {
  return sendWhatsAppRequest({
    messaging_product: 'whatsapp',
    to: normalizePhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}

/**
 * Send an interactive button message (max 3 buttons)
 */
export async function sendButtonMessage(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  headerText?: string,
  footerText?: string,
): Promise<SendMessageResult> {
  const message: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  };

  if (headerText) {
    message.interactive.header = { type: 'text', text: headerText };
  }
  if (footerText) {
    message.interactive.footer = { text: footerText };
  }

  return sendWhatsAppRequest(message);
}

/**
 * Send an interactive list message (menu-style)
 */
export async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[],
  headerText?: string,
  footerText?: string,
): Promise<SendMessageResult> {
  const message: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections,
      },
    },
  };

  if (headerText) {
    message.interactive.header = { type: 'text', text: headerText };
  }
  if (footerText) {
    message.interactive.footer = { text: footerText };
  }

  return sendWhatsAppRequest(message);
}

/**
 * Mark a message as read
 */
export async function markAsRead(messageId: string): Promise<void> {
  await sendWhatsAppRequest({
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  });
}

/**
 * Send appointment confirmation message
 */
export async function sendAppointmentConfirmation(
  to: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
  clinicName: string,
): Promise<SendMessageResult> {
  const text =
    `✅ *Appointment Confirmed*\n\n` +
    `Dear ${patientName},\n\n` +
    `Your appointment has been booked:\n` +
    `👨‍⚕️ *Doctor:* Dr. ${doctorName}\n` +
    `📅 *Date:* ${date}\n` +
    `🕐 *Time:* ${time}\n` +
    `🏥 *Clinic:* ${clinicName}\n\n` +
    `Reply *YES* to confirm or *RESCHEDULE* to change.`;

  return sendTextMessage(to, text);
}

/**
 * Send appointment reminder
 */
export async function sendAppointmentReminder(
  to: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
  hoursUntil: number,
): Promise<SendMessageResult> {
  const urgency = hoursUntil <= 2 ? '🔔' : '📋';
  const text =
    `${urgency} *Appointment Reminder*\n\n` +
    `Hi ${patientName},\n\n` +
    `Your appointment is ${hoursUntil <= 2 ? 'in 2 hours' : 'tomorrow'}:\n` +
    `👨‍⚕️ Dr. ${doctorName}\n` +
    `📅 ${date} at ${time}\n\n` +
    `Reply *CONFIRM* or *CANCEL*.`;

  return sendButtonMessage(to, text, [
    { id: 'confirm_apt', title: 'Confirm ✅' },
    { id: 'cancel_apt', title: 'Cancel ❌' },
    { id: 'reschedule_apt', title: 'Reschedule 📅' },
  ]);
}

/**
 * Send post-treatment follow-up
 */
export async function sendFollowUp(
  to: string,
  patientName: string,
  procedure: string,
  daysSinceTreatment: number,
): Promise<SendMessageResult> {
  let text: string;

  if (daysSinceTreatment === 1) {
    text =
      `Hi ${patientName} 🦷\n\n` +
      `How are you feeling after your *${procedure}* yesterday?\n\n` +
      `If you experience any unusual pain or discomfort, please reply to this message or call us.`;
  } else if (daysSinceTreatment <= 3) {
    text =
      `Hi ${patientName},\n\n` +
      `Just checking in — how is your recovery going after the *${procedure}*?\n\n` +
      `Remember to follow the aftercare instructions provided by your doctor.`;
  } else {
    text =
      `Hi ${patientName},\n\n` +
      `It's been a week since your *${procedure}*. We hope you're feeling great! 😊\n\n` +
      `Would you like to rate your experience?`;
  }

  return sendButtonMessage(to, text, [
    { id: 'feeling_good', title: "I'm fine 👍" },
    { id: 'need_help', title: 'Need help 🆘' },
  ]);
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function sendWhatsAppRequest(payload: any): Promise<SendMessageResult> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn('[WhatsApp] API not configured — skipping message send');
    return {
      success: false,
      error: 'WhatsApp API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.',
    };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] API Error:', data);
      return {
        success: false,
        error: data.error?.message || 'WhatsApp API request failed',
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('[WhatsApp] Request Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

function normalizePhone(phone: string): string {
  // Remove + prefix and any spaces/dashes
  return phone.replace(/[+\s-]/g, '');
}
