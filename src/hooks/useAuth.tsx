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

    setIsLoading(true);
    console.debug('[auth] init start');

    const hardTimeout = window.setTimeout(() => {
      if (!mounted) return;
      console.warn('[auth] init timeout -> forcing unauth');
      setSession(null);
      setUser(null);
      setIsLoading(false);
    }, 5000);

    const finish = (nextSession: Session | null) => {
      if (!mounted) return;
      window.clearTimeout(hardTimeout);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    };

    // IMPORTANT: listener first, then getSession (prevents missed state changes)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.debug('[auth] onAuthStateChange', event, !!nextSession);
      finish(nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('[auth] getSession error:', error);
          finish(null);
          return;
        }

        console.debug('[auth] getSession resolved', !!data.session);
        finish(data.session);
      })
      .catch((error) => {
        console.error('[auth] getSession threw:', error);
        finish(null);
      });

    return () => {
      mounted = false;
      window.clearTimeout(hardTimeout);
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

