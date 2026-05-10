import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  AlertTriangle,
  Stethoscope,
  Receipt,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const clinicId = (session?.user as any)?.clinicId;
  const { id } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId },
    include: {
      appointments: {
        include: {
          doctor: { select: { name: true, specialization: true } },
          treatment: true,
        },
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { appointments: true, treatments: true, invoices: true },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700',
  };

  const invoiceStatusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="icon" className="mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {patient.phone}
                </span>
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {patient.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient Info */}
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patient Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.gender && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{patient.gender}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium">
                    {new Date(patient.dateOfBirth).toLocaleDateString('en-IN')}
                  </span>
                </div>
              )}
              {patient.bloodGroup && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5" /> Blood Group
                  </span>
                  <span className="font-medium">{patient.bloodGroup}</span>
                </div>
              )}
              {patient.allergies && (
                <div className="text-sm">
                  <span className="text-muted-foreground flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Allergies
                  </span>
                  <span className="font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs">
                    {patient.allergies}
                  </span>
                </div>
              )}
              {patient.address && (
                <div className="text-sm">
                  <span className="text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="h-3.5 w-3.5" /> Address
                  </span>
                  <span className="font-medium">{patient.address}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="secondary">{patient.source.replace('_', ' ')}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registered</span>
                <span className="font-medium">
                  {new Date(patient.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{patient._count.appointments}</p>
                  <p className="text-xs text-muted-foreground">Appointments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{patient._count.treatments}</p>
                  <p className="text-xs text-muted-foreground">Treatments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{patient._count.invoices}</p>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs with History */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="appointments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="appointments" className="gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <Receipt className="h-4 w-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appointments">
              <Card className="border shadow-sm">
                <CardContent className="pt-6">
                  {patient.appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No appointments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patient.appointments.map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-primary" />
                              <p className="font-medium text-sm">{apt.type.replace('_', ' ')}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Dr. {apt.doctor.name} • {apt.duration} min
                            </p>
                            {apt.treatment && (
                              <p className="text-xs text-muted-foreground">
                                Treatment: {apt.treatment.procedure} • ₹{String(apt.treatment.cost)}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-medium">
                              {new Date(apt.scheduledAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(apt.scheduledAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <Badge variant="secondary" className={statusColors[apt.status] || ''}>
                              {apt.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card className="border shadow-sm">
                <CardContent className="pt-6">
                  {patient.invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No invoices yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patient.invoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">#{invoice.invoiceNo}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm font-bold">₹{String(invoice.totalAmount)}</p>
                            <Badge
                              variant="secondary"
                              className={invoiceStatusColors[invoice.status] || ''}
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
