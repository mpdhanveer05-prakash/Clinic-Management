'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Clock,
  User,
  Stethoscope,
  Phone,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface AppointmentEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    patientName: string;
    patientPhone: string;
    doctorName: string;
    type: string;
    status: string;
    duration: number;
    notes: string | null;
  };
}

interface AppointmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentEvent | null;
  onUpdate: () => void;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pending', icon: Clock, color: 'text-amber-600' },
  { value: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: Stethoscope, color: 'text-blue-600' },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
  { value: 'NO_SHOW', label: 'No Show', icon: AlertTriangle, color: 'text-orange-600' },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  NO_SHOW: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function AppointmentDetailDialog({
  open,
  onOpenChange,
  appointment,
  onUpdate,
}: AppointmentDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!appointment) return null;

  const { extendedProps: props } = appointment;

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(`Appointment marked as ${newStatus.replace('_', ' ').toLowerCase()}`);
        onUpdate();
        onOpenChange(false);
      } else {
        toast.error(result.error?.message || 'Failed to update');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Appointment deleted');
        onUpdate();
        onOpenChange(false);
      } else {
        toast.error(result.error?.message || 'Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            <Badge className={`${statusColors[props.status]} border text-xs`}>
              {props.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {format(appointment.start, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Patient Info */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold shrink-0">
              {props.patientName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{props.patientName}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {props.patientPhone}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Time</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {format(appointment.start, 'h:mm a')} – {format(appointment.end, 'h:mm a')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
              <p className="text-sm font-medium">{props.duration} min</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Doctor</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Stethoscope className="h-3.5 w-3.5 text-primary" />
                Dr. {props.doctorName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Type</p>
              <p className="text-sm font-medium">{props.type.replace('_', ' ')}</p>
            </div>
          </div>

          {props.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
                <p className="text-sm">{props.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Status Update */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Update Status</p>
            <Select
              value={props.status}
              onValueChange={updateStatus}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className={`h-4 w-4 ${opt.color}`} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
