import { DefaultSession } from "next-auth";

interface UserRole {
  role: {
    name: string;
  };
}

interface ManagedUser {
  id: string;
  name: string | null;
  email: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      roles?: UserRole[];
      managedUsers?: ManagedUser[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: UserRole[];
    managedUsers?: ManagedUser[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: UserRole[];
    managedUsers?: ManagedUser[];
  }
} 