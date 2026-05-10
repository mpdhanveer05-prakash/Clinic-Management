import { z } from 'zod';

// ─── Patient Validators ─────────────────────────────────────────────────────

export const createPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone must be at most 15 digits')
    .regex(/^[+]?[\d\s-]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.any().optional(),
  notes: z.string().optional(),
  source: z
    .enum(['WALK_IN', 'WHATSAPP', 'PHONE_CALL', 'REFERRAL', 'WEBSITE'])
    .default('WALK_IN'),
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

export const updatePatientSchema = createPatientSchema.partial().omit({ clinicId: true });

export const patientSearchSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'lastVisitAt', 'phone']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  source: z.enum(['WALK_IN', 'WHATSAPP', 'PHONE_CALL', 'REFERRAL', 'WEBSITE']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

// ─── Appointment Validators ─────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  scheduledAt: z.string().min(1, 'Date & time is required'),
  duration: z.coerce.number().min(15).max(240).default(30),
  type: z
    .enum([
      'CHECKUP', 'CLEANING', 'EXTRACTION', 'ROOT_CANAL',
      'FILLING', 'CROWN', 'IMPLANT', 'ORTHODONTICS', 'EMERGENCY', 'OTHER',
    ])
    .default('CHECKUP'),
  notes: z.string().optional(),
});

// ─── Auth Validators ────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  clinicName: z.string().min(2, 'Clinic name is required'),
  clinicPhone: z.string().min(10, 'Clinic phone is required'),
  clinicAddress: z.string().min(5, 'Clinic address is required'),
  clinicCity: z.string().min(2, 'City is required'),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientSearchInput = z.infer<typeof patientSearchSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
