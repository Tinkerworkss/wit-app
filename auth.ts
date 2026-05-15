import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: { organization: true },
              take: 1,
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!user) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        const membership = user.memberships[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,

          organizationId: membership?.organizationId ?? null,
          organizationName: membership?.organization?.name ?? null,
          organizationSlug: membership?.organization?.slug ?? null,
          role: membership?.role ?? null,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & {
          organizationId: string | null;
          organizationName: string | null;
          organizationSlug: string | null;
          role: Role | null;
        };

        token.organizationId = u.organizationId;
        token.organizationName = u.organizationName;
        token.organizationSlug = u.organizationSlug;
        token.role = u.role;
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";

        session.user.organizationId =
          (token.organizationId as string | null) ?? null;

        session.user.organizationName =
          (token.organizationName as string | null) ?? null;

        session.user.organizationSlug =
          (token.organizationSlug as string | null) ?? null;

        session.user.role = (token.role as Role | null) ?? null;
      }

      return session;
    },
  },
});
