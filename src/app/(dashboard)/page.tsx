import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  Users,
  Calendar,
  IndianRupee,
  TrendingUp,
  Clock,
  AlertTriangle,
  PhoneMissed,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function getDashboardStats(clinicId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalPatients,
    newPatientsThisMonth,
    todayAppointments,
    pendingAppointments,
    missedCalls,
    activeConversations,
  ] = await Promise.all([
    prisma.patient.count({ where: { clinicId } }),
    prisma.patient.count({
      where: { clinicId, createdAt: { gte: startOfMonth } },
    }),
    prisma.appointment.count({
      where: {
        doctor: { clinicId },
        scheduledAt: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.appointment.count({
      where: {
        doctor: { clinicId },
        status: 'PENDING',
        scheduledAt: { gte: now },
      },
    }),
    prisma.missedCall.count({
      where: { followUpStatus: 'PENDING' },
    }),
    prisma.conversation.count({
      where: { status: { in: ['ACTIVE', 'ESCALATED'] } },
    }),
  ]);

  return {
    totalPatients,
    newPatientsThisMonth,
    todayAppointments,
    pendingAppointments,
    missedCalls,
    activeConversations,
  };
}

async function getRecentAppointments(clinicId: string) {
  const now = new Date();
  return prisma.appointment.findMany({
    where: {
      doctor: { clinicId },
      scheduledAt: { gte: now },
    },
    include: {
      patient: { select: { name: true, phone: true } },
      doctor: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
  });
}

async function getRecentPatients(clinicId: string) {
  return prisma.patient.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const clinicId = (session?.user as any)?.clinicId;

  if (!clinicId) {
    return <div>No clinic found. Please contact support.</div>;
  }

  const [stats, upcomingAppointments, recentPatients] = await Promise.all([
    getDashboardStats(clinicId),
    getRecentAppointments(clinicId),
    getRecentPatients(clinicId),
  ]);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      description: `+${stats.newPatientsThisMonth} this month`,
      icon: Users,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      description: `${stats.pendingAppointments} pending`,
      icon: Calendar,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Missed Calls',
      value: stats.missedCalls,
      description: 'Pending follow-up',
      icon: PhoneMissed,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
    {
      title: 'Active Chats',
      value: stats.activeConversations,
      description: 'WhatsApp conversations',
      icon: MessageSquare,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening at your clinic today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                <CardDescription>Next scheduled appointments</CardDescription>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{apt.patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Dr. {apt.doctor.name} • {apt.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(apt.scheduledAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <Badge variant="secondary" className={statusColors[apt.status] || ''}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Patients</CardTitle>
                <CardDescription>Newly registered patients</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No patients yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.phone}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {patient.source.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
