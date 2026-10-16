import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tlkzhoxkzupfwbpjmgmm.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ub8jgBHiicz-ht2OZJpbWw_ehCCsF8s";

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseKey);
  }
  return clientInstance;
}

export const supabase = getSupabase();
