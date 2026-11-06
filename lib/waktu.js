// Utilitas tanggal dan jadwal (data jadwal di sini hanya simulasi untuk tampilan front end).

export const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const HARI_PANJANG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export const SESI = [
  { id: 1, nama: "SESI 1: 07.00 – 11.30 WIB (PAGI)", slot: [["07.00", "08.00"], ["08.00", "10.00"], ["10.00", "11.30"]] },
  { id: 2, nama: "SESI 2: 12.30 – 18.00 WIB (SIANG / SORE)", slot: [["12.30", "15.30"], ["15.30", "17.30"], ["17.30", "18.00"]] },
];

const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const tambahHari = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const mulaiHari = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const minTanggalSewa = () => tambahHari(mulaiHari(), 2); // H-2
export const formatTanggal = (d) => `${HARI_PANJANG[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

// status hari: "tidak" (Minggu / sebelum H-2 / aset nonaktif), "terisi", atau "tersedia"
export function statusHari(aset, d) {
  if (aset.status === "Tidak tersedia") return "tidak";
  if (d.getDay() === 0) return "tidak";
  if (d < minTanggalSewa()) return "tidak";
  return hash(`${aset.slug}|${toISO(d)}`) < 16 ? "terisi" : "tersedia";
}

// status slot pada hari yang tersedia
export function statusSlot(aset, d, sesiId, idx) {
  const hari = statusHari(aset, d);
  if (hari === "terisi") return { terisi: true, ket: null };
  const h = hash(`${aset.slug}|${toISO(d)}|${sesiId}|${idx}`);
  if (h < 22) return { terisi: true, ket: aset.subkategori === "Laboratorium" ? "Praktikum" : "Kegiatan Lain" };
  return { terisi: false };
}

// opsi jam untuk pilihan mulai/selesai (langkah 30 menit; istirahat 11.30–12.30 tidak dapat dipilih)
function buatJam(dari, sampai) {
  const out = [];
  for (let m = dari; m <= sampai; m += 30) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}
export const JAM_SESI1 = buatJam(7 * 60, 11 * 60 + 30);
export const JAM_SESI2 = buatJam(12 * 60 + 30, 18 * 60);
export const SEMUA_JAM = [...JAM_SESI1, ...JAM_SESI2];
const menit = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const sesiMulai = (t) => (menit(t) < 11 * 60 + 30 ? 1 : 2);
export const sesiSelesai = (t) => (menit(t) <= 11 * 60 + 30 ? 1 : 2);
export const durasiJam = (mulai, selesai) => (menit(selesai) - menit(mulai)) / 60;
export const ke_wib = (t) => `${t} WIB`;
