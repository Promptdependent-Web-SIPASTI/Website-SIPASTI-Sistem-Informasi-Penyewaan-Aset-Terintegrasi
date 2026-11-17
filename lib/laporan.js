// Perhitungan laporan tahunan dari data transaksi (tanpa database: murni dari array transaksi).
import { BULAN } from "./waktu";
import { totalDenda, TIPE_LABEL } from "./transaksi";

// Transaksi yang dihitung: penyewaan terkonfirmasi (disetujui s.d. selesai) dan pembatalan yang sudah dibayar.
export const dihitung = (t) => ["disetujui", "sedang_disewa", "dikembalikan", "selesai"].includes(t.status) || (t.status === "dibatalkan" && t.pembayaran === "lunas");

// Pendapatan bersih = pembayaran lunas − refund yang sudah ditransfer + denda yang sudah lunas.
export function nilaiTransaksi(t) {
  const sewa = t.pembayaran === "lunas" ? t.total : 0;
  const refund = t.refund?.diproses ? t.refund.nominal || 0 : 0;
  const denda = t.denda?.statusBayar === "lunas" ? totalDenda(t) : 0;
  return { sewa, refund, denda, bersih: sewa - refund + denda };
}

export const tahunTersedia = (items) => [...new Set(items.filter(dihitung).map((t) => Number(t.tanggalMulai.slice(0, 4))))].sort((a, b) => b - a);

export function hitungLaporan(items, tahun) {
  const baris = items.filter((t) => dihitung(t) && t.tanggalMulai.startsWith(String(tahun))).map((t) => ({ t, ...nilaiTransaksi(t) })).sort((a, b) => a.t.tanggalMulai.localeCompare(b.t.tanggalMulai));
  const jumlahkan = (arr) => arr.reduce((s, r) => ({ sewa: s.sewa + r.sewa, refund: s.refund + r.refund, denda: s.denda + r.denda, bersih: s.bersih + r.bersih }), { sewa: 0, refund: 0, denda: 0, bersih: 0 });

  const perBulan = BULAN.map((nama, m) => {
    const r = baris.filter((x) => Number(x.t.tanggalMulai.slice(5, 7)) === m + 1);
    return { bulan: nama, transaksi: r.length, penyewa: new Set(r.map((x) => x.t.email)).size, ...jumlahkan(r) };
  });

  const peta = new Map();
  baris.forEach((r) => {
    const k = r.t.email;
    if (!peta.has(k)) peta.set(k, { email: k, nama: r.t.penyewa?.nama ?? k, tipe: TIPE_LABEL[r.t.penyewa?.tipe] ?? "Penyewa", idn: r.t.penyewa?.idn ?? "", unit: r.t.penyewa?.unit ?? "", baris: [] });
    peta.get(k).baris.push(r);
  });
  const penyewa = [...peta.values()].map((p) => ({ ...p, transaksi: p.baris.length, ...jumlahkan(p.baris) })).sort((a, b) => b.bersih - a.bersih || a.nama.localeCompare(b.nama));

  const petaAset = new Map();
  baris.forEach((r) => {
    const k = r.t.asetSlug;
    if (!petaAset.has(k)) petaAset.set(k, { nama: r.t.asetNama, kode: r.t.kodeAset, kategori: r.t.kategori === "ruangan" ? "Fasilitas dan Ruangan" : "Peralatan dan Perlengkapan", baris: [] });
    petaAset.get(k).baris.push(r);
  });
  const perAset = [...petaAset.values()].map((a) => ({ ...a, transaksi: a.baris.length, ...jumlahkan(a.baris) })).sort((a, b) => b.bersih - a.bersih || b.transaksi - a.transaksi);

  return { tahun, baris, perBulan, penyewa, perAset, total: { transaksi: baris.length, penyewa: peta.size, ...jumlahkan(baris) } };
}
