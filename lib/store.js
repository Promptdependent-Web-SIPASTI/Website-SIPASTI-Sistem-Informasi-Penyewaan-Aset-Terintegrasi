"use client";

// Penyimpanan data sisi klien yang bersumber dari Supabase (menggantikan localStorage).
// Seluruh hook membaca state modul ini; setiap perubahan memicu render ulang lewat satu versi global.
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { ASET as ASET_CADANGAN, setAsetAktif } from "./data";
import { setJadwal } from "./jadwalCache";
import { hitungDendaTelat } from "./denda";
import { KONDISI_LABEL as KL, kondisiDariTeks, petaAset } from "./petaAset";

export const PENGATURAN_AWAL = { dendaPersen: 10, toleransiMenit: 30, batasBayarJam: 24 };

const S = {
  v: 0,
  authSiap: false,
  sesi: null,
  aset: null, // daftar aset terpetakan; null = belum dimuat
  subkategori: [],
  pengaturan: { ...PENGATURAN_AWAL },
  transaksi: [],
  transaksiSiap: false,
  profil: [],
  galat: "",
};
const listeners = new Set();
let mulai = false;

const notif = () => {
  S.v++;
  listeners.forEach((l) => l());
};

function subscribe(cb) {
  listeners.add(cb);
  pastikanMulai();
  return () => listeners.delete(cb);
}
export const useVersi = () => useSyncExternalStore(subscribe, () => S.v, () => 0);
export const keadaan = () => S;

// ---------- pemetaan baris database -> bentuk yang dipakai tampilan ----------
export { petaAset };
export { kondisiDariTeks };
const KONDISI_LABEL = KL;

