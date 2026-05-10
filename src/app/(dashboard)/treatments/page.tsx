'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Stethoscope,
  Calendar,
  IndianRupee,
  User,
  Clock,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Treatment {
  id: string;
  procedure: string;
  teeth: string | null;
  notes: string | null;
  cost: string;
  followUpDays: number | null;
  createdAt: string;
  patient: { id: string; name: string; phone: string };
  appointment: {
    id: string;
    scheduledAt: string;
    type: string;
    doctor: { name: string };
  };
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const res = await fetch('/api/treatments');
        const result = await res.json();
        if (result.success) setTreatments(result.data);
      } catch {
        toast.error('Failed to load treatments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTreatments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Treatments</h1>
        <p className="text-muted-foreground mt-1">
          Treatment records linked to completed appointments
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : treatments.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="p-4 rounded-2xl bg-primary/10 inline-block mb-4">
              <Stethoscope className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Treatments Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Treatment records appear here when you complete appointments.
              Go to the Appointments page and mark an appointment as completed to record a treatment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {treatments.map((treatment) => (
            <Card key={treatment.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Procedure */}
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{treatment.procedure}</h3>
                      {treatment.teeth && (
                        <Badge variant="secondary" className="text-xs">
                          Teeth: {treatment.teeth}
                        </Badge>
                      )}
                    </div>

                    {/* Patient & Doctor */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {treatment.patient.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Dr. {treatment.appointment.doctor.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(treatment.appointment.scheduledAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Notes */}
                    {treatment.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {treatment.notes}
                      </p>
                    )}

                    {/* Follow-up */}
                    {treatment.followUpDays && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Clock className="h-3.5 w-3.5" />
                        Follow-up in {treatment.followUpDays} days
                      </div>
                    )}
                  </div>

                  {/* Cost */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xl font-bold">
                      <IndianRupee className="h-5 w-5" />
                      {Number(treatment.cost).toLocaleString('en-IN')}
                    </div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {treatment.appointment.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
