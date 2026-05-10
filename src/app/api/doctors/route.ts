import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const createDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  specialization: z.string().default('General Dentist'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  availability: z.any().optional(),
});

// GET /api/doctors — List all doctors for the clinic
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const clinicId = (session.user as any).clinicId;

    const doctors = await prisma.doctor.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        specialization: true,
        phone: true,
        email: true,
        availability: true,
        isActive: true,
        _count: { select: { appointments: true } },
      },
    });

    return NextResponse.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// POST /api/doctors — Create a new doctor
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Only admins can add doctors', code: 'FORBIDDEN' } },
        { status: 403 },
      );
    }

    const clinicId = (session.user as any).clinicId;
    const body = await request.json();
    const validated = createDoctorSchema.safeParse(body);

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

    // Default availability: Mon-Sat 9am-6pm
    const defaultAvailability = {
      monday: [{ start: '09:00', end: '18:00' }],
      tuesday: [{ start: '09:00', end: '18:00' }],
      wednesday: [{ start: '09:00', end: '18:00' }],
      thursday: [{ start: '09:00', end: '18:00' }],
      friday: [{ start: '09:00', end: '18:00' }],
      saturday: [{ start: '09:00', end: '14:00' }],
      sunday: [],
    };

    const doctor = await prisma.doctor.create({
      data: {
        name: validated.data.name,
        specialization: validated.data.specialization,
        phone: validated.data.phone || null,
        email: validated.data.email || null,
        availability: validated.data.availability || defaultAvailability,
        clinicId,
      },
    });

    return NextResponse.json({ success: true, data: doctor }, { status: 201 });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
