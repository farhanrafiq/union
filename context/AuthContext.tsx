import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
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
        const token = localStorage.getItem('ur:auth:token');
        const dealerData = localStorage.getItem('ur:auth:dealer');
        
        if (token && dealerData) {
          const dealer = JSON.parse(dealerData);
          // Reconstruct minimal user object from dealer data
          const userData: User = {
            id: dealer.id,
            username: dealer.username,
            name: dealer.companyName,
            email: dealer.email,
            role: UserRole.DEALER,
            dealerId: dealer.id,
            tempPassword: null,
            tempPasswordExpiry: null,
          };
          setUser(userData);
          setNeedsPasswordChange(false);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem('ur:auth:token');
        localStorage.removeItem('ur:auth:dealer');
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
      name: dealer.companyName,
      email: dealer.email,
      role: UserRole.DEALER,
      dealerId: dealer.id,
      tempPassword: null,
      tempPasswordExpiry: null,
    };
    handleLoginSuccess(userData, false);
  };

  const adminLogin = async (password: string, rememberMe: boolean) => {
    await api.loginAsAdmin(password);
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

  const logout = () => {
    setUser(null);
    setNeedsPasswordChange(false);
    localStorage.removeItem('ur:auth:token');
    localStorage.removeItem('ur:auth:dealer');
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
