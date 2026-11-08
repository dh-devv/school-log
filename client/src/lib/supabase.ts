import { createClient } from "@supabase/supabase-js";
import type { SchoolItem, SchoolItemCategory } from "../../../drizzle/schema";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type SchoolItemRow = {
  id: number;
  title: string;
  category: SchoolItemCategory;
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function mapItem(row: SchoolItemRow): SchoolItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  } as SchoolItem;
}

function requireClient() {
  if (!supabase) throw new Error("Supabase 연결 설정이 없습니다. GitHub Pages 환경 변수를 확인해 주세요.");
  return supabase;
}

export async function listPublicSchoolItems(filters: { category?: SchoolItemCategory; date?: string } = {}) {
  const client = requireClient();
  let query = client.from("school_items").select("id,title,category,start_date,end_date,description,created_at,updated_at").order("start_date", { ascending: true }).order("id", { ascending: true }).limit(5000);
  if (filters.category) query = query.eq("category", filters.category);
  const { data, error } = await query;
  if (error) throw error;
  const items = ((data ?? []) as SchoolItemRow[]).map(mapItem);
  if (!filters.date) return items;
  return items.filter(item => item.startDate <= filters.date! && (item.endDate ? item.endDate >= filters.date! : item.startDate === filters.date));
}

export async function createPublicSchoolItem(input: { title: string; category: SchoolItemCategory; startDate: string; endDate: string | null; description: string | null }) {
  const client = requireClient();
  const { error } = await client.from("school_items").insert({
    title: input.title,
    category: input.category,
    start_date: input.startDate,
    end_date: input.endDate,
    description: input.description,
  });
  if (error) throw error;
}

export async function updatePublicSchoolItem(id: number, input: { title: string; category: SchoolItemCategory; startDate: string; endDate: string | null; description: string | null }) {
  const client = requireClient();
  const { error } = await client.from("school_items").update({
    title: input.title,
    category: input.category,
    start_date: input.startDate,
    end_date: input.endDate,
    description: input.description,
  }).eq("id", id);
  if (error) throw error;
}

export async function deletePublicSchoolItem(id: number) {
  const client = requireClient();
  const { error } = await client.from("school_items").delete().eq("id", id);
  if (error) throw error;
}

export async function getProfileRole(userId: string) {
  const client = requireClient();
  const { data, error } = await client.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data?.role as "user" | "admin" | null) ?? "user";
}
