'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  UserPlus,
  Stethoscope,
  Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppointmentCalendar } from '@/components/calendar/appointment-calendar';
import { BookingDialog } from '@/components/calendar/booking-dialog';
import { AddDoctorDialog } from '@/components/calendar/add-doctor-dialog';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  _count: { appointments: number };
}

export default function AppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState<string>('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const result = await res.json();
      if (result.success) setDoctors(result.data);
    } catch {
      toast.error('Failed to load doctors');
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const refreshCalendar = () => {
    setCalendarKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clinic schedule and book appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAddDoctorOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
          <Button
            className="gradient-primary text-white hover:opacity-90 transition-opacity"
            onClick={() => setBookingOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Doctor Filter & Stats Strip */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Doctor filter */}
        <Card className="border shadow-sm flex-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={doctorFilter}
                onValueChange={(val) => {
                  setDoctorFilter(val === 'all' ? '' : val);
                  refreshCalendar();
                }}
              >
                <SelectTrigger className="max-w-[250px]">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      Dr. {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Doctor pills */}
              <div className="hidden lg:flex items-center gap-2 ml-2 overflow-x-auto">
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setDoctorFilter(doctorFilter === doc.id ? '' : doc.id);
                      refreshCalendar();
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      doctorFilter === doc.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    <Stethoscope className="h-3 w-3" />
                    Dr. {doc.name}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                      {doc._count.appointments}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <AppointmentCalendar key={calendarKey} doctorFilter={doctorFilter} />
        </CardContent>
      </Card>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground font-medium">Status:</span>
        {[
          { label: 'Pending', color: 'bg-amber-400' },
          { label: 'Confirmed', color: 'bg-green-500' },
          { label: 'In Progress', color: 'bg-blue-500' },
          { label: 'Completed', color: 'bg-emerald-500' },
          { label: 'Cancelled', color: 'bg-red-500' },
          { label: 'No Show', color: 'bg-orange-500' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Dialogs */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onSuccess={refreshCalendar}
      />

      <AddDoctorDialog
        open={addDoctorOpen}
        onOpenChange={setAddDoctorOpen}
        onSuccess={fetchDoctors}
      />
    </div>
  );
}
