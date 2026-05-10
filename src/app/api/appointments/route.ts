import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { createAppointmentSchema } from '@/lib/validators';

// GET /api/appointments — List appointments with optional date range and filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const clinicId = (session.user as any).clinicId;
    const searchParams = request.nextUrl.searchParams;

    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');

    const where: any = {
      doctor: { clinicId },
    };

    if (start && end) {
      where.scheduledAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, phone: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true },
        },
        treatment: {
          select: { id: true, procedure: true, cost: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// POST /api/appointments — Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const clinicId = (session.user as any).clinicId;
    const body = await request.json();
    const validated = createAppointmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validated.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    const { patientId, doctorId, scheduledAt, duration, type, notes } = validated.data;

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: { message: 'Patient not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    // Verify doctor belongs to clinic
    const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, clinicId } });
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: { message: 'Doctor not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    // Check for conflicts — overlapping appointments for the same doctor
    const appointmentStart = new Date(scheduledAt);
    const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60 * 1000);

    const conflicts = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: { notIn: ['CANCELLED'] },
        AND: [
          { scheduledAt: { lt: appointmentEnd } },
          {
            scheduledAt: {
              gte: new Date(appointmentStart.getTime() - 240 * 60 * 1000), // max 4hr appt window
            },
          },
        ],
      },
    });

    const hasConflict = conflicts.some((existing) => {
      const existingEnd = new Date(
        new Date(existing.scheduledAt).getTime() + existing.duration * 60 * 1000,
      );
      return appointmentStart < existingEnd && appointmentEnd > new Date(existing.scheduledAt);
    });

    if (hasConflict) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Doctor has a conflicting appointment at this time',
            code: 'CONFLICT',
          },
        },
        { status: 409 },
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt: appointmentStart,
        duration,
        type,
        notes: notes || null,
        status: 'CONFIRMED',
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    // Update patient's last visit tracking
    await prisma.patient.update({
      where: { id: patientId },
      data: { lastVisitAt: appointmentStart },
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
