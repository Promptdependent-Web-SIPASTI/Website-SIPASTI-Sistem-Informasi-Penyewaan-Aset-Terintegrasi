"use client";

// Data aset dari tabel `aset`, `tarif_aset`, dan `kategori_aset` (Supabase). Admin menulis langsung (RLS);
// petugas memperbarui kondisi lewat fungsi `ubah_kondisi_aset`.
import { supabase } from "./supabase";
import { ASET, SUBKATEGORI } from "./data";
import { keadaan, kondisiDariTeks, rpc, segarkan, useVersi } from "./store";

export function useAsetList() {
  useVersi();
  return keadaan().aset ?? ASET;
}
export function useSubkategori() {
  useVersi();
  const s = keadaan();
  return s.aset ? s.subkategori : SUBKATEGORI;
}

const cari = (slug) => (keadaan().aset ?? []).find((a) => a.slug === slug);
const galat = (e) => { if (e) throw new Error(e.code === "23505" ? "Kode atau slug aset sudah dipakai." : e.message); };

// Menerima patch berbentuk tampilan (kondisi teks, stok, status) lalu menerjemahkannya ke kolom database.
export async function ubahAset(slug, patch) {
  const a = cari(slug);
  if (!a?.id) throw new Error("Data aset belum termuat dari database.");
  const peran = keadaan().sesi?.peran;
  const kondisi = "kondisi" in patch ? kondisiDariTeks(patch.kondisi) : a.kondisiDb;
  const total = patch.stokTotal ?? a.stokTotal;
  const dariPetugas = !("nama" in patch);
  let rusak;
  if (a.kategori === "peralatan") {
    if ("stok" in patch && dariPetugas) rusak = Math.max(0, (total ?? 0) - patch.stok);
    else if ("kondisi" in patch && kondisi === "baik") rusak = 0;
  }

  if (peran === "petugas") {
    await rpc("ubah_kondisi_aset", { p_aset: a.id, p_kondisi: kondisi, p_stok_rusak: rusak ?? null });
    return;
  }
  const k = {};
  if (patch.nama !== undefined) k.nama = patch.nama;
  if (patch.lokasi !== undefined) k.lokasi = patch.lokasi;
  if (patch.pengelola !== undefined) k.pengelola = patch.pengelola;
  if (patch.kapasitas !== undefined) k.kapasitas = patch.kapasitas;
  if (patch.stokTotal !== undefined) k.stok_total = patch.stokTotal;
  if ("kondisi" in patch) { k.kondisi = kondisi; k.kondisi_detail = null; }
  if (rusak !== undefined) k.stok_rusak = rusak;
  if ("status" in patch) {
    const tidak = patch.status === "Tidak tersedia";
    const blok = kondisi === "pemeliharaan" || kondisi === "rusak_berat";
    k.aktif = !(tidak && !blok);
  }
  if (Object.keys(k).length) galat((await supabase.from("aset").update(k).eq("id", a.id)).error);
  if ("tarif" in patch || "satuan" in patch) {
    const satuan = patch.satuan ?? a.satuan;
    galat((await supabase.from("tarif_aset").delete().eq("aset_id", a.id).neq("satuan", satuan)).error);
    galat((await supabase.from("tarif_aset").upsert({ aset_id: a.id, satuan, nominal: patch.tarif ?? a.tarif }, { onConflict: "aset_id,satuan" })).error);
  }
  await segarkan();
}

export async function tambahAsetBaru(x) {
  const kat = keadaan().kategoriDb ?? [];
  const sub = kat.find((k) => k.induk_id != null && k.nama === x.subkategori) ?? kat.find((k) => k.induk_id == null && k.jenis === x.kategori);
  if (!sub) throw new Error("Subkategori tidak ditemukan.");
  const ruang = x.kategori === "ruangan";
  const kondisi = kondisiDariTeks(x.kondisi);
  const blok = kondisi === "pemeliharaan" || kondisi === "rusak_berat";
  const { data, error } = await supabase.from("aset").insert({
    kode: x.kode, slug: x.slug, nama: x.nama, kategori_id: sub.id, jenis: x.kategori, lokasi: x.lokasi, pengelola: x.pengelola ?? null,
    kapasitas: ruang ? x.kapasitas : null, stok_total: ruang ? null : x.stokTotal, kondisi,
    ringkas: x.ringkas, deskripsi: x.deskripsi, fasilitas: x.fasilitas, aturan: x.aturan, aktif: !(x.status === "Tidak tersedia" && !blok),
  }).select("id").single();
  galat(error);
  galat((await supabase.from("tarif_aset").insert({ aset_id: data.id, satuan: x.satuan, nominal: x.tarif })).error);
  await segarkan();
}

export async function tambahSubkategori(nama) {
  const kat = keadaan().kategoriDb ?? [];
  const induk = kat.find((k) => k.induk_id == null && k.jenis === "ruangan");
  if (!induk) throw new Error("Kategori utama tidak ditemukan.");
  galat((await supabase.from("kategori_aset").insert({ nama, induk_id: induk.id, jenis: "ruangan" })).error);
  await segarkan();
}
