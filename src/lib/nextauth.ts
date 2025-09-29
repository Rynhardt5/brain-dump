import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"
import { accounts, sessions, users, verificationTokens } from "./db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const existingUsers = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1)
          
          if (existingUsers.length === 0) {
            return null
          }

          const user = existingUsers[0]
          
          // Check if user has a password (might be Google-only user)
          if (!user.passwordHash) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)
          
          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("Error during authentication:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        // For credentials, user is already validated in authorize function
        return true
      }
      
      if (account?.provider === "google") {
        try {
          // Check if user already exists with this email
          const existingUsers = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
          
          if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            
            // Check if this Google account is already linked
            const existingAccounts = await db.select().from(accounts).where(
              and(
                eq(accounts.userId, existingUser.id),
                eq(accounts.provider, 'google')
              )
            ).limit(1);
            
            if (existingAccounts.length === 0) {
              // Link Google account to existing user
              await db.insert(accounts).values({
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              });
              
              // Update existing user with Google profile info
              await db.update(users).set({
                image: user.image,
                emailVerified: new Date(),
              }).where(eq(users.id, existingUser.id));
            }
            
            // Force NextAuth to use the existing user ID
            user.id = existingUser.id;
          }
          
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If the url is a relative path, prepend the base URL
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If the url is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) return url;
      // Otherwise, redirect to the dashboard
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      // Add user ID to token when user signs in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID from token to session
      if (token?.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
  },
  debug: false,
}
