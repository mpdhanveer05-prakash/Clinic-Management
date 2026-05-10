import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { createPatientSchema, patientSearchSchema } from '@/lib/validators';

// GET /api/patients — List patients with search, pagination, sorting
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
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = patientSearchSchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      );
    }

    const { query, page, limit, sortBy, sortOrder, source, gender } = parsed.data;

    const where: any = { clinicId };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (source) where.source = source;
    if (gender) where.gender = gender;

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          gender: true,
          source: true,
          lastVisitAt: true,
          createdAt: true,
          _count: { select: { appointments: true } },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

// POST /api/patients — Create a new patient
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
    const validated = createPatientSchema.safeParse({ ...body, clinicId });

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

    // Check for duplicate phone
    const existing = await prisma.patient.findUnique({
      where: { phone: validated.data.phone },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Patient with this phone already exists', code: 'DUPLICATE_PHONE' },
        },
        { status: 409 },
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name: validated.data.name,
        phone: validated.data.phone,
        email: validated.data.email || null,
        dateOfBirth: validated.data.dateOfBirth ? new Date(validated.data.dateOfBirth) : null,
        gender: validated.data.gender || null,
        address: validated.data.address || null,
        bloodGroup: validated.data.bloodGroup || null,
        allergies: validated.data.allergies || null,
        notes: validated.data.notes || null,
        source: validated.data.source,
        clinicId,
      },
    });

    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
