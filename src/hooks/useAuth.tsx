import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const safeFinish = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    };

    // Always end loading, even if something (storage, privacy settings) blocks auth init.
    setIsLoading(true);

    const hardTimeout = window.setTimeout(() => {
      console.warn('[auth] init timeout -> forcing unauth');
      safeFinish(null);
    }, 5000);

    const cleanupTimeout = () => window.clearTimeout(hardTimeout);

    // Detect blocked storage (common in strict privacy / some iframe contexts)
    try {
      const k = '__auth_storage_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
    } catch (err) {
      console.warn('[auth] localStorage blocked', err);
      cleanupTimeout();
      safeFinish(null);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        console.debug('[auth] onAuthStateChange', event, !!nextSession);
        cleanupTimeout();
        safeFinish(nextSession);
      });
      subscription = data.subscription;
    } catch (err) {
      console.error('[auth] onAuthStateChange failed', err);
      cleanupTimeout();
      safeFinish(null);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('[auth] getSession error:', error);
          cleanupTimeout();
          safeFinish(null);
          return;
        }

        console.debug('[auth] getSession resolved', !!data.session);
        cleanupTimeout();
        safeFinish(data.session);
      })
      .catch((error) => {
        console.error('[auth] getSession threw:', error);
        cleanupTimeout();
        safeFinish(null);
      });

    return () => {
      mounted = false;
      cleanupTimeout();
      subscription?.unsubscribe();
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

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
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

