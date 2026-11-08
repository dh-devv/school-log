import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { getProfileRole, isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"user" | "admin" | "owner" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        setRole(await getProfileRole(nextUser.id));
      } else {
        setRole(null);
      }
    } catch {
      setRole(null);
      setError("계정 권한을 확인하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
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
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
    setRole(null);
    setError(null);
  }, []);

  return { user, role, loading, error, signIn, signOut, refresh, configured: isSupabaseConfigured };
}
