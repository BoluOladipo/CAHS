import { createClient } from "@supabase/supabase-js";

export const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tlkzhoxkzupfwbpjmgmm.supabase.co";

export const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ub8jgBHiicz-ht2OZJpbWw_ehCCsF8s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
