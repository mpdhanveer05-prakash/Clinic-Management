import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const updateAppointmentSchema = z.object({
  scheduledAt: z.string().optional(),
  duration: z.coerce.number().min(15).max(240).optional(),
  type: z
    .enum([
      'CHECKUP', 'CLEANING', 'EXTRACTION', 'ROOT_CANAL',
      'FILLING', 'CROWN', 'IMPLANT', 'ORTHODONTICS', 'EMERGENCY', 'OTHER',
    ])
    .optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
  doctorId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/appointments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const clinicId = (session.user as any).clinicId;

    const appointment = await prisma.appointment.findFirst({
      where: { id, doctor: { clinicId } },
      include: {
        patient: true,
        doctor: true,
        treatment: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: { message: 'Appointment not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// PUT /api/appointments/[id] — Update appointment (reschedule, change status, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const clinicId = (session.user as any).clinicId;
    const body = await request.json();

    const validated = updateAppointmentSchema.safeParse(body);
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

    // Verify appointment belongs to clinic
    const existing = await prisma.appointment.findFirst({
      where: { id, doctor: { clinicId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Appointment not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    const updateData: any = { ...validated.data };

    // If rescheduling, check for conflicts
    if (updateData.scheduledAt || updateData.doctorId) {
      const newStart = updateData.scheduledAt
        ? new Date(updateData.scheduledAt)
        : new Date(existing.scheduledAt);
      const newDuration = updateData.duration || existing.duration;
      const newDoctorId = updateData.doctorId || existing.doctorId;
      const newEnd = new Date(newStart.getTime() + newDuration * 60 * 1000);

      const conflicts = await prisma.appointment.findMany({
        where: {
          doctorId: newDoctorId,
          id: { not: id },
          status: { notIn: ['CANCELLED'] },
          AND: [
            { scheduledAt: { lt: newEnd } },
            {
              scheduledAt: {
                gte: new Date(newStart.getTime() - 240 * 60 * 1000),
              },
            },
          ],
        },
      });

      const hasConflict = conflicts.some((c) => {
        const cEnd = new Date(new Date(c.scheduledAt).getTime() + c.duration * 60 * 1000);
        return newStart < cEnd && newEnd > new Date(c.scheduledAt);
      });

      if (hasConflict) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Conflicting appointment at this time', code: 'CONFLICT' },
          },
          { status: 409 },
        );
      }

      if (updateData.scheduledAt) {
        updateData.scheduledAt = newStart;
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// DELETE /api/appointments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const clinicId = (session.user as any).clinicId;

    const existing = await prisma.appointment.findFirst({
      where: { id, doctor: { clinicId } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Appointment not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    await prisma.appointment.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
