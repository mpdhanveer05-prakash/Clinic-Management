import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { updatePatientSchema } from '@/lib/validators';

// GET /api/patients/[id] — Get single patient with full details
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
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            appointments: true,
            treatments: true,
            invoices: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: { message: 'Patient not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// PUT /api/patients/[id] — Update patient
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

    const validated = updatePatientSchema.safeParse(body);
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

    // Verify patient belongs to clinic
    const existing = await prisma.patient.findFirst({ where: { id, clinicId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Patient not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    // Check phone uniqueness if being changed
    if (validated.data.phone && validated.data.phone !== existing.phone) {
      const phoneTaken = await prisma.patient.findUnique({
        where: { phone: validated.data.phone },
      });
      if (phoneTaken) {
        return NextResponse.json(
          { success: false, error: { message: 'Phone number already in use', code: 'DUPLICATE_PHONE' } },
          { status: 409 },
        );
      }
    }

    const updateData: any = { ...validated.data };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.email === '') {
      updateData.email = null;
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// DELETE /api/patients/[id] — Delete patient
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
    const role = (session.user as any).role;

    // Only admin can delete patients
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Only admins can delete patients', code: 'FORBIDDEN' } },
        { status: 403 },
      );
    }

    const existing = await prisma.patient.findFirst({ where: { id, clinicId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Patient not found', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    await prisma.patient.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
