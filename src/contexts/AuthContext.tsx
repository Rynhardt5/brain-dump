'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  user: any;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const logout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user,
      logout,
      loading: status === "loading"
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
