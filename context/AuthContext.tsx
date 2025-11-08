import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsPasswordChange: boolean;
  dealerLogin: (emailOrUsername: string, password: string, rememberMe: boolean) => Promise<void>;
  adminLogin: (password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
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
        const u = await api.getCurrentUser();
        if (u) {
          const userData: User = {
            id: u.id,
            username: u.username,
            name: u.companyName || u.name || '',
            email: u.email,
            role: u.role === 'admin' ? UserRole.ADMIN : UserRole.DEALER,
            dealerId: u.id,
            tempPassword: null,
            tempPasswordExpiry: null,
          };
          setUser(userData);
          setNeedsPasswordChange(!!u.forcePasswordChange);
        }
      } catch (error) {
        console.error('Failed to restore session', error);
      } finally {
        setLoading(false);
      }
    };
    checkPersistedUser();
  }, []);

  const handleLoginSuccess = (loggedInUser: User, temporary: boolean) => {
    setUser(loggedInUser);
    setNeedsPasswordChange(temporary);
  };
  
  const dealerLogin = async (emailOrUsername: string, password: string, rememberMe: boolean) => {
    const dealer = await api.loginAsDealer(emailOrUsername, password);
    const userData: User = {
      id: dealer.id,
      username: dealer.username,
      name: dealer.companyName || dealer.username,
      email: dealer.email,
      role: UserRole.DEALER,
      dealerId: dealer.id,
      tempPassword: null,
      tempPasswordExpiry: null,
    };
    handleLoginSuccess(userData, !!dealer.forcePasswordChange);
  };

  const adminLogin = async (password: string, rememberMe: boolean) => {
    const admin = await api.loginAsAdmin(password);
    const adminUser: User = {
      id: 'admin',
      username: 'admin',
      name: 'Administrator',
      email: 'admin@union.com',
      role: UserRole.ADMIN,
      dealerId: null,
      tempPassword: null,
      tempPasswordExpiry: null,
    };
    handleLoginSuccess(adminUser, false);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
      setNeedsPasswordChange(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error("No user is logged in.");
    await api.changePassword(user.tempPassword || '', newPassword);
    setNeedsPasswordChange(false);
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
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
