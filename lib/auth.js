// Autentikasi SIMULASI untuk tahap front end (data disimpan di localStorage peramban).
// Akan diganti dengan Supabase Auth pada tahap integrasi backend.

export const AKUN_DEMO = [
  { email: "mahasiswa@students.unnes.ac.id", sandi: "Sipasti123", nama: "Rizky Pratama", peran: "penyewa", tipe: "mahasiswa", idn: "4201421008", telp: "081234567890" },
  { email: "petugas@mail.unnes.ac.id", sandi: "Sipasti123", nama: "Slamet Riyadi", peran: "petugas" },
  { email: "admin@mail.unnes.ac.id", sandi: "Sipasti123", nama: "Admin FMIPA", peran: "admin" },
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

const KEY_NONAKTIF = "sipasti_demo_nonaktif";
export const daftarNonaktif = () => baca(KEY_NONAKTIF, []);
export function setAktif(email, aktif) {
  const sekarang = new Set(daftarNonaktif());
  if (aktif) sekarang.delete(email); else sekarang.add(email);
  localStorage.setItem(KEY_NONAKTIF, JSON.stringify([...sekarang]));
  window.dispatchEvent(new Event("sipasti-data"));
}

export function daftarAkun(akun, peranAkun = "penyewa") {
  const semua = akunTerdaftar();
  if (semua.some((a) => a.email.toLowerCase() === akun.email.toLowerCase())) return { ok: false, pesan: "Email ini sudah terdaftar." };
  const sekarang = baca(KEY_AKUN, []);
  localStorage.setItem(KEY_AKUN, JSON.stringify([...sekarang, { ...akun, peran: peranAkun }]));
  window.dispatchEvent(new Event("sipasti-data"));
  return { ok: true };
}

export function masuk(email, sandi) {
  const a = akunTerdaftar().find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.sandi === sandi);
  if (!a) return null;
  if (daftarNonaktif().includes(a.email)) return { nonaktif: true };
  const sesi = { nama: a.nama, email: a.email, peran: a.peran, tipe: a.tipe ?? null, idn: a.idn ?? "", telp: a.telp ?? "" };
  localStorage.setItem(KEY_SESI, JSON.stringify(sesi));
  window.dispatchEvent(new Event("sipasti-sesi"));
  return sesi;
}

export const keluar = () => {
  localStorage.removeItem(KEY_SESI);
  try { sessionStorage.setItem("sipasti_keluar", "1"); } catch {}
  window.dispatchEvent(new Event("sipasti-sesi"));
};
export const sesiSaatIni = () => baca(KEY_SESI, null);

export function perbaruiProfil(patch) {
  const sesi = sesiSaatIni();
  if (!sesi) return null;
  const baru = { ...sesi, ...patch };
  localStorage.setItem(KEY_SESI, JSON.stringify(baru));
  const akun = baca(KEY_AKUN, []);
  if (akun.some((a) => a.email === sesi.email)) {
    localStorage.setItem(KEY_AKUN, JSON.stringify(akun.map((a) => (a.email === sesi.email ? { ...a, ...patch } : a))));
  }
  window.dispatchEvent(new Event("sipasti-sesi"));
  return baru;
}
