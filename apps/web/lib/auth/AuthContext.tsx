'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserPublicProfile, LoginRequest, RegisterRequest, UserRole } from 'shared-types';

interface AuthContextType {
  user: UserPublicProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    credentials: LoginRequest,
    options?: { requiredRole?: UserRole }
  ) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  initialUser?: UserPublicProfile | null;
}> = ({ children, initialUser = null }) => {
  const [user, setUser] = useState<UserPublicProfile | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser);

  // Restore session on mount if initialUser was not supplied via SSR
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUser) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [initialUser, refreshUser]);

  const login = async (
    credentials: LoginRequest,
    options?: { requiredRole?: UserRole }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          ...(options?.requiredRole && { requiredRole: options.requiredRole }),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.message || 'Login failed. Please check your credentials.',
        };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  };

  const register = async (payload: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.message || 'Registration failed. Please check your details.',
        };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Continue cleanup on client
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
