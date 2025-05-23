import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { initializeDB } from "@/lib/indexedDB";
import { useToast } from "@/components/ui/use-toast";

type AuthMode = "authenticated" | "guest" | null;

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
    const storedMode = localStorage.getItem("authMode");
    if (storedMode === "guest") {
      setMode("guest");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setMode(session ? "authenticated" : null);
      if (!session) {
        const storedMode = localStorage.getItem("authMode");
        if (storedMode === "guest") {
          setMode("guest");
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setMode(session ? "authenticated" : null);
      if (!session) {
        const storedMode = localStorage.getItem("authMode");
        if (storedMode === "guest") {
          setMode("guest");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error signing in with Google",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error signing in with GitHub",
        description: error.message,
        variant: "destructive",
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
        description: "Please check your email to confirm your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // continueAsGuest now generates default folders/notes for first-time guest users
  const continueAsGuest = async (afterSampleData?: () => void) => {
    try {
      await initializeDB();
      localStorage.setItem("authMode", "guest");
      setMode("guest");
      toast({
        title: "Guest mode activated",
        description: "Your notes will be stored locally in your browser.",
      });
      // Only generate sample data if there are no folders or notes
      const db = await initializeDB();
      const foldersCount = await new Promise<number>((resolve, reject) => {
        const tx = db.transaction(["folders"], "readonly");
        const store = tx.objectStore("folders");
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => reject(countReq.error);
      });
      const notesCount = await new Promise<number>((resolve, reject) => {
        const tx = db.transaction(["notes"], "readonly");
        const store = tx.objectStore("notes");
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => reject(countReq.error);
      });
      if (foldersCount === 0 && notesCount === 0) {
        const { generateGuestSampleData } = await import("@/utils/indexedDBOperations");
        const created = await generateGuestSampleData();
        if (created && afterSampleData) afterSampleData();
      } else {
        if (afterSampleData) afterSampleData();
      }
    } catch (error) {
      toast({
        title: "Error initializing guest mode",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };


  const signOut = async () => {
    if (mode === "authenticated") {
      await supabase.auth.signOut();
    } else if (mode === "guest") {
      localStorage.removeItem("authMode");
    }
    setMode(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        mode,
        signInWithEmail,
        signInWithGoogle,
        signInWithGitHub,
        signUp,
        continueAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
