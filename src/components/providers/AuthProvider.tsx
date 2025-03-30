'use client';

import { createContext, useContext, ReactNode } from 'react';
import useAuth from '@/hooks/useAuth';
import { User } from '@supabase/supabase-js';

interface UserProfileData {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  points?: number;
  completed_tasks?: number;
  avatar_url?: string;
  household_id?: string;
  notifications_enabled?: boolean;
  theme?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext måste användas inom en AuthProvider');
  }
  
  return context;
} 