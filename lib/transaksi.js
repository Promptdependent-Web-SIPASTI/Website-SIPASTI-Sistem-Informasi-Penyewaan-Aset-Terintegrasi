"use client";

// Penyimpanan transaksi SIMULASI di localStorage (tahap front end).
// Akan diganti tabel Supabase (penyewaan, pembayaran, dst.) pada tahap backend.

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getAset, rupiah } from "./data";
import { BULAN, fromISO, mulaiHari, statusHari, tambahHari, toISO } from "./waktu";

const KEY = "sipasti_demo_transaksi";
const EVT = "sipasti-data";
const JAM = 3600 * 1000;
const HARI_MS = 24 * JAM;

export const EMAIL_DEMO = "mahasiswa@students.unnes.ac.id";

// ---------- metadata status ----------
export const STATUS_TRX = {
  diajukan: { label: "Diajukan", warna: "text-orange-600 bg-orange-50", titik: "bg-orange-500" },
  disetujui: { label: "Disetujui", warna: "text-emerald-700 bg-emerald-50", titik: "bg-emerald-500" },
  sedang_disewa: { label: "Sedang Disewa", warna: "text-sky bg-pale/70", titik: "bg-sky" },
  dikembalikan: { label: "Dikembalikan", warna: "text-teal-700 bg-teal-50", titik: "bg-teal-500" },
  selesai: { label: "Selesai", warna: "text-emerald-700 bg-emerald-50", titik: "bg-emerald-500" },
  ditolak: { label: "Ditolak", warna: "text-red-700 bg-red-50", titik: "bg-red-500" },
  dibatalkan: { label: "Dibatalkan", warna: "text-slate-600 bg-slate-100", titik: "bg-slate-400" },
};
export const STATUS_BAYAR = {
  tidak_ada: { label: "—", warna: "text-slate-500 bg-slate-100" },
  belum_dibayar: { label: "Belum Dibayar", warna: "text-orange-600 bg-orange-50" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", warna: "text-sky bg-pale/70" },
  lunas: { label: "Lunas", warna: "text-emerald-700 bg-emerald-50" },
  bukti_ditolak: { label: "Bukti Ditolak", warna: "text-red-700 bg-red-50" },
};
export const LANGKAH_ALUR = [
  ["diajukan", "Diajukan"],
  ["disetujui", "Disetujui"],
  ["sedang_disewa", "Sedang Disewa"],
  ["dikembalikan", "Dikembalikan"],
  ["selesai", "Selesai"],
];

// ---------- format ----------
const pad = (n) => String(n).padStart(2, "0");
export const fmtTgl = (iso) => {
  const d = fromISO(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};
export const fmtTglPendek = (iso) => {
  const d = fromISO(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};
export const fmtWaktu = (ms) => {
  const d = new Date(ms);
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}, ${pad(d.getHours())}.${pad(d.getMinutes())}`;
};
export const fmtJam = (t) => t.replace(":", ".");
export function periodeTeks(t) {
  if (t.satuan === "jam") return `${fmtTglPendek(t.tanggalMulai)}, ${fmtJam(t.jamMulai)}–${fmtJam(t.jamSelesai)}`;
  if (t.tanggalSelesai && t.tanggalSelesai !== t.tanggalMulai) {
    const a = fromISO(t.tanggalMulai), b = fromISO(t.tanggalSelesai);
    return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${BULAN[b.getMonth()].slice(0, 3)} ${b.getFullYear()}` : `${fmtTglPendek(t.tanggalMulai)} – ${fmtTglPendek(t.tanggalSelesai)}`;
  }
  return fmtTglPendek(t.tanggalMulai);
}
export const asetTeks = (t) => {
  const aset = getAset(t.asetSlug);
  const nama = aset?.nama2 ?? t.asetNama;
  if (t.kategori === "peralatan") return `${t.asetNama} (${t.jumlah} ${aset?.stokSatuan ?? "unit"})`;
  return nama;
};
export const satuanTeks = (t) => ({ jam: "Per jam", hari: "Per hari", kegiatan: "Per kegiatan", unit: "Per unit" }[t.satuan] ?? t.satuan);
export function rumusBiaya(t) {
  const unit = t.satuan === "jam" ? "jam" : t.satuan === "hari" ? "hari" : "kegiatan";
  const bagian = [`${rupiah(t.tarif)}`, ...(t.satuan === "kegiatan" ? [] : [`${t.durasi} ${unit}`])];
  const jml = t.kategori === "peralatan" ? `${t.jumlah} ${getAset(t.asetSlug)?.stokSatuan ?? "unit"}` : "1 ruangan";
  return `${bagian.join(" × ")} × ${jml}`;
}

// ---------- refund (aturan pembatalan) ----------
export function hitungRefund(t, sekarangMs = Date.now()) {
  if (t.status === "diajukan") return { persen: 0, nominal: 0, ket: "Pengajuan belum disetujui, tidak dikenai biaya." };
  if (t.pembayaran !== "lunas" && t.pembayaran !== "menunggu_verifikasi")
    return { persen: 0, nominal: 0, ket: "Belum ada pembayaran, sehingga tidak ada dana yang dikembalikan." };
  const selisih = Math.floor((fromISO(t.tanggalMulai).getTime() - mulaiHari(new Date(sekarangMs)).getTime()) / HARI_MS);
  const persen = selisih >= 3 ? 100 : selisih >= 1 ? 50 : 0;
  return {
    persen,
    nominal: Math.round((t.total * persen) / 100),
    ket: persen === 100 ? "Dibatalkan H-3 atau lebih awal." : persen === 50 ? "Dibatalkan pada rentang H-2 sampai H-1." : "Dibatalkan kurang dari H-1.",
  };
}

// ---------- seed ----------
function hindariMinggu(d) {
  return d.getDay() === 0 ? tambahHari(d, 1) : d;
}
function buatSeed(sekarang) {
  const now = sekarang.getTime();
  const t = mulaiHari(sekarang);
  const tgl = (n) => toISO(hindariMinggu(tambahHari(t, n)));
  const dasar = (slug) => {
    const a = getAset(slug);
    return { asetSlug: slug, asetNama: a.nama, kodeAset: a.kode, kategori: a.kategori, satuan: a.satuan, tarif: a.tarif, email: EMAIL_DEMO, dokumen: [], jumlah: 1 };
  };
  const dokumenLengkap = (lab) => [
    { jenis: "Surat Permohonan", nama: lab ? "Surat_Izin_Lab_Fisika.pdf" : "Surat_Permohonan_Izin.pdf", ukuran: "1.2 MB" },
    { jenis: "Identitas / Kartu Tanda Mahasiswa (KTM)", nama: "KTM_RizkyPratama.jpg", ukuran: "850 KB" },
  ];
  const disetujui4 = now - (1 * JAM + 48 * 60 * 1000);
  return [
    { ...dasar("proyektor-dan-layar-proyektor"), kode: "SPT-0003", jumlah: 2, durasi: 1, tanggalMulai: tgl(-1), tanggalSelesai: tgl(-1), total: 200000, tujuan: "Presentasi tugas akhir kelompok.", status: "sedang_disewa", pembayaran: "lunas", dokumen: dokumenLengkap(false), catatanAdmin: "Disetujui. Mohon dikembalikan dalam kondisi baik.", dibuat: now - 4 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 4 * HARI_MS }, { s: "disetujui", w: now - 3.5 * HARI_MS }, { s: "sedang_disewa", w: now - 1 * HARI_MS + 8 * JAM }] },
    { ...dasar("laboratorium-fisika"), kode: "SPT-0004", durasi: 3, tanggalMulai: tgl(6), tanggalSelesai: tgl(6), jamMulai: "08:00", jamSelesai: "11:00", total: 375000, tujuan: "Praktikum tambahan mata kuliah Fisika Dasar bagi kelompok studi mahasiswa semester ganjil.", status: "disetujui", pembayaran: "belum_dibayar", batasBayar: disetujui4 + 24 * JAM, dokumen: dokumenLengkap(true), catatanAdmin: "Disetujui. Mohon menjaga kebersihan laboratorium dan memastikan peralatan optik dimatikan setelah sesi berakhir.", dibuat: now - 2 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 2 * HARI_MS }, { s: "disetujui", w: disetujui4 }] },
    { ...dasar("kamera-mirrorless"), kode: "SPT-0006", durasi: 1, tanggalMulai: tgl(12), tanggalSelesai: tgl(12), total: 250000, tujuan: "Dokumentasi kegiatan seminar himpunan.", status: "diajukan", pembayaran: "tidak_ada", dokumen: dokumenLengkap(false), dibuat: now - 3 * JAM, riwayat: [{ s: "diajukan", w: now - 3 * JAM }] },
    { ...dasar("ruang-rapat-besar-gedung-ukm"), kode: "SPT-0005", durasi: 3, tanggalMulai: tgl(-5), tanggalSelesai: tgl(-5), jamMulai: "13:00", jamSelesai: "16:00", total: 450000, tujuan: "Rapat koordinasi panitia kegiatan.", status: "ditolak", pembayaran: "tidak_ada", dokumen: dokumenLengkap(false), catatanAdmin: "Jadwal bentrok dengan kegiatan fakultas pada waktu yang sama.", dibuat: now - 7 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 7 * HARI_MS }, { s: "ditolak", w: now - 6.5 * HARI_MS }] },
    { ...dasar("mikrofon-wireless"), kode: "SPT-0002", jumlah: 2, durasi: 1, tanggalMulai: tgl(-9), tanggalSelesai: tgl(-9), total: 80000, tujuan: "Kegiatan bedah buku.", status: "selesai", pembayaran: "lunas", dokumen: dokumenLengkap(false), dibuat: now - 14 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 14 * HARI_MS }, { s: "disetujui", w: now - 13 * HARI_MS }, { s: "sedang_disewa", w: now - 9 * HARI_MS }, { s: "dikembalikan", w: now - 9 * HARI_MS + 6 * JAM }, { s: "selesai", w: now - 9 * HARI_MS + 8 * JAM }] },
    { ...dasar("laboratorium-ilmu-komputer"), kode: "SPT-0001", durasi: 3, tanggalMulai: tgl(-17), tanggalSelesai: tgl(-17), jamMulai: "13:00", jamSelesai: "16:00", total: 600000, tujuan: "Pelatihan pemrograman web untuk mahasiswa.", status: "selesai", pembayaran: "lunas", dokumen: dokumenLengkap(false), dibuat: now - 24 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 24 * HARI_MS }, { s: "disetujui", w: now - 23 * HARI_MS }, { s: "sedang_disewa", w: now - 17 * HARI_MS }, { s: "dikembalikan", w: now - 17 * HARI_MS + 4 * JAM }, { s: "selesai", w: now - 17 * HARI_MS + 6 * JAM }] },
  ];
}

