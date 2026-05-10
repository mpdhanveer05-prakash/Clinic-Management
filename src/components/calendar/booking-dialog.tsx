'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, CalendarPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { createAppointmentSchema, type CreateAppointmentInput } from '@/lib/validators';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultDate?: Date;
  defaultDoctorId?: string;
}

const appointmentTypes = [
  { value: 'CHECKUP', label: 'Checkup' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'EXTRACTION', label: 'Extraction' },
  { value: 'ROOT_CANAL', label: 'Root Canal' },
  { value: 'FILLING', label: 'Filling' },
  { value: 'CROWN', label: 'Crown' },
  { value: 'IMPLANT', label: 'Implant' },
  { value: 'ORTHODONTICS', label: 'Orthodontics' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'OTHER', label: 'Other' },
];

const durations = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

export function BookingDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultDate,
  defaultDoctorId,
}: BookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      duration: 30,
      type: 'CHECKUP',
      scheduledAt: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '',
      doctorId: defaultDoctorId || '',
    },
  });

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/doctors');
        const result = await res.json();
        if (result.success) setDoctors(result.data);
      } catch {
        // silently fail, doctors dropdown will be empty
      }
    };
    if (open) fetchDoctors();
  }, [open]);

  // Search patients with debounce
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatients([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?query=${encodeURIComponent(patientSearch)}&limit=8`);
        const result = await res.json();
        if (result.success) setPatients(result.data.patients);
      } catch {
        // silently fail
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (open) {
      reset({
        duration: 30,
        type: 'CHECKUP',
        scheduledAt: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '',
        doctorId: defaultDoctorId || '',
        patientId: '',
        notes: '',
      });
      setPatientSearch('');
      setPatients([]);
    }
  }, [open, defaultDate, defaultDoctorId, reset]);

  const onSubmit = async (data: CreateAppointmentInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(`Appointment booked for ${result.data.patient.name}`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error?.message || 'Failed to book appointment');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Book Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a patient
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Input
              placeholder="Search patient by name or phone..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            {patients.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex justify-between items-center"
                    onClick={() => {
                      setValue('patientId', patient.id);
                      setPatientSearch(patient.name);
                      setPatients([]);
                    }}
                  >
                    <span className="font-medium">{patient.name}</span>
                    <span className="text-muted-foreground text-xs">{patient.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.patientId && (
              <p className="text-sm text-destructive">{errors.patientId.message}</p>
            )}
          </div>

          {/* Doctor */}
          <div className="space-y-2">
            <Label>Doctor *</Label>
            <Select
              defaultValue={defaultDoctorId}
              onValueChange={(val) => setValue('doctorId', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    Dr. {doc.name} — {doc.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.doctorId && (
              <p className="text-sm text-destructive">{errors.doctorId.message}</p>
            )}
          </div>

          {/* Date & Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date & Time *</Label>
              <Input type="datetime-local" {...register('scheduledAt')} />
              {errors.scheduledAt && (
                <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select defaultValue="30" onValueChange={(val) => setValue('duration', parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <Select defaultValue="CHECKUP" onValueChange={(val) => setValue('type', val as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any notes for this appointment..."
              rows={2}
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-white hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
