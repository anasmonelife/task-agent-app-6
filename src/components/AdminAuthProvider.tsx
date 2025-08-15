import React, { createContext, useContext, useState, useEffect } from 'react';
import { typedSupabase } from '@/lib/supabase-utils';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  team_id?: string;
  team_name?: string;
  permissions?: string[];
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
      } catch (error) {
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Query admin_users table
      const { data, error } = await typedSupabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return false;
      }

      const user: AdminUser = {
        id: data.id,
        username: data.username,
        role: data.role,
        is_active: data.is_active,
      };

      setAdminUser(user);
      localStorage.setItem('adminUser', JSON.stringify(user));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.username}!`,
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('team_user');
    localStorage.removeItem('guest_user');
    
    // Clear all session storage
    sessionStorage.clear();
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    
    // Force page reload to clear all app state
    window.location.href = '/';
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, login, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};