let seedCache = null;
const seedRaw = () => (seedCache ??= JSON.stringify(buatSeed(new Date())));
const getRaw = () => {
  try { return localStorage.getItem(KEY) ?? seedRaw(); } catch { return seedRaw(); }
};
const subscribe = (cb) => {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
};

function tulis(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new Event(EVT));
}
const bacaSemua = () => JSON.parse(getRaw());

export function nomorBerikut() {
  const maks = bacaSemua().reduce((m, t) => Math.max(m, Number(t.kode.replace("SPT-", "")) || 0), 0);
  return `SPT-${String(maks + 1).padStart(4, "0")}`;
}
export function tambahTransaksi(t) {
  const kode = nomorBerikut();
  const now = Date.now();
  tulis([{ ...t, kode, status: "diajukan", pembayaran: "tidak_ada", dibuat: now, riwayat: [{ s: "diajukan", w: now }] }, ...bacaSemua()]);
  return kode;
}
export function ubahTransaksi(kode, patch, status) {
  tulis(
    bacaSemua().map((t) => {
      if (t.kode !== kode) return t;
      const baru = { ...t, ...patch };
      if (status && status !== t.status) {
        baru.status = status;
        baru.riwayat = [...t.riwayat, { s: status, w: Date.now() }];
      }
      return baru;
    })
  );
}
export const setelUlang = () => {
  localStorage.removeItem(KEY);
  seedCache = null;
  window.dispatchEvent(new Event(EVT));
};

