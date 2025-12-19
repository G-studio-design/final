// src/context/AuthContext.tsx
'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/user-types';

interface AuthContextProps {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  logout: () => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect runs only on the client
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser) as User);
      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      localStorage.removeItem('currentUser');
    }
    setIsHydrated(true); // Signal that hydration is complete
  }, []);

  useEffect(() => {
    // This effect persists changes to localStorage, only runs on client when currentUser changes
    if (typeof window !== 'undefined' && isHydrated) {
      if (currentUser) {
        const { password, ...userToStore } = currentUser;
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
  }, [currentUser, isHydrated]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    console.log("User logged out. Redirecting to login page.");
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, logout, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
