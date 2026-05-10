import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">WhatsApp conversations with patients</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-primary/10 mb-4">
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming in Phase 3</h2>
        <p className="text-muted-foreground max-w-md">
          WhatsApp inbox with two-way messaging, AI chatbot conversations, and appointment booking via chat.
        </p>
      </div>
    </div>
  );
}
