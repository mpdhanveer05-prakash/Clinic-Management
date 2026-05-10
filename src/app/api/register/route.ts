import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { registerSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

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

    const { name, email, password, clinicName, clinicPhone, clinicAddress, clinicCity } =
      validated.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Email already registered', code: 'EMAIL_EXISTS' },
        },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create clinic and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          phone: clinicPhone,
          address: clinicAddress,
          city: clinicCity,
          state: 'Tamil Nadu',
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'ADMIN',
          clinicId: clinic.id,
        },
      });

      return { clinic, user };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
          },
          clinic: {
            id: result.clinic.id,
            name: result.clinic.name,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      },
      { status: 500 },
    );
  }
}
