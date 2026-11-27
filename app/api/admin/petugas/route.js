import { createClient } from "@supabase/supabase-js";

// Membuat akun petugas (hanya admin). Memakai kunci service_role yang HANYA ada di server (env Vercel),
// tidak pernah dikirim ke peramban.
export const runtime = "nodejs";

const balas = (pesan, status = 400) => Response.json({ pesan }, { status });

export async function POST(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const layanan = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !layanan) return balas("Server belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY belum diisi).", 500);

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return balas("Silakan login terlebih dahulu.", 401);

  // 1) pastikan pemanggil adalah admin aktif (dibaca dengan hak pemanggil sendiri)
  const pemanggil = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: u, error: eu } = await pemanggil.auth.getUser(token);
  if (eu || !u?.user) return balas("Sesi tidak valid.", 401);
  const { data: profil } = await pemanggil.from("profil_pengguna").select("peran, aktif").eq("id", u.user.id).maybeSingle();
  if (!profil || profil.peran !== "admin" || !profil.aktif) return balas("Hanya admin yang dapat membuat akun petugas.", 403);

  // 2) validasi masukan
  const { nama, email, sandi } = await req.json().catch(() => ({}));
  if (!nama || String(nama).trim().length < 3) return balas("Nama wajib diisi.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "")) return balas("Format email tidak valid.");
  if (!sandi || String(sandi).length < 8) return balas("Kata sandi minimal 8 karakter.");

  // 3) buat akun lalu tetapkan peran petugas
  const admin = createClient(url, layanan, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({ email: String(email).trim(), password: sandi, email_confirm: true, user_metadata: { nama: String(nama).trim() } });
  if (error) return balas(/already|registered/i.test(error.message) ? "Email ini sudah terdaftar." : error.message);
  const { error: ep } = await admin.from("profil_pengguna").update({ peran: "petugas", nama: String(nama).trim() }).eq("id", data.user.id);
  if (ep) return balas(ep.message, 500);
  return Response.json({ ok: true });
}
