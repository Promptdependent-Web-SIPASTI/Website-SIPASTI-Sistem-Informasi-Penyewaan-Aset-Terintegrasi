"use client";

// Metadata status, format tampilan, dan perhitungan transaksi. Data transaksi dimuat dari Supabase (lihat store.js).

import { useEffect, useMemo } from "react";
import { getAset, rupiah } from "./data";
import { BULAN, fromISO, mulaiHari, statusHari, tambahHari, toISO } from "./waktu";
import { supabase } from "./supabase";
import { keadaan, segarkan, useVersi } from "./store";

const JAM = 3600 * 1000;
const HARI_MS = 24 * JAM;

export { batasKembaliMs, hitungDendaTelat } from "./denda";

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

// ---------- hook data ----------
// Seluruh transaksi yang boleh dilihat pengguna saat ini (RLS: penyewa hanya miliknya; petugas/admin semuanya).
export function useSemuaTransaksi() {
  const v = useVersi();
  return useMemo(() => {
    const s = keadaan();
    return { siap: s.transaksiSiap, items: s.transaksi };
  }, [v]);
}

// Transaksi milik email tertentu (urut terbaru). siap=false sebelum data termuat.
export function useTransaksi(email) {
  const v = useVersi();
  return useMemo(() => {
    const s = keadaan();
    return { siap: s.transaksiSiap, items: s.transaksi.filter((t) => t.email === email) };
  }, [v, email]);
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

// Transaksi yang melewati batas bayar dibatalkan oleh fungsi database `batalkan_kedaluwarsa()`.
// Dipanggil berkala saat dashboard terbuka; bila pg_cron aktif, fungsi yang sama juga berjalan terjadwal.
export function useOtomatisBatal() {
  const { siap } = useSemuaTransaksi();
  useEffect(() => {
    if (!siap || !supabase) return;
    const jalan = async () => {
      if (!keadaan().sesi) return;
      try {
        const { data } = await supabase.rpc("batalkan_kedaluwarsa");
        if (data > 0) await segarkan();
      } catch {}
    };
    jalan();
    const t = setInterval(jalan, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [siap]);
}

// ---------- penyewa, jadwal, dan denda ----------
export const TIPE_LABEL = { mahasiswa: "Mahasiswa", dosen: "Dosen", staf: "Staf" };
export const penyewaTeks = (t) => t.penyewa?.nama ?? t.email;
export const penyewaUnit = (t) => t.penyewa?.unit ?? TIPE_LABEL[t.penyewa?.tipe] ?? "";

export const totalDenda = (t) => (t.denda ? (t.denda.keterlambatan || 0) + (t.denda.konfirmasi === "dikonfirmasi" ? t.denda.kerusakan || 0 : 0) : 0);
export const dendaBelumBayar = (t) => (t.denda && t.denda.statusBayar === "belum_dibayar" && t.denda.konfirmasi === "dikonfirmasi" ? totalDenda(t) : 0);
export const mulaiMs = (t) => {
  const d = fromISO(t.tanggalMulai);
  const [h, m] = (t.jamMulai ?? "07:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

// Kontrak sewa diterbitkan database saat pembayaran dinyatakan lunas (kolom nomor_kontrak pada tabel pembayaran).
export const pastikanKontrak = (t) => t.kontrak ?? null;
