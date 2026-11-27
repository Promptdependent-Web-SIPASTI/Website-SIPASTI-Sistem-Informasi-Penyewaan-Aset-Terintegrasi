import { createClient } from "@supabase/supabase-js";

// Klien Supabase (kunci anon aman di peramban; keamanan data dijaga RLS di database).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseSiap = Boolean(url && kunci);
export const supabase = supabaseSiap
  ? createClient(url, kunci, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;
