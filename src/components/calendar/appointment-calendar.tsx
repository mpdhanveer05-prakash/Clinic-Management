'use client';

import { useCallback, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, DatesSetArg } from '@fullcalendar/core';
import { toast } from 'sonner';

import { BookingDialog } from './booking-dialog';
import { AppointmentDetailDialog } from './appointment-detail-dialog';

const statusColorMap: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  CONFIRMED: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  IN_PROGRESS: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  COMPLETED: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  CANCELLED: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  NO_SHOW: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
};

interface AppointmentCalendarProps {
  doctorFilter?: string;
}

export function AppointmentCalendar({ doctorFilter }: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string } | null>(null);

  const fetchEvents = useCallback(
    async (fetchInfo: { start: Date; end: Date }, successCallback: (events: any[]) => void) => {
      try {
        const params = new URLSearchParams({
          start: fetchInfo.start.toISOString(),
          end: fetchInfo.end.toISOString(),
        });
        if (doctorFilter) params.set('doctorId', doctorFilter);

        const res = await fetch(`/api/appointments?${params}`);
        const result = await res.json();

        if (result.success) {
          const events = result.data.map((apt: any) => {
            const colors = statusColorMap[apt.status] || statusColorMap.CONFIRMED;
            return {
              id: apt.id,
              title: `${apt.patient.name} — ${apt.type.replace('_', ' ')}`,
              start: apt.scheduledAt,
              end: new Date(
                new Date(apt.scheduledAt).getTime() + apt.duration * 60 * 1000,
              ).toISOString(),
              backgroundColor: colors.bg,
              borderColor: colors.border,
              textColor: colors.text,
              extendedProps: {
                patientName: apt.patient.name,
                patientPhone: apt.patient.phone,
                doctorName: apt.doctor.name,
                type: apt.type,
                status: apt.status,
                duration: apt.duration,
                notes: apt.notes,
              },
            };
          });
          successCallback(events);
        } else {
          successCallback([]);
        }
      } catch {
        toast.error('Failed to load appointments');
        successCallback([]);
      }
    },
    [doctorFilter],
  );

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    setBookingOpen(true);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      extendedProps: clickInfo.event.extendedProps,
    });
    setDetailOpen(true);
  };

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    setCurrentRange({
      start: dateInfo.startStr,
      end: dateInfo.endStr,
    });
  };

  const refetchEvents = () => {
    calendarRef.current?.getApi().refetchEvents();
  };

  return (
    <div className="appointment-calendar">
      <style jsx global>{`
        .appointment-calendar .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(192 70% 43%);
          --fc-button-border-color: hsl(192 70% 43%);
          --fc-button-hover-bg-color: hsl(192 70% 38%);
          --fc-button-hover-border-color: hsl(192 70% 38%);
          --fc-button-active-bg-color: hsl(192 70% 33%);
          --fc-button-active-border-color: hsl(192 70% 33%);
          --fc-today-bg-color: hsl(192 70% 43% / 0.06);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-event-border-color: transparent;
          font-family: var(--font-sans);
        }
        .appointment-calendar .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .appointment-calendar .fc .fc-button {
          font-size: 0.8125rem;
          font-weight: 500;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          text-transform: capitalize;
        }
        .appointment-calendar .fc .fc-col-header-cell {
          padding: 0.625rem 0;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground));
        }
        .appointment-calendar .fc .fc-daygrid-day-number,
        .appointment-calendar .fc .fc-timegrid-slot-label {
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
        }
        .appointment-calendar .fc .fc-event {
          border-radius: 0.375rem;
          padding: 2px 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          border-left-width: 3px;
          transition: opacity 0.15s;
        }
        .appointment-calendar .fc .fc-event:hover {
          opacity: 0.85;
        }
        .appointment-calendar .fc .fc-timegrid-event {
          border-radius: 0.375rem;
        }
        .appointment-calendar .fc .fc-daygrid-day.fc-day-today {
          background: hsl(192 70% 43% / 0.04);
        }
        .appointment-calendar .fc .fc-scrollgrid {
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .appointment-calendar .fc .fc-list-event:hover td {
          background: hsl(var(--muted));
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        events={fetchEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:15:00"
        slotLabelInterval="01:00:00"
        allDaySlot={false}
        expandRows={true}
        stickyHeaderDates={true}
        nowIndicator={true}
        height="auto"
        contentHeight={680}
        eventDisplay="block"
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6],
          startTime: '09:00',
          endTime: '18:00',
        }}
      />

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onSuccess={refetchEvents}
        defaultDate={selectedDate}
      />

      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={selectedEvent}
        onUpdate={refetchEvents}
      />
    </div>
  );
}
