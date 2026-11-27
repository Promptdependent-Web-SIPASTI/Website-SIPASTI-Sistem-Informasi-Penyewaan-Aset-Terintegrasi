"use client";

// Aksi admin/petugas terhadap transaksi. Semuanya memanggil fungsi database (RPC) yang memeriksa peran dan aturan bisnis.
import { kondisiDariTeks, rpc } from "./store";

// Membungkus aksi agar kesalahan dari database tampil sebagai pesan, bukan error tak tertangani.
const aman = (fn) => async (...args) => {
  try {
    await fn(...args);
    return true;
  } catch (e) {
    if (typeof window !== "undefined") window.alert(e.message);
    return false;
  }
};

export const setujui = aman((t, catatan) => rpc("setujui_penyewaan", { p_id: t.id, p_catatan: catatan?.trim() || "Disetujui." }));
export const tolak = aman((t, catatan) => rpc("tolak_penyewaan", { p_id: t.id, p_catatan: catatan.trim() }));
export const verifikasiLunas = aman((t) => rpc("verifikasi_pembayaran", { p_id: t.id, p_setuju: true }));
export const tolakBukti = aman((t, alasan) => rpc("verifikasi_pembayaran", { p_id: t.id, p_setuju: false, p_catatan: alasan.trim() }));
export const selesaikan = aman((t) => rpc("selesaikan_penyewaan", { p_id: t.id }));
export const batalkanOlehKampus = aman((t, alasan) => rpc("batalkan_penyewaan", { p_id: t.id, p_alasan: alasan.trim() }));
export const batalkanOlehPenyewa = aman((t, alasan) => rpc("batalkan_penyewaan", { p_id: t.id, p_alasan: alasan?.trim() || null }));
export const tandaiRefund = aman((t) => rpc("tandai_refund", { p_id: t.id }));

export const catatSerahTerima = aman((t, { jumlah, kondisi, catatan }) =>
  rpc("catat_serah_terima", { p_id: t.id, p_jumlah: jumlah, p_kondisi: kondisiDariTeks(kondisi), p_catatan: catatan?.trim() || null })
);

// Dampak ke kondisi dan stok aset dihitung di database (fungsi catat_pengembalian).
export const catatPengembalian = aman((t, _aset, f) =>
  rpc("catat_pengembalian", {
    p_id: t.id,
    p_waktu: new Date(f.waktu).toISOString(),
    p_jumlah_kembali: f.jumlah,
    p_kondisi: f.kondisi,
    p_catatan: f.catatan?.trim() || null,
    p_jumlah_rusak: f.kondisi === "baik" ? 0 : t.kategori === "peralatan" ? f.jumlahRusak : 0,
    p_denda_kerusakan: f.kondisi === "baik" ? 0 : Math.max(0, Number(f.dendaKerusakan) || 0),
    p_catatan_kerusakan: f.catatan?.trim() || null,
  })
);

export const konfirmasiDendaKerusakan = aman((t, nominal) => rpc("konfirmasi_denda", { p_denda_id: t.denda.idKerusakan, p_nominal: nominal }));
export const lunasDenda = aman(async (t) => {
  for (const id of t.denda.ids.slice(0, -1)) await rpc("lunasi_denda", { p_denda_id: id }, { segar: false });
  await rpc("lunasi_denda", { p_denda_id: t.denda.ids.at(-1) }); // yang terakhir sekaligus menyegarkan data
});
export { totalDenda } from "./transaksi";
