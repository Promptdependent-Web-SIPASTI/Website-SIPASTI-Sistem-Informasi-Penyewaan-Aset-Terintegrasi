// Autentikasi SIMULASI untuk tahap front end (data disimpan di localStorage peramban).
// Akan diganti dengan Supabase Auth pada tahap integrasi backend.

export const AKUN_DEMO = [
  { email: "mahasiswa@students.unnes.ac.id", sandi: "Sipasti123", nama: "Budi Santoso", peran: "penyewa", tipe: "mahasiswa" },
  { email: "petugas@mail.unnes.ac.id", sandi: "Sipasti123", nama: "Petugas FMIPA", peran: "petugas" },
  { email: "admin@mail.unnes.ac.id", sandi: "Sipasti123", nama: "Admin SIPASTI", peran: "admin" },
];

const KEY_AKUN = "sipasti_demo_accounts";
const KEY_SESI = "sipasti_demo_session";

export const DOMAIN_RESMI = ["@students.unnes.ac.id", "@mail.unnes.ac.id"];
export const emailResmi = (e) => DOMAIN_RESMI.some((d) => e.toLowerCase().endsWith(d));
export const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function baca(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export const akunTerdaftar = () => [...AKUN_DEMO, ...baca(KEY_AKUN, [])];

export function daftarAkun(akun) {
  const semua = akunTerdaftar();
  if (semua.some((a) => a.email.toLowerCase() === akun.email.toLowerCase())) return { ok: false, pesan: "Email ini sudah terdaftar." };
  const sekarang = baca(KEY_AKUN, []);
  localStorage.setItem(KEY_AKUN, JSON.stringify([...sekarang, { ...akun, peran: "penyewa" }]));
  return { ok: true };
}

export function masuk(email, sandi) {
  const a = akunTerdaftar().find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.sandi === sandi);
  if (!a) return null;
  const sesi = { nama: a.nama, email: a.email, peran: a.peran };
  localStorage.setItem(KEY_SESI, JSON.stringify(sesi));
  window.dispatchEvent(new Event("sipasti-sesi"));
  return sesi;
}

export const keluar = () => {
  localStorage.removeItem(KEY_SESI);
  window.dispatchEvent(new Event("sipasti-sesi"));
};
export const sesiSaatIni = () => baca(KEY_SESI, null);