const ukuranTeks = (b) => (b == null ? "" : b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const ms = (iso) => (iso ? Date.parse(iso) : undefined);
const jam = (t) => (t ? t.slice(0, 5) : undefined);
const per = (arr, kunci) => arr.reduce((m, r) => { (m[r[kunci]] ??= []).push(r); return m; }, {});

export function petaTransaksi(p, ctx) {
  const a = ctx.asetById[p.aset_id];
  const pr = ctx.profilById[p.penyewa_id];
  const bayar = ctx.bayarBy[p.id];
  const st = ctx.serahBy[p.id];
  const kb = ctx.kembaliBy[p.id];
  const dendaRows = ctx.dendaBy[p.id] ?? [];
  const nama = (id) => ctx.profilById[id]?.nama ?? "Petugas";
  const t = {
    id: p.id, kode: p.nomor, email: pr?.email ?? "",
    penyewa: { nama: pr?.nama ?? "Penyewa", tipe: pr?.tipe ?? undefined, idn: pr?.idn ?? "", unit: undefined },
    asetId: p.aset_id, asetSlug: a?.slug ?? "", asetNama: a?.nama ?? "Aset", kodeAset: a?.kode ?? "", kategori: p.jenis_aset,
    satuan: p.satuan, tarif: Number(p.tarif_satuan), jumlah: p.jumlah, durasi: p.durasi,
    tanggalMulai: p.tanggal_mulai, tanggalSelesai: p.tanggal_selesai,
    ...(p.jam_mulai ? { jamMulai: jam(p.jam_mulai), jamSelesai: jam(p.jam_selesai) } : {}),
    total: Number(p.total_biaya), tujuan: p.tujuan, status: p.status, catatanAdmin: p.catatan_admin ?? "",
    dibuat: ms(p.dibuat),
    pembayaran: bayar ? bayar.status : "tidak_ada",
    ...(bayar?.batas_bayar ? { batasBayar: ms(bayar.batas_bayar) } : {}),
    dokumen: (ctx.dokBy[p.id] ?? []).map((d) => ({ id: d.id, jenis: d.jenis, nama: d.nama_berkas, ukuran: ukuranTeks(d.ukuran_byte), penyimpanan: d.penyimpanan, kunci: d.object_key })),
    riwayat: (ctx.riwayatBy[p.id] ?? []).map((r) => ({ s: r.status, w: ms(r.waktu) })),
  };
  if (bayar?.object_key) t.buktiBayar = { nama: bayar.nama_berkas ?? "Bukti pembayaran", ukuran: "", waktu: ms(bayar.dikirim_pada), kunci: bayar.object_key, penyimpanan: bayar.penyimpanan };
  if (bayar?.status === "bukti_ditolak") t.alasanBukti = bayar.catatan_verifikasi ?? "";
  if (bayar?.nomor_kontrak) t.kontrak = { nomor: bayar.nomor_kontrak, tanggal: ms(bayar.kontrak_pada), dendaPersen: Number(bayar.kontrak_denda_persen), toleransiMenit: bayar.kontrak_toleransi_menit };
  if (bayar?.refund_persen != null) {
    t.refund = { persen: bayar.refund_persen, nominal: Number(bayar.refund_nominal), ket: bayar.refund_ket ?? "", diproses: bayar.refund_diproses };
    if (bayar.alasan_batal) t.alasanBatal = bayar.alasan_batal;
  } else if (p.status === "dibatalkan") {
    t.refund = { persen: 0, nominal: 0, ket: "Belum ada pembayaran, sehingga tidak ada dana yang dikembalikan.", diproses: true };
  }
  if (st) t.serahTerima = { waktu: ms(st.waktu), petugas: nama(st.petugas_id), jumlah: st.jumlah, kondisi: KONDISI_LABEL[st.kondisi], catatan: st.catatan ?? "" };
  if (kb) t.pengembalian = { waktu: ms(kb.waktu_aktual), petugas: nama(kb.petugas_id), jumlah: kb.jumlah_kembali, kondisi: KONDISI_LABEL[kb.kondisi], jumlahRusak: kb.jumlah_rusak, catatan: kb.catatan ?? "" };
  if (dendaRows.length) {
    const tl = dendaRows.find((d) => d.jenis === "terlambat");
    const kr = dendaRows.find((d) => d.jenis === "kerusakan");
    t.denda = {
      ids: dendaRows.map((d) => d.id),
      idKerusakan: kr?.id,
      keterlambatan: tl ? Number(tl.nominal) : 0,
      ketTelat: tl && kb ? hitungDendaTelat(t, ms(kb.waktu_aktual), ctx.pengaturan).rumus : "",
      kerusakan: kr ? Number(kr.nominal) : 0,
      kerusakanKet: kr?.catatan ?? "",
      konfirmasi: !kr || kr.dikonfirmasi ? "dikonfirmasi" : "menunggu",
      statusBayar: dendaRows.every((d) => d.status === "lunas") ? "lunas" : "belum_dibayar",
    };
  }
  return t;
}

// ---------- pemuatan data ----------
const urutTampil = new Map(ASET_CADANGAN.map((a, i) => [a.slug, i]));

export async function muatKatalog() {
  if (!supabase) { S.aset = null; notif(); return; }
  const [k, a, t, f, p, j] = await Promise.all([
    supabase.from("kategori_aset").select("*"),
    supabase.from("aset").select("*"),
    supabase.from("tarif_aset").select("*"),
    supabase.from("foto_aset").select("*").order("urutan"),
    supabase.from("pengaturan").select("*").eq("id", 1).maybeSingle(),
    supabase.from("jadwal_terisi").select("*"),
  ]);
  if (a.error || k.error) { S.galat = (a.error ?? k.error).message; notif(); return; }
  S.galat = "";
  const subNama = Object.fromEntries(k.data.map((x) => [x.id, x.nama]));
  const tarifBy = per(t.data ?? [], "aset_id");
  const fotoBy = per(f.data ?? [], "aset_id");
  const daftar = a.data
    .map((x) => petaAset(x, tarifBy[x.id] ?? [], fotoBy[x.id] ?? [], subNama[x.kategori_id] ?? ""))
    .sort((x, y) => (urutTampil.get(x.slug) ?? 999) - (urutTampil.get(y.slug) ?? 999) || x.kode.localeCompare(y.kode));
  S.aset = daftar;
  S.asetMentah = Object.fromEntries(a.data.map((x) => [x.id, x]));
  S.kategoriDb = k.data;
  S.subkategori = k.data.filter((x) => x.induk_id != null && x.aktif).map((x) => x.nama);
  if (p.data) S.pengaturan = { dendaPersen: Number(p.data.denda_persen), toleransiMenit: p.data.toleransi_menit, batasBayarJam: p.data.batas_bayar_jam };
  setJadwal(j.data ?? []);
  setAsetAktif(daftar);
  notif();
}

export async function muatTransaksi() {
  if (!supabase || !S.sesi) { S.transaksi = []; S.profil = []; S.transaksiSiap = true; notif(); return; }
  const staf = S.sesi.peran !== "penyewa";
  const q = (t) => supabase.from(t).select("*");
  const [p, b, st, kb, d, dk, rw, pr] = await Promise.all([
    q("penyewaan").order("dibuat", { ascending: false }), q("pembayaran"), q("serah_terima"), q("pengembalian"), q("denda"),
    q("dokumen_penyewaan"), q("riwayat_penyewaan").order("waktu"),
    staf ? q("profil_pengguna") : Promise.resolve({ data: [] }),
  ]);
  if (p.error) { S.galat = p.error.message; S.transaksiSiap = true; notif(); return; }
  const profil = staf ? pr.data ?? [] : [{ id: S.sesi.id, nama: S.sesi.nama, email: S.sesi.email, tipe: S.sesi.tipe, idn: S.sesi.idn, peran: S.sesi.peran, aktif: true }];
  S.profil = profil;
  const ctx = {
    asetById: Object.fromEntries((S.aset ?? ASET_CADANGAN).filter((x) => x.id).map((x) => [x.id, x])),
    profilById: Object.fromEntries(profil.map((x) => [x.id, x])),
    bayarBy: Object.fromEntries((b.data ?? []).map((x) => [x.penyewaan_id, x])),
    serahBy: Object.fromEntries((st.data ?? []).map((x) => [x.penyewaan_id, x])),
    kembaliBy: Object.fromEntries((kb.data ?? []).map((x) => [x.penyewaan_id, x])),
    dendaBy: per(d.data ?? [], "penyewaan_id"),
    dokBy: per(dk.data ?? [], "penyewaan_id"),
    riwayatBy: per(rw.data ?? [], "penyewaan_id"),
    pengaturan: S.pengaturan,
  };
  S.transaksi = p.data.map((x) => petaTransaksi(x, ctx)).sort((x, y) => y.dibuat - x.dibuat);
  S.transaksiSiap = true;
  notif();
}

export async function segarkan() {
  await muatKatalog();
  await muatTransaksi();
}

// ---------- sesi ----------
export async function ambilSesi(user) {
  const { data, error } = await supabase.from("profil_pengguna").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) return { galat: true };
  if (!data.aktif) return { nonaktif: true };
  return { id: data.id, nama: data.nama, email: data.email, peran: data.peran, tipe: data.tipe ?? null, idn: data.idn ?? "", telp: data.telepon ?? "" };
}

