import { DefaultSession } from "next-auth";

interface UserRole {
  role: {
    name: string;
  };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      roles?: UserRole[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: UserRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: UserRole[];
  }
} 