"use client";

// Aksi admin/petugas terhadap transaksi (simulasi). Pada backend menjadi pemanggilan API/RPC Supabase.
import { ubahTransaksi, hitungDendaTelat, totalDenda } from "./transaksi";
import { ambilPengaturan } from "./pengaturan";
import { ubahAset } from "./asetStore";
import { fromISO } from "./waktu";

const H = 3600 * 1000;

export function setujui(t, catatan) {
  const { batasBayarJam } = ambilPengaturan();
  const now = Date.now();
  const batas = Math.max(now + 2 * H, Math.min(now + batasBayarJam * H, fromISO(t.tanggalMulai).getTime() - 15 * H));
  ubahTransaksi(t.kode, { pembayaran: "belum_dibayar", batasBayar: batas, catatanAdmin: catatan?.trim() || "Disetujui." }, "disetujui");
}
export const tolak = (t, catatan) => ubahTransaksi(t.kode, { catatanAdmin: catatan.trim() }, "ditolak");
export const verifikasiLunas = (t) => ubahTransaksi(t.kode, { pembayaran: "lunas", alasanBukti: null });
export const tolakBukti = (t, alasan) => ubahTransaksi(t.kode, { pembayaran: "bukti_ditolak", alasanBukti: alasan.trim() });
export const selesaikan = (t) => ubahTransaksi(t.kode, {}, "selesai");

export function batalkanOlehKampus(t, alasan) {
  const dibayar = ["lunas", "menunggu_verifikasi"].includes(t.pembayaran);
  const refund = { persen: dibayar ? 100 : 0, nominal: dibayar ? t.total : 0, ket: "Dibatalkan oleh pihak kampus.", diproses: !dibayar };
  ubahTransaksi(t.kode, { refund, alasanBatal: alasan.trim(), catatanAdmin: `Dibatalkan oleh pihak kampus: ${alasan.trim()}` }, "dibatalkan");
}
export const tandaiRefund = (t) => ubahTransaksi(t.kode, { refund: { ...t.refund, diproses: true } });

export function catatSerahTerima(t, { jumlah, kondisi, catatan }, petugas) {
  ubahTransaksi(t.kode, { serahTerima: { waktu: Date.now(), petugas, jumlah, kondisi, catatan: catatan?.trim() ?? "" } }, "sedang_disewa");
}

export function catatPengembalian(t, aset, f, petugas) {
  const aktualMs = f.waktu;
  const telat = hitungDendaTelat(t, aktualMs, ambilPengaturan());
  const kerusakan = f.kondisi === "baik" ? 0 : Math.max(0, Number(f.dendaKerusakan) || 0);
  const denda = telat.nominal > 0 || kerusakan > 0
    ? { keterlambatan: telat.nominal, ketTelat: telat.nominal > 0 ? telat.rumus : "", kerusakan, kerusakanKet: f.catatan?.trim() ?? "", konfirmasi: kerusakan > 0 ? "menunggu" : "dikonfirmasi", statusBayar: "belum_dibayar" }
    : null;
  ubahTransaksi(t.kode, {
    pengembalian: { waktu: aktualMs, petugas, jumlah: f.jumlah, kondisi: f.kondisi, jumlahRusak: f.kondisi === "baik" ? 0 : f.jumlahRusak, catatan: f.catatan?.trim() ?? "" },
    ...(denda ? { denda } : {}),
  }, "dikembalikan");
  // dampak ke ketersediaan aset
  if (aset && f.kondisi !== "baik") {
    if (t.kategori === "peralatan") {
      const rusak = Math.min(f.jumlahRusak, aset.stok);
      const sisa = Math.max(0, aset.stok - rusak);
      const totalRusak = (aset.stokTotal ?? aset.stok) - sisa;
      ubahAset(aset.slug, { stok: sisa, kondisi: `${totalRusak} unit ${f.kondisi === "rusak_berat" ? "rusak berat" : "rusak ringan"}, ${sisa} baik` });
    } else if (f.kondisi === "rusak_berat") ubahAset(aset.slug, { kondisi: "Rusak Berat", status: "Tidak tersedia", statusKet: "rusak berat" });
    else ubahAset(aset.slug, { kondisi: "Rusak Ringan" });
  }
}

export const konfirmasiDendaKerusakan = (t, nominal) => ubahTransaksi(t.kode, { denda: { ...t.denda, kerusakan: nominal, konfirmasi: "dikonfirmasi" } });
export const lunasDenda = (t) => ubahTransaksi(t.kode, { denda: { ...t.denda, statusBayar: "lunas" } });
export { totalDenda };
