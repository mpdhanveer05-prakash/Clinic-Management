import { Calendar } from 'lucide-react';

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground mt-1">Manage your clinic appointments and schedule</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-primary/10 mb-4">
          <Calendar className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming in Phase 2</h2>
        <p className="text-muted-foreground max-w-md">
          Interactive appointment calendar with drag-and-drop scheduling, doctor availability management, and booking system.
        </p>
      </div>
    </div>
  );
}
