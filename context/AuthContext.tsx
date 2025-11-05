
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsPasswordChange: boolean;
  dealerLogin: (emailOrUsername: string, password: string, rememberMe: boolean) => Promise<void>;
  adminLogin: (password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPersistedUser = async () => {
      try {
        const persistedUser = localStorage.getItem('unionRegistryUser');
        if (persistedUser) {
          const userData: User = JSON.parse(persistedUser);
          // In a real app, you'd re-validate the token/session here
          api.setCurrentUser(userData); // Sync API service with current user
          setUser(userData);
          setNeedsPasswordChange(!!userData.tempPassword);
        }
      } catch (error) {
        console.error("Failed to parse persisted user:", error);
        localStorage.removeItem('unionRegistryUser');
      } finally {
        setLoading(false);
      }
    };
    checkPersistedUser();
  }, []);

  const handleLoginSuccess = (loggedInUser: User, temporary: boolean, rememberMe: boolean) => {
    setUser(loggedInUser);
    setNeedsPasswordChange(temporary);
    api.setCurrentUser(loggedInUser);
    if (rememberMe) {
      localStorage.setItem('unionRegistryUser', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('unionRegistryUser');
    }
  };
  
  const dealerLogin = async (emailOrUsername: string, password: string, rememberMe: boolean) => {
    const { user, temporaryPassword } = await api.loginAsDealer(emailOrUsername, password);
    handleLoginSuccess(user, temporaryPassword, rememberMe);
  };

  const adminLogin = async (password: string, rememberMe: boolean) => {
    const { user, temporaryPassword } = await api.loginAsAdmin(password);
    handleLoginSuccess(user, temporaryPassword, rememberMe);
  };

  const logout = () => {
    setUser(null);
    setNeedsPasswordChange(false);
    api.setCurrentUser(null);
    localStorage.removeItem('unionRegistryUser');
    localStorage.removeItem('ur:auth:token');
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error("No user is logged in.");
    await api.changePassword(user.id, newPassword);
    const updatedUser = { ...user, tempPassword: null, tempPasswordExpiry: null };
    setUser(updatedUser);
    if (localStorage.getItem('unionRegistryUser')) {
        localStorage.setItem('unionRegistryUser', JSON.stringify(updatedUser));
    }
    setNeedsPasswordChange(false);
  };

  const updateUser = (updatedData: Partial<User>) => {
      if (user) {
          const updatedUser = { ...user, ...updatedData };
          setUser(updatedUser);
          if (localStorage.getItem('unionRegistryUser')) {
              localStorage.setItem('unionRegistryUser', JSON.stringify(updatedUser));
          }
      }
  };
  
  const value = {
    user,
    loading,
    needsPasswordChange,
    dealerLogin,
    adminLogin,
    logout,
    updatePassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
