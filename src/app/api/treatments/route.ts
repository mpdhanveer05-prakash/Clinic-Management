import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const createTreatmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment is required'),
  procedure: z.string().min(1, 'Procedure is required'),
  teeth: z.string().optional(),
  notes: z.string().optional(),
  cost: z.coerce.number().min(0, 'Cost must be positive'),
  followUpDays: z.coerce.number().min(0).optional(),
});

// GET /api/treatments — List treatments
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
    const patientId = searchParams.get('patientId');

    const where: any = {
      appointment: { doctor: { clinicId } },
    };

    if (patientId) where.patientId = patientId;

    const treatments = await prisma.treatment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            type: true,
            doctor: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: treatments });
  } catch (error) {
    console.error('Error fetching treatments:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// POST /api/treatments — Record a treatment for a completed appointment
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
    const validated = createTreatmentSchema.safeParse(body);

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

    const { appointmentId, procedure, teeth, notes, cost, followUpDays } = validated.data;

    // Verify appointment exists and belongs to clinic
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctor: { clinicId } },
      include: { treatment: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: { message: 'Appointment not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    if (appointment.treatment) {
      return NextResponse.json(
        { success: false, error: { message: 'Treatment already recorded', code: 'DUPLICATE' } },
        { status: 409 },
      );
    }

    const treatment = await prisma.$transaction(async (tx) => {
      // Create treatment
      const t = await tx.treatment.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          procedure,
          teeth: teeth || null,
          notes: notes || null,
          cost,
          followUpDays: followUpDays || null,
        },
      });

      // Mark appointment as completed
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });

      return t;
    });

    return NextResponse.json({ success: true, data: treatment }, { status: 201 });
  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
