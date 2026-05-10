import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Clinic performance metrics and insights</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-primary/10 mb-4">
          <BarChart3 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming in Phase 7</h2>
        <p className="text-muted-foreground max-w-md">
          Appointment stats, revenue charts, no-show rates, patient acquisition analytics, and exportable reports.
        </p>
      </div>
    </div>
  );
}
