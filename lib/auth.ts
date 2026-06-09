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
  password: string; // FIX: kolom asli 'password', bukan 'password_hash'
  role: UserRole;
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

        // FIX: SELECT password (bukan password_hash), hapus profile_photo_url
        const user = await queryOne<AuthUserRow>(
          `SELECT id, full_name, email, username, password, role
           FROM \`user\`
           WHERE (email = ? OR username = ?) AND deleted_at IS NULL
           LIMIT 1`,
          [identifier, identifier],
        );
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.full_name,
          email: user.email,
          role: user.role,
          image: null, // schema tidak punya kolom foto
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
