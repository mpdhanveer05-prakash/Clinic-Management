import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    clinicId?: string;
    clinicName?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      clinicId: string;
      clinicName: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    clinicId?: string;
    clinicName?: string;
  }
}
