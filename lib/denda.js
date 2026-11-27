import { getAset, rupiah } from "./data";
import { fromISO } from "./waktu";

// Batas pengembalian (ms): jam selesai untuk sewa per jam, selain itu 18.00 pada tanggal selesai.
export function batasKembaliMs(t) {
  const d = fromISO(t.satuan === "jam" ? t.tanggalMulai : t.tanggalSelesai || t.tanggalMulai);
  const [h, m] = (t.satuan === "jam" ? t.jamSelesai : "18:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// Denda keterlambatan: persen × tarif × unit waktu (dibulatkan ke atas setelah toleransi) × jumlah, maks 100% total.
// Rumus yang sama dipakai di database (fungsi hitung_denda_terlambat); ini untuk pratinjau di layar petugas.
export function hitungDendaTelat(t, aktualMs, { dendaPersen, toleransiMenit }) {
  const telatMenit = Math.max(0, Math.round((aktualMs - batasKembaliMs(t)) / 60000));
  if (telatMenit <= toleransiMenit) return { telatMenit, unit: 0, nominal: 0, satuanUnit: t.satuan === "jam" ? "jam" : "hari", rumus: "Tidak terlambat (dalam toleransi)." };
  const unitMenit = t.satuan === "jam" ? 60 : 1440;
  const unit = Math.ceil(telatMenit / unitMenit);
  const jumlah = t.kategori === "peralatan" ? t.jumlah : 1;
  const nominal = Math.min(t.total, Math.round((dendaPersen / 100) * t.tarif * unit * jumlah));
  const sat = t.satuan === "jam" ? "jam" : "hari";
  return { telatMenit, unit, nominal, satuanUnit: sat, rumus: `${dendaPersen}% × ${rupiah(t.tarif)} × ${unit} ${sat}${jumlah > 1 ? ` × ${jumlah} ${getAset(t.asetSlug)?.stokSatuan ?? "unit"}` : ""} = ${rupiah(nominal)}` };
}
