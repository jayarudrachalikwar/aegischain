import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../api/types';
import { mockStore, INITIAL_USERS } from '../api/mockAdapter';
import { apiClient } from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  requiresMfa: boolean;
  tempMfaUsername: string | null;
  loginWithPasskey: (username: string) => Promise<boolean>;
  verifyTotp: (code: string) => Promise<boolean>;
  switchUser: (targetRole: UserRole) => void;
  logout: () => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start signed out. (Demo mode only) restore the last demo user from localStorage; never auto-login.
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aegis_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [requiresMfa, setRequiresMfa] = useState<boolean>(false);
  const [tempMfaUsername, setTempMfaUsername] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aegis_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aegis_user');
    }
  }, [currentUser]);

  const loginWithPasskey = async (username: string): Promise<boolean> => {
    try {
      const res = await apiClient.auth.loginWithPasskey(username);
      if (res.requiresMfa) {
        setRequiresMfa(true);
        setTempMfaUsername(username);
        return false; // MFA pending
      }
      setCurrentUser(res.user);
      setRequiresMfa(false);
      setTempMfaUsername(null);
      return true;
    } catch (err) {
      console.error('Passkey authentication failed', err);
      throw err;
    }
  };

  const verifyTotp = async (code: string): Promise<boolean> => {
    try {
      const username = tempMfaUsername || currentUser?.username || 'vrathore';
      const res = await apiClient.auth.verifyTotp(code, username);
      if (res.verified) {
        setCurrentUser(res.user);
        setRequiresMfa(false);
        setTempMfaUsername(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('TOTP verification failed', err);
      throw err;
    }
  };

  const switchUser = (targetRole: UserRole) => {
    const matched = mockStore.getUsers().find(u => u.role === targetRole) || INITIAL_USERS[0];
    setCurrentUser(matched);
    setRequiresMfa(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setRequiresMfa(false);
    setTempMfaUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'EMPLOYEE',
        isAuthenticated: !!currentUser && !requiresMfa,
        requiresMfa,
        tempMfaUsername,
        loginWithPasskey,
        verifyTotp,
        switchUser,
        logout,
        allUsers: mockStore.getUsers(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
