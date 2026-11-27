import { createClient } from "@supabase/supabase-js";
import { ASET as CADANGAN } from "./data";
import { petaAset } from "./petaAset";

// Membaca katalog di sisi server (halaman beranda dan detail aset). Bila database tidak terjangkau,
// jatuh ke data cadangan agar halaman publik tetap tampil.
export async function ambilAsetServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !kunci) return CADANGAN;
  try {
    const db = createClient(url, kunci, { auth: { persistSession: false } });
    const [k, a, t, f] = await Promise.all([
      db.from("kategori_aset").select("*"), db.from("aset").select("*"), db.from("tarif_aset").select("*"), db.from("foto_aset").select("*").order("urutan"),
    ]);
    if (a.error || k.error || !a.data?.length) return CADANGAN;
    const sub = Object.fromEntries(k.data.map((x) => [x.id, x.nama]));
    const per = (arr, key) => arr.reduce((m, r) => { (m[r[key]] ??= []).push(r); return m; }, {});
    const tb = per(t.data ?? [], "aset_id"), fb = per(f.data ?? [], "aset_id");
    const urut = new Map(CADANGAN.map((x, i) => [x.slug, i]));
    return a.data
      .map((x) => petaAset(x, tb[x.id] ?? [], fb[x.id] ?? [], sub[x.kategori_id] ?? ""))
      .sort((x, y) => (urut.get(x.slug) ?? 999) - (urut.get(y.slug) ?? 999) || x.kode.localeCompare(y.kode));
  } catch {
    return CADANGAN;
  }
}
