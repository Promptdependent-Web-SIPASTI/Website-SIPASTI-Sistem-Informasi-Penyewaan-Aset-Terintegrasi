// Pemetaan baris tabel `aset` ke bentuk yang dipakai tampilan. Tanpa "use client" agar dapat dipakai di server.
export const KONDISI_LABEL = { baik: "Baik", rusak_ringan: "Rusak Ringan", rusak_berat: "Rusak Berat", pemeliharaan: "Dalam Pemeliharaan" };
export const kondisiDariTeks = (t = "") => (/rusak berat/i.test(t) ? "rusak_berat" : /pemeliharaan/i.test(t) ? "pemeliharaan" : /rusak/i.test(t) ? "rusak_ringan" : "baik");
const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

function urlFoto(slug, fotos) {
  const f = fotos[0];
  if (f && f.penyimpanan === "r2" && R2_BASE) return `${R2_BASE}/${f.object_key}`;
  return `/images/aset/${slug}.jpg`;
}

export function petaAset(a, tarif = [], foto = [], sub = "") {
  const ruang = a.jenis === "ruangan";
  const blok = a.kondisi === "pemeliharaan" || a.kondisi === "rusak_berat";
  const tidak = !a.aktif || blok;
  const rusak = a.stok_rusak || 0;
  const tr = tarif[0];
  const kondisi = !ruang && rusak > 0
    ? `${rusak} unit ${a.kondisi === "rusak_berat" ? "rusak berat" : "rusak ringan"}, ${a.stok_tersedia} baik`
    : KONDISI_LABEL[a.kondisi];
  return {
    id: a.id, slug: a.slug, kode: a.kode, nama: a.nama,
    ...(a.nama_lengkap ? { nama2: a.nama_lengkap } : {}),
    kategori: a.jenis, subkategori: sub, lokasi: a.lokasi ?? "",
    ...(a.pengelola ? { pengelola: a.pengelola } : {}),
    ...(ruang ? { kapasitas: a.kapasitas, ...(a.kapasitas_satuan ? { kapasitasSatuan: a.kapasitas_satuan } : {}) } : { stok: a.stok_tersedia, stokTotal: a.stok_total, ...(a.stok_satuan ? { stokSatuan: a.stok_satuan } : {}) }),
    kondisi, ...(a.kondisi_detail ? { kondisiDetail: a.kondisi_detail } : {}),
    status: tidak ? "Tidak tersedia" : "Tersedia",
    ...(tidak ? { statusKet: a.kondisi === "rusak_berat" ? "rusak berat" : a.kondisi === "pemeliharaan" ? "perawatan" : "dinonaktifkan" } : {}),
    satuan: tr?.satuan ?? "hari", tarif: Number(tr?.nominal ?? 0),
    ringkas: a.ringkas ?? "", deskripsi: a.deskripsi ?? "", fasilitas: a.fasilitas ?? "",
    ...(a.dokumen_khusus ? { dokumenKhusus: a.dokumen_khusus } : {}),
    aturan: a.aturan ?? [], foto: urlFoto(a.slug, foto), aktifDb: a.aktif, kondisiDb: a.kondisi,
  };
}

