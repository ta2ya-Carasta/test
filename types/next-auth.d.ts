import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id: string;
      role: 'USER' | 'ADMIN';
    };
  }

  interface User {
    id: string;
    role: 'USER' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'USER' | 'ADMIN';
  }
}
