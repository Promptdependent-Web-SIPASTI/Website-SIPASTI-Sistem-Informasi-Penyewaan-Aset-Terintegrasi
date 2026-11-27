"use client";

// Autentikasi memakai Supabase Auth. Peran dan status aktif diambil dari tabel `profil_pengguna`.
import { supabase } from "./supabase";
import { ambilSesi, keadaan, muatTransaksi, setSesi, useVersi } from "./store";

// Akun contoh dari data dummy (03_data_dummy.sql). Hanya untuk petunjuk di halaman masuk saat demo.
export const AKUN_DEMO = [
  { email: "mahasiswa@students.unnes.ac.id", sandi: "Sipasti123", nama: "Rizky Pratama", peran: "penyewa", tipe: "mahasiswa", idn: "4201421008", telp: "081234567890" },
  { email: "petugas@mail.unnes.ac.id", sandi: "Sipasti123", nama: "Slamet Riyadi", peran: "petugas" },
  { email: "admin@mail.unnes.ac.id", sandi: "Sipasti123", nama: "Admin FMIPA", peran: "admin" },
];

export const DOMAIN_RESMI = ["@students.unnes.ac.id", "@mail.unnes.ac.id"];
export const emailResmi = (e) => DOMAIN_RESMI.some((d) => e.toLowerCase().endsWith(d));
export const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const TIDAK_SIAP = { galat: "Koneksi ke Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY." };

// Mengembalikan sesi, null (email/sandi salah), {nonaktif:true}, {belumKonfirmasi:true}, atau {galat}.
export async function masuk(email, sandi) {
  if (!supabase) return TIDAK_SIAP;
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: sandi });
  if (error) {
    if (/not confirmed/i.test(error.message)) return { belumKonfirmasi: true };
    if (/fetch|network/i.test(error.message)) return { galat: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda." };
    return null;
  }
  const r = await ambilSesi(data.user);
  if (r.nonaktif) { await supabase.auth.signOut(); return { nonaktif: true }; }
  if (r.galat) { await supabase.auth.signOut(); return null; }
  setSesi(r);
  muatTransaksi();
  return r;
}

export const keluar = async () => {
  try { sessionStorage.setItem("sipasti_keluar", "1"); } catch {}
  setSesi(null);
  if (supabase) await supabase.auth.signOut();
};

// Registrasi penyewa mandiri; akun petugas dibuat admin lewat route server (butuh kunci service_role di server).
export async function daftarAkun(akun, peranAkun = "penyewa") {
  if (!supabase) return { ok: false, pesan: TIDAK_SIAP.galat };
  if (peranAkun === "petugas") {
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/petugas", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` },
      body: JSON.stringify({ nama: akun.nama, email: akun.email, sandi: akun.sandi }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, pesan: j.pesan ?? "Akun petugas gagal dibuat." };
    await muatTransaksi();
    return { ok: true };
  }
  const { data, error } = await supabase.auth.signUp({
    email: akun.email.trim(),
    password: akun.sandi,
    options: { data: { nama: akun.nama, tipe: akun.tipe, idn: akun.idn, telepon: akun.telp } },
  });
  if (error) {
    if (/already|registered/i.test(error.message)) return { ok: false, pesan: "Email ini sudah terdaftar." };
    if (/password/i.test(error.message)) return { ok: false, pesan: "Kata sandi terlalu lemah (minimal 8 karakter)." };
    return { ok: false, pesan: `Pendaftaran gagal: ${error.message}` };
  }
  if (data.user && data.user.identities?.length === 0) return { ok: false, pesan: "Email ini sudah terdaftar." };
  if (data.session) await supabase.auth.signOut(); // alur lama: setelah mendaftar, pengguna masuk secara manual
  return { ok: true };
}

export async function perbaruiProfil(patch) {
  const sesi = keadaan().sesi;
  if (!sesi || !supabase) return null;
  const kolom = {};
  if (patch.nama !== undefined) kolom.nama = patch.nama;
  if (patch.telp !== undefined) kolom.telepon = patch.telp;
  const { error } = await supabase.from("profil_pengguna").update(kolom).eq("id", sesi.id);
  if (error) throw new Error(error.message);
  const baru = { ...sesi, ...patch };
  setSesi(baru);
  return baru;
}

// Daftar profil (admin/petugas melihat semua; penyewa hanya dirinya).
export function useProfilList() {
  useVersi();
  return keadaan().profil;
}

export async function setAktif(id, aktif) {
  const { error } = await supabase.from("profil_pengguna").update({ aktif }).eq("id", id);
  if (error) throw new Error(error.message);
  await muatTransaksi();
}
