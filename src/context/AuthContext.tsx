import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Employee, EmployeeSkillProficiency, PastWork } from '../types/database';

interface SignUpData {
  email: string;
  password: string;
  name: string;
  title: string;
  region: 'Americas' | 'EMEA' | 'APAC' | 'LATAM' | 'South Asia';
  location?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  employeeProfile: Employee | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  authError: string | null;
  emailConfirmationRequired: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string; confirmationSent?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateEmployeeProfile: (updates: Partial<Employee>) => Promise<{ success: boolean; error?: string }>;
  syncAnalyzedPortfolio: (
    skills: EmployeeSkillProficiency[], 
    certifications: string[], 
    pastWorks: PastWork[], 
    qualityScore?: number
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  createInitialProfile: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  setSimulatedEmployee: (emp: Employee | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState<boolean>(false);
  const [simulatedEmployee, setSimulatedEmployee] = useState<Employee | null>(null);

  // Fetch linked employee record from Supabase 'employees' table
  const fetchEmployeeProfile = useCallback(async (targetUser: User | null) => {
    if (!targetUser?.email && !targetUser?.id) {
      setEmployeeProfile(null);
      return;
    }

    setIsProfileLoading(true);
    try {
      // Look up by email first, or id
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(`email.eq.${targetUser.email},id.eq.${targetUser.id}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching employee profile from Supabase:', error);
      } else if (data) {
        setEmployeeProfile(data as Employee);
      } else {
        // No profile found yet for this authenticated user
        setEmployeeProfile(null);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // Listen for Supabase Auth state changes
  useEffect(() => {
    // 1. Initial session retrieval
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmployeeProfile(session.user);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error getting initial session:', err);
      setIsLoading(false);
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      if (newUser) {
        await fetchEmployeeProfile(newUser);
      } else {
        setEmployeeProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEmployeeProfile]);

  // Sign In with email & password
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    setEmailConfirmationRequired(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setEmailConfirmationRequired(true);
          return { success: false, error: 'Please confirm your email before logging in, or check the confirmation link sent to your inbox.' };
        }
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchEmployeeProfile(data.user);
      }
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Sign Up with email & password and create employee profile
  const signUp = async (signUpData: SignUpData): Promise<{ success: boolean; error?: string; confirmationSent?: boolean }> => {
    setAuthError(null);
    setEmailConfirmationRequired(false);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email.trim(),
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.name,
            title: signUpData.title,
            region: signUpData.region,
            location: signUpData.location || 'Remote'
          }
        }
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      // If user created, also insert their row into public.employees so it is immediately present
      const userId = data.user?.id || `emp-${Date.now()}`;
      const newEmpRow: Partial<Employee> = {
        id: userId,
        name: signUpData.name,
        title: signUpData.title,
        email: signUpData.email.trim(),
        location: signUpData.location || 'Remote HQ',
        region: signUpData.region,
        timezone: 'UTC+0',
        skills: [],
        performance: { quality: 90, on_time: 95, tasks_completed_30d: 0 },
        capacity_hours: 40,
        utilization_pct: 0,
        status: 'Available',
        shift: { start: '09:00', end: '18:00' },
        certifications: []
      };

      const { error: insertErr } = await supabase.from('employees').insert(newEmpRow);
      if (insertErr) {
        console.warn('Could not auto-insert employee row (might already exist or RLS):', insertErr.message);
      }

      // Check if session was returned or email confirmation is pending
      if (!data.session && data.user) {
        setEmailConfirmationRequired(true);
        return {
          success: true,
          confirmationSent: true
        };
      }

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Sign up failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // Create initial profile for authenticated user if not present
  const createInitialProfile = async (profileData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    try {
      const newEmp: Partial<Employee> = {
        id: user.id,
        name: profileData.name,
        title: profileData.title,
        email: user.email || profileData.email,
        location: profileData.location || 'Remote HQ',
        region: profileData.region,
        timezone: 'UTC+0',
        skills: [],
        performance: { quality: 90, on_time: 95, tasks_completed_30d: 0 },
        capacity_hours: 40,
        utilization_pct: 0,
        status: 'Available',
        shift: { start: '09:00', end: '18:00' },
        certifications: []
      };

      const { error } = await supabase.from('employees').upsert(newEmp);
      if (error) throw error;

      await fetchEmployeeProfile(user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create profile' };
    }
  };

  // Update employee profile (status, shift, capacity, etc.)
  const updateEmployeeProfile = async (updates: Partial<Employee>): Promise<{ success: boolean; error?: string }> => {
    const activeEmpId = employeeProfile?.id || simulatedEmployee?.id;
    if (!activeEmpId) {
      return { success: false, error: 'No active employee profile to update' };
    }

    try {
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', activeEmpId);

      if (error) throw error;

      // Update local state optimistically
      setEmployeeProfile((prev) => prev ? { ...prev, ...updates } : null);
      if (simulatedEmployee) {
        setSimulatedEmployee((prev) => prev ? { ...prev, ...updates } : null);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update employee in Supabase:', err);
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  // Password reset request
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset email' };
    }
  };

  // Update password
  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      setUser(null);
      setSession(null);
      setEmployeeProfile(null);
      setSimulatedEmployee(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchEmployeeProfile(user);
    }
  };

  // Sync analyzed skills, certifications, and past works to Supabase
  const syncAnalyzedPortfolio = async (
    skills: EmployeeSkillProficiency[],
    certifications: string[],
    pastWorks: PastWork[],
    qualityScore?: number
  ): Promise<{ success: boolean; error?: string }> => {
    const activeEmpId = employeeProfile?.id || simulatedEmployee?.id;
    if (!activeEmpId) {
      return { success: false, error: 'No active employee profile to update' };
    }

    try {
      const currentPerf = employeeProfile?.performance || { quality: 90, on_time: 95, tasks_completed_30d: 0 };
      const updatedPerf = {
        ...currentPerf,
        quality: qualityScore || currentPerf.quality,
        past_works: pastWorks
      };

      const updates: Partial<Employee> = {
        skills,
        certifications,
        performance: updatedPerf
      };

      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', activeEmpId);

      if (error) throw error;

      // Insert audit log to Supabase in real time
      await supabase.from('audit_logs').insert({
        id: `audit-skill-${Date.now()}`,
        actor: employeeProfile?.name || activeEmpId,
        event_type: 'PORTFOLIO_SKILL_VERIFICATION',
        before: `Skills: ${employeeProfile?.skills?.length || 0} registered`,
        after: `Extracted ${skills.length} skills, ${certifications.length} certs, ${pastWorks.length} past works`,
        reason: 'Autonomous AI Skill & Past Work Telemetry Ingestion (Resume, CVE, GitHub, Certs)',
        approval_outcome: 'AUTO_APPROVED'
      });

      // Optimistic update to active state
      setEmployeeProfile((prev) => prev ? { ...prev, ...updates } : null);
      if (simulatedEmployee) {
        setSimulatedEmployee((prev) => prev ? { ...prev, ...updates } : null);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to sync analyzed portfolio to Supabase:', err);
      return { success: false, error: err.message || 'Failed to sync portfolio' };
    }
  };

  // The active profile is the real employeeProfile or fallback to simulated for quick view
  const activeProfile = employeeProfile || simulatedEmployee;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        employeeProfile: activeProfile,
        isLoading,
        isProfileLoading,
        authError,
        emailConfirmationRequired,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateEmployeeProfile,
        syncAnalyzedPortfolio,
        refreshProfile,
        createInitialProfile,
        setSimulatedEmployee
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
