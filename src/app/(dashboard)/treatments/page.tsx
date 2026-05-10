import { Stethoscope } from 'lucide-react';

export default function TreatmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Treatments</h1>
        <p className="text-muted-foreground mt-1">Treatment records and clinical notes</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-primary/10 mb-4">
          <Stethoscope className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming in Phase 2</h2>
        <p className="text-muted-foreground max-w-md">
          Treatment records linked to appointments with procedures, clinical notes, and follow-up scheduling.
        </p>
      </div>
    </div>
  );
}
