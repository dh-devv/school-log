import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { getProfileRole, isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const nextUser = data.session?.user ?? null;
    setUser(nextUser);
    if (nextUser) {
      try {
        setRole(await getProfileRole(nextUser.id));
      } catch {
        setRole("user");
      }
    } else {
      setRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => { void refresh(); }, 0); });
    return () => listener.subscription.unsubscribe();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase 연결 설정이 없습니다.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  return { user, role, loading, signIn, signOut, refresh, configured: isSupabaseConfigured };
}
