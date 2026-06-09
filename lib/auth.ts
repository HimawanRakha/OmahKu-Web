import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { queryOne } from "@/lib/db";
import type { UserRole } from "@/types";

interface AuthUserRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  profile_photo_url: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      image: string | null;
    };
  }

  interface User {
    role: UserRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email atau Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!identifier || !password) return null;

        const user = await queryOne<AuthUserRow>(
          `SELECT id, full_name, email, username, password_hash, role, profile_photo_url
           FROM user
           WHERE (email = ? OR username = ?) AND deleted_at IS NULL
           LIMIT 1`,
          [identifier, identifier],
        );

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.full_name,
          email: user.email,
          role: user.role,
          image: user.profile_photo_url,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as UserRole) ?? "user";
      }
      return session;
    },
  },
});
