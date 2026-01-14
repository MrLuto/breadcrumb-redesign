import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false;

    // Detect blocked storage first
    try {
      const k = '__auth_storage_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
    } catch (err) {
      console.warn('[auth] localStorage blocked', err);
      setIsLoading(false);
      return;
    }

    // Set up auth state listener - this handles future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.debug('[auth] onAuthStateChange', event, !!nextSession);
      
      if (!mounted) return;
      
      // Only update state after initial load, or for sign-in/sign-out events
      if (initialLoadDone || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setIsLoading(false);
      }
    });

    // Get initial session - this is the primary way to restore session
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      
      initialLoadDone = true;
      
      if (error) {
        console.error('[auth] getSession error:', error);
      } else {
        console.debug('[auth] getSession resolved', !!data.session);
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      
      setIsLoading(false);
    });

    // Safety timeout - should never be needed but prevents infinite loading
    const timeout = window.setTimeout(() => {
      if (!mounted || initialLoadDone) return;
      console.warn('[auth] init timeout -> forcing unauth');
      initialLoadDone = true;
      setIsLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);


  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      setSession(data.session);
      setUser(data.user ?? null);

      return { error: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: options?.data,
      },
    });
    return { error };
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
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

