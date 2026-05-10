'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Search,
  Filter,
  CheckCheck,
  Clock,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Message {
  id: string;
  from: 'patient' | 'clinic';
  text: string;
  type: string;
  timestamp: string;
  sentBy?: string;
  delivered?: boolean;
}

interface Conversation {
  id: string;
  channel: string;
  status: string;
  messages: Message[];
  updatedAt: string;
  patient: {
    id: string;
    name: string;
    phone: string;
  };
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  ESCALATED: 'bg-red-100 text-red-700',
  RESOLVED: 'bg-gray-100 text-gray-600',
  CLOSED: 'bg-gray-100 text-gray-500',
};

const statusIcons: Record<string, typeof MessageSquare> = {
  ACTIVE: MessageSquare,
  ESCALATED: AlertTriangle,
  RESOLVED: CheckCheck,
  CLOSED: Clock,
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/conversations?${params}`);
      const result = await res.json();

      if (result.success) {
        setConversations(result.data);
        // If selected convo exists, update it
        if (selectedConvo) {
          const updated = result.data.find((c: Conversation) => c.id === selectedConvo.id);
          if (updated) setSelectedConvo(updated);
        }
      }
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, selectedConvo]);

  useEffect(() => {
    fetchConversations();
    // Poll every 10 seconds for new messages
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConvo?.messages]);

  const handleSendReply = async () => {
    if (!selectedConvo || !replyText.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConvo.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });

      const result = await res.json();

      if (result.success) {
        if (!result.data.whatsappSent) {
          toast.warning('Message saved but WhatsApp delivery failed — API not configured');
        } else {
          toast.success('Message sent');
        }
        setReplyText('');
        fetchConversations();
      } else {
        toast.error(result.error?.message || 'Failed to send');
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (conversationId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Conversation marked as ${newStatus.toLowerCase()}`);
        fetchConversations();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredConversations = conversations.filter((convo) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      convo.patient.name.toLowerCase().includes(q) ||
      convo.patient.phone.includes(q)
    );
  });

  const getLastMessage = (convo: Conversation): string => {
    const msgs = convo.messages as Message[];
    if (!msgs || msgs.length === 0) return 'No messages';
    const last = msgs[msgs.length - 1];
    return last.text.length > 50 ? last.text.substring(0, 50) + '...' : last.text;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">WhatsApp conversations with patients</p>
      </div>

      <div className="flex h-[calc(100vh-200px)] gap-4">
        {/* Conversation List */}
        <Card className="w-full max-w-[380px] border shadow-sm flex flex-col">
          {/* Search & Filter */}
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ESCALATED">Escalated</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 border-b">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Conversations appear when patients message via WhatsApp
                </p>
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const StatusIcon = statusIcons[convo.status] || MessageSquare;
                const isSelected = selectedConvo?.id === convo.id;

                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {convo.patient.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{convo.patient.name}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(convo.updatedAt), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {getLastMessage(convo)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${statusColors[convo.status]}`}>
                            <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                            {convo.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Phone className="h-2.5 w-2.5" />
                            {convo.patient.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 border shadow-sm flex flex-col">
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                    {selectedConvo.patient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedConvo.patient.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedConvo.patient.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedConvo.status}
                    onValueChange={(val) => handleStatusChange(selectedConvo.id, val)}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ESCALATED">Escalated</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {((selectedConvo.messages as Message[]) || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from === 'clinic' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        msg.from === 'clinic'
                          ? 'gradient-primary text-white rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${
                        msg.from === 'clinic' ? 'justify-end' : ''
                      }`}>
                        <span className={`text-[10px] ${
                          msg.from === 'clinic' ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.timestamp), 'h:mm a')}
                        </span>
                        {msg.from === 'clinic' && (
                          <CheckCheck className={`h-3 w-3 ${
                            msg.delivered ? 'text-white/90' : 'text-white/50'
                          }`} />
                        )}
                      </div>
                      {msg.sentBy && msg.from === 'clinic' && (
                        <p className="text-[10px] text-white/60 mt-0.5">{msg.sentBy}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    rows={1}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className="resize-none min-h-[40px]"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={isSending || !replyText.trim()}
                    className="gradient-primary text-white hover:opacity-90 shrink-0"
                    size="icon"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">WhatsApp Inbox</h2>
              <p className="text-muted-foreground max-w-sm">
                Select a conversation from the list to view messages and reply to patients.
              </p>
              <div className="mt-6 p-4 rounded-lg bg-muted/50 max-w-sm text-left">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  How it works
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    Patients message your WhatsApp Business number
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    Messages appear here in real-time
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    Reply directly or let AI handle common queries
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