// Hook: daftar transaksi milik email tertentu (urut terbaru). siap=false sebelum hidrasi.
export function useTransaksi(email) {
  const raw = useSyncExternalStore(subscribe, getRaw, () => null);
  return useMemo(() => {
    if (raw === null) return { siap: false, items: [] };
    const semua = JSON.parse(raw);
    const urut = semua.filter((t) => t.email === email).sort((a, b) => b.dibuat - a.dibuat);
    return { siap: true, items: urut };
  }, [raw, email]);
}

// ---------- validasi jadwal untuk form pengajuan ----------
export function cariTanggalAwal(aset, hariIniISO) {
  let d = tambahHari(fromISO(hariIniISO), 2);
  for (let i = 0; i < 60; i++) {
    if (statusHari(aset, d) === "tersedia") return toISO(d);
    d = tambahHari(d, 1);
  }
  return "";
}

// Simulasi tugas terjadwal: transaksi yang melewati batas waktu bayar otomatis dibatalkan.
export function useOtomatisBatal(email) {
  const { siap, items } = useTransaksi(email);
  useEffect(() => {
    if (!siap) return;
    const now = Date.now();
    items.forEach((t) => {
      if (t.status === "disetujui" && ["belum_dibayar", "bukti_ditolak"].includes(t.pembayaran) && t.batasBayar && t.batasBayar < now) {
        ubahTransaksi(t.kode, { catatanAdmin: "Dibatalkan otomatis: batas waktu pembayaran terlewat." }, "dibatalkan");
      }
    });
  }, [siap, items]);
}
