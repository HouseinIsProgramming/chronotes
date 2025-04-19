
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { initializeDB } from '@/lib/indexedDB';
import { useToast } from '@/components/ui/use-toast';

type AuthMode = 'authenticated' | 'guest' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  mode: AuthMode;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<AuthMode>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setMode(session ? 'authenticated' : null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setMode(session ? 'authenticated' : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      toast({ 
        title: "Error signing in", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      toast({ 
        title: "Error signing in with Google", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      });
      if (error) throw error;
    } catch (error) {
      toast({ 
        title: "Error signing in with GitHub", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({ 
        title: "Success", 
        description: "Please check your email to confirm your account."
      });
    } catch (error) {
      toast({ 
        title: "Error signing up", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const continueAsGuest = async () => {
    try {
      await initializeDB();
      setMode('guest');
      toast({ 
        title: "Guest mode activated", 
        description: "Your notes will be stored locally in your browser."
      });
    } catch (error) {
      toast({ 
        title: "Error initializing guest mode", 
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signOut = async () => {
    if (mode === 'authenticated') {
      await supabase.auth.signOut();
    }
    setMode(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      mode,
      signInWithEmail,
      signInWithGoogle,
      signInWithGitHub,
      signUp,
      continueAsGuest,
      signOut,
    }}>
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
