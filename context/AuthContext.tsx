'use client'
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';


type User = {
  username: string;
  isAdmin: boolean;
  isTempAdmin: boolean;
  token?: string;
};

// type AuthContextType = {
//   user: User | null;
//   login: (userData: User) => void;
//   logout: () => void;
// };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Make sure the login function properly sets user data and updates localStorage
  const login = (userData: User) => {
    console.log('Setting user data in context:', userData); // Enhanced debug
    
    // Ensure boolean values for roles and create a clean object
    const normalizedUserData = {
      username: userData.username,
      isAdmin: Boolean(userData.isAdmin),
      isTempAdmin: Boolean(userData.isTempAdmin),
      token: userData.token
    };
    
    console.log('Normalized user data:', normalizedUserData); // Log normalized data
    
    // Update state and localStorage
    setUser(normalizedUserData);
    localStorage.setItem('user', JSON.stringify(normalizedUserData));
    
    console.log('User stored in localStorage:', JSON.parse(localStorage.getItem('user') || '{}')); 
  };

  const signup = async (email: string, password: string) => {
    // Implement your signup logic here
    await Promise.resolve();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};