export function setSesi(sesi) {
  S.sesi = sesi;
  S.authSiap = true;
  notif();
}

async function terapkanSesi(session) {
  if (!session?.user) {
    S.sesi = null; S.transaksi = []; S.profil = []; S.transaksiSiap = true; S.authSiap = true;
    notif();
    return;
  }
  const r = await ambilSesi(session.user);
  if (r.nonaktif || r.galat) {
    await supabase.auth.signOut();
    S.sesi = null; S.transaksi = []; S.transaksiSiap = true; S.authSiap = true;
    notif();
    return;
  }
  S.sesi = r;
  S.authSiap = true;
  notif();
  await muatTransaksi();
}
export const muatUlangSesi = async () => {
  const { data } = await supabase.auth.getSession();
  await terapkanSesi(data.session);
};

function pastikanMulai() {
  if (mulai || typeof window === "undefined") return;
  mulai = true;
  if (!supabase) { S.authSiap = true; S.transaksiSiap = true; notif(); return; }
  supabase.auth.onAuthStateChange((evt, session) => {
    if (evt === "TOKEN_REFRESHED") return;
    setTimeout(() => terapkanSesi(session), 0); // hindari memanggil Supabase langsung di dalam callback
  });
  muatKatalog();
  window.addEventListener("focus", () => { if (document.visibilityState === "visible") segarkan(); });
}

// ---------- pemanggilan fungsi database (RPC) ----------
export function pesanGalat(err) {
  const m = err?.message ?? String(err);
  if (/cegah_bentrok_ruangan/.test(m)) return "Jadwal bentrok dengan penyewaan lain pada ruangan yang sama.";
  if (/row-level security|permission denied/i.test(m)) return "Anda tidak berwenang melakukan tindakan ini.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  return m;
}
export async function rpc(nama, args, { segar = true } = {}) {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await supabase.rpc(nama, args);
  if (error) throw new Error(pesanGalat(error));
  if (segar) await segarkan();
  return data;
}
