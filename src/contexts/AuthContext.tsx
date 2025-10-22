import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface HealthMetrics {
  fullName: string;
  age: number | null;
  heightCm: number | null;
  bodyFatPercentage: number | null;
  gender: string | null;
}

interface AuthContextType {
  user: User | null;
  userRole: "admin" | "fitninja" | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metrics: HealthMetrics
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "fitninja" | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from profiles table
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole("fitninja"); // Default role
        return;
      }

      setUserRole(data?.role || "fitninja");
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("fitninja");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metrics: HealthMetrics
  ) => {
    try {
      // Pass all user data as metadata
      // The database trigger will automatically create the profile
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metrics.fullName,
            age: metrics.age,
            height_cm: metrics.heightCm,
            body_fat_percentage: metrics.bodyFatPercentage,
            gender: metrics.gender,
          },
        },
      });

      if (error) throw error;

      // Profile is automatically created by the database trigger
      // No need to manually insert into profiles table

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, userRole, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
