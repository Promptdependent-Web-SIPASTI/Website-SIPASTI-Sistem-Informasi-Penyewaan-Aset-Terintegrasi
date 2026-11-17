"use client";

// Penyimpanan transaksi SIMULASI di localStorage (tahap front end).
// Akan diganti tabel Supabase (penyewaan, pembayaran, dst.) pada tahap backend.

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getAset, rupiah } from "./data";
import { BULAN, fromISO, mulaiHari, statusHari, tambahHari, toISO } from "./waktu";
import { ambilPengaturan } from "./pengaturan";

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
export const PENYEWA_DEMO = { nama: "Rizky Pratama", tipe: "mahasiswa", idn: "4201421008", unit: "Mahasiswa Ilmu Komputer" };
const KENAL = {
  sinta: { email: "sinta@students.unnes.ac.id", nama: "Sinta Maharani", tipe: "mahasiswa", idn: "4301422089", unit: "Mahasiswa Jurusan Kimia" },
  dewi: { email: "dewi.lestari@mail.unnes.ac.id", nama: "Dewi Lestari", tipe: "dosen", idn: "198503122010012003", unit: "Dosen Jurusan IPA" },
  budi: { email: "budi.hartono@mail.unnes.ac.id", nama: "Budi Hartono", tipe: "staf", idn: "197901052005011002", unit: "Staf Tenaga Pendidik" },
  andi: { email: "andi.prakoso@mail.unnes.ac.id", nama: "Andi Prakoso", tipe: "dosen", idn: "198207182008011004", unit: "Dosen Jurusan Biologi" },
};
function buatSeed(sekarang) {
  const now = sekarang.getTime();
  const t = mulaiHari(sekarang);
  const tgl = (n) => toISO(hindariMinggu(tambahHari(t, n)));
  const dasar = (slug, siapa) => {
    const a = getAset(slug);
    const p = siapa ?? { email: EMAIL_DEMO, ...PENYEWA_DEMO };
    return { asetSlug: slug, asetNama: a.nama, kodeAset: a.kode, kategori: a.kategori, satuan: a.satuan, tarif: a.tarif, email: p.email, penyewa: { nama: p.nama, tipe: p.tipe, idn: p.idn, unit: p.unit }, dokumen: [], jumlah: 1 };
  };
  const dok = (nama, ktm, rincian) => [
    { jenis: "Surat Permohonan / Perizinan", nama: `Surat_Permohonan_${nama}.pdf`, ukuran: "1.2 MB" },
    { jenis: "Identitas / Kartu Tanda Mahasiswa (KTM)", nama: ktm, ukuran: "850 KB" },
    ...(rincian ? [{ jenis: "Rincian Kegiatan", nama: rincian, ukuran: "2.1 MB" }] : []),
  ];
  const disetujui4 = now - (1 * JAM + 48 * 60 * 1000);
  const jam07 = (n, h, m) => { const d = new Date(t.getTime() + n * HARI_MS); d.setHours(h, m, 0, 0); return d.getTime(); };
  const arr = [
    { ...dasar("proyektor-dan-layar-proyektor"), kode: "SPT-0003", jumlah: 2, durasi: 1, tanggalMulai: tgl(0), tanggalSelesai: tgl(0), total: 200000, tujuan: "Presentasi tugas akhir kelompok.", status: "sedang_disewa", pembayaran: "lunas", dokumen: dok("Proyektor", "KTM_RizkyPratama.jpg"), catatanAdmin: "Disetujui. Mohon dikembalikan dalam kondisi baik.", dibuat: now - 4 * HARI_MS, serahTerima: { waktu: jam07(0, 7, 30), petugas: "Slamet Riyadi", jumlah: 2, kondisi: "Baik", catatan: "" }, riwayat: [{ s: "diajukan", w: now - 4 * HARI_MS }, { s: "disetujui", w: now - 3.5 * HARI_MS }, { s: "sedang_disewa", w: jam07(0, 7, 30) }] },
    { ...dasar("laboratorium-fisika"), kode: "SPT-0004", durasi: 3, tanggalMulai: tgl(6), tanggalSelesai: tgl(6), jamMulai: "08:00", jamSelesai: "11:00", total: 375000, tujuan: "Praktikum tambahan mata kuliah Fisika Dasar bagi kelompok studi mahasiswa semester ganjil.", status: "disetujui", pembayaran: "belum_dibayar", batasBayar: disetujui4 + 24 * JAM, dokumen: dok("Lab_Fisika", "KTM_RizkyPratama.jpg").slice(0, 2).map((d, i) => (i === 0 ? { ...d, nama: "Surat_Izin_Lab_Fisika.pdf" } : d)), catatanAdmin: "Disetujui. Mohon menjaga kebersihan laboratorium dan memastikan peralatan optik dimatikan setelah sesi berakhir.", dibuat: now - 2 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 2 * HARI_MS }, { s: "disetujui", w: disetujui4 }] },
    { ...dasar("ruang-rapat-besar-gedung-ukm", KENAL.sinta), kode: "SPT-0005", durasi: 2, tanggalMulai: tgl(4), tanggalSelesai: tgl(4), jamMulai: "13:00", jamSelesai: "15:00", total: 300000, tujuan: "Rapat koordinasi panitia kegiatan himpunan.", status: "disetujui", pembayaran: "menunggu_verifikasi", batasBayar: now + 20 * JAM, buktiBayar: { nama: "Bukti_Transfer_Sinta.png", ukuran: "320 KB", waktu: now - 4.7 * JAM }, dokumen: dok("Ruang_Rapat", "KTM_SintaMaharani.jpg"), catatanAdmin: "Disetujui.", dibuat: now - 1.5 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 1.5 * HARI_MS }, { s: "disetujui", w: now - 1 * HARI_MS }] },
    { ...dasar("kamera-mirrorless"), kode: "SPT-0006", durasi: 1, tanggalMulai: tgl(12), tanggalSelesai: tgl(12), total: 250000, tujuan: "Dokumentasi kegiatan seminar himpunan.", status: "diajukan", pembayaran: "tidak_ada", dokumen: dok("Kamera", "KTM_RizkyPratama.jpg"), dibuat: now - 3 * JAM, riwayat: [{ s: "diajukan", w: now - 3 * JAM }] },
    { ...dasar("aula-d12", KENAL.dewi), kode: "SPT-0007", durasi: 2, tanggalMulai: tgl(20), tanggalSelesai: tgl(21), total: 3000000, tujuan: "Seminar nasional pendidikan sains dan diseminasi hasil penelitian dosen muda se-Jawa Tengah.", status: "diajukan", pembayaran: "tidak_ada", dokumen: [{ jenis: "Surat Permohonan / Perizinan", nama: "Surat_Permohonan_Aula_DewiLestari.pdf", ukuran: "1.8 MB" }, { jenis: "Identitas / NIP / KTP", nama: "KTP_DewiLestari.jpg", ukuran: "900 KB" }, { jenis: "Rincian Kegiatan", nama: "Rundown_Semnas_Sains.pdf", ukuran: "2.4 MB" }], dibuat: now - 2 * JAM, riwayat: [{ s: "diajukan", w: now - 2 * JAM }] },
    { ...dasar("sound-system", KENAL.budi), kode: "SPT-0008", durasi: 1, tanggalMulai: tgl(8), tanggalSelesai: tgl(8), total: 500000, tujuan: "Kegiatan apel dan pembinaan tenaga kependidikan.", status: "diajukan", pembayaran: "tidak_ada", dokumen: dok("Sound_System", "KTP_BudiHartono.jpg"), dibuat: now - 1 * JAM, riwayat: [{ s: "diajukan", w: now - 1 * JAM }] },
    { ...dasar("laboratorium-biologi", KENAL.andi), kode: "SPT-0009", durasi: 2, tanggalMulai: tgl(-3), tanggalSelesai: tgl(-3), jamMulai: "08:00", jamSelesai: "10:00", total: 250000, tujuan: "Praktikum mikrobiologi kelas khusus.", status: "dikembalikan", pembayaran: "lunas", dokumen: dok("Lab_Biologi", "KTP_AndiPrakoso.jpg"), dibuat: now - 8 * HARI_MS, serahTerima: { waktu: jam07(-3, 7, 45), petugas: "Slamet Riyadi", jumlah: 1, kondisi: "Baik", catatan: "" }, pengembalian: { waktu: jam07(-3, 11, 15), petugas: "Slamet Riyadi", jumlah: 1, kondisi: "baik", jumlahRusak: 0, catatan: "Terlambat 1 jam dari jadwal." }, denda: { keterlambatan: 12500, ketTelat: "Terlambat 1 jam: 10% × Rp125.000 × 1 jam", kerusakan: 0, kerusakanKet: "", konfirmasi: "dikonfirmasi", statusBayar: "belum_dibayar" }, riwayat: [{ s: "diajukan", w: now - 8 * HARI_MS }, { s: "disetujui", w: now - 7 * HARI_MS }, { s: "sedang_disewa", w: jam07(-3, 7, 45) }, { s: "dikembalikan", w: jam07(-3, 11, 15) }] },
    { ...dasar("mikrofon-wireless"), kode: "SPT-0002", jumlah: 2, durasi: 1, tanggalMulai: tgl(-9), tanggalSelesai: tgl(-9), total: 80000, tujuan: "Kegiatan bedah buku.", status: "selesai", pembayaran: "lunas", dokumen: dok("Mikrofon", "KTM_RizkyPratama.jpg"), dibuat: now - 14 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 14 * HARI_MS }, { s: "disetujui", w: now - 13 * HARI_MS }, { s: "sedang_disewa", w: now - 9 * HARI_MS }, { s: "dikembalikan", w: now - 9 * HARI_MS + 6 * JAM }, { s: "selesai", w: now - 9 * HARI_MS + 8 * JAM }] },
    { ...dasar("laboratorium-ilmu-komputer"), kode: "SPT-0001", durasi: 3, tanggalMulai: tgl(-17), tanggalSelesai: tgl(-17), jamMulai: "13:00", jamSelesai: "16:00", total: 600000, tujuan: "Pelatihan pemrograman web untuk mahasiswa.", status: "selesai", pembayaran: "lunas", dokumen: dok("Lab_Komputer", "KTM_RizkyPratama.jpg"), dibuat: now - 24 * HARI_MS, riwayat: [{ s: "diajukan", w: now - 24 * HARI_MS }, { s: "disetujui", w: now - 23 * HARI_MS }, { s: "sedang_disewa", w: now - 17 * HARI_MS }, { s: "dikembalikan", w: now - 17 * HARI_MS + 4 * JAM }, { s: "selesai", w: now - 17 * HARI_MS + 6 * JAM }] },
  ];
  return beriKontrak([...arr, ...buatRiwayat()]);
}


// ---------- data contoh setahun (laporan tahunan) ----------
const ORANG = {
  ...KENAL,
  nadia: { email: "nadia.putri@students.unnes.ac.id", nama: "Nadia Putri", tipe: "mahasiswa", idn: "4101422015", unit: "Mahasiswa Jurusan Matematika" },
  fajar: { email: "fajar.nugroho@students.unnes.ac.id", nama: "Fajar Nugroho", tipe: "mahasiswa", idn: "4401421033", unit: "Mahasiswa Jurusan Fisika" },
  siti: { email: "siti.rahayu@mail.unnes.ac.id", nama: "Siti Rahayu", tipe: "dosen", idn: "198801202014012001", unit: "Dosen Jurusan Kimia" },
  agus: { email: "agus.setiawan@mail.unnes.ac.id", nama: "Agus Setiawan", tipe: "staf", idn: "199005152015011003", unit: "Staf Tenaga Pendidik" },
  maya: { email: "maya.kusuma@students.unnes.ac.id", nama: "Maya Kusuma", tipe: "mahasiswa", idn: "4501422007", unit: "Mahasiswa Jurusan Biologi" },
};

// [no, aset, penyewa, tanggal mulai, durasi (jam/hari), jumlah, hasil, tujuan]
const RIWAYAT = [
  [101, "aula-d12", "dewi", "2026-01-14", 2, 1, "selesai", "Seminar nasional pendidikan sains."],
  [102, "laboratorium-fisika", "fajar", "2026-01-21", 3, 1, "selesai", "Praktikum optik tambahan."],
  [103, "proyektor-dan-layar-proyektor", "nadia", "2026-02-04", 1, 2, "selesai", "Presentasi seminar proposal."],
  [104, "laboratorium-kimia", "siti", "2026-02-11", 4, 1, "selesai", "Penelitian analisis kimia dosen."],
  [105, "aula-gedung-baru-lt-4", "budi", "2026-02-25", 1, 1, "selesai", "Pelantikan pengurus organisasi."],
  [106, "ruang-rapat-lt-2-dekanat", "andi", "2026-03-10", 2, 1, "selesai", "Rapat koordinasi program studi."],
  [107, "kursi-lipat-kuliah", "nadia", "2026-03-18", 1, 60, "selesai", "Wisuda syukuran himpunan."],
  [108, "laboratorium-biologi", "maya", "2026-03-25", 3, 1, "selesai-denda-telat", "Praktikum mikrobiologi."],
  [109, "sound-system", "agus", "2026-04-08", 1, 1, "selesai", "Apel dan pembinaan pegawai."],
  [110, "laboratorium-ilmu-komputer", "fajar", "2026-04-15", 4, 1, "selesai", "Pelatihan pemrograman web."],
  [111, "mikrofon-wireless", "sinta", "2026-05-06", 2, 3, "selesai", "Lomba debat mahasiswa."],
  [112, "aula-d12", "siti", "2026-05-20", 1, 1, "batal", "Kuliah umum tamu."],
  [113, "laboratorium-matematika", "maya", "2026-06-03", 2, 1, "selesai", "Pelatihan perangkat lunak statistika."],
  [114, "kamera-mirrorless", "dewi", "2026-06-17", 2, 1, "selesai-denda-rusak", "Dokumentasi penelitian lapangan."],
  [115, "ruang-rapat-gedung-baru-8-lantai", "agus", "2026-07-08", 3, 1, "selesai", "Rapat penyusunan anggaran."],
  [116, "laboratorium-ipa-terpadu", "andi", "2026-07-22", 2, 1, "selesai", "Praktikum lintas bidang."],
  [117, "toa", "nadia", "2026-08-12", 1, 2, "selesai", "Kegiatan pengenalan kampus."],
  [118, "aula-gedung-baru-lt-4", "sinta", "2026-08-26", 1, 1, "ditolak", "Acara tanpa izin dekanat."],
  [119, "laboratorium-fisika", "fajar", "2026-09-09", 3, 1, "selesai", "Praktikum fisika modern."],
  [120, "proyektor-dan-layar-proyektor", "budi", "2026-10-07", 3, 1, "selesai", "Sosialisasi program fakultas."],
];

function buatRiwayat() {
  return RIWAYAT.map(([no, slug, siapa, iso, durasi, jumlah, hasil, tujuan]) => {
    const a = getAset(slug);
    const p = ORANG[siapa];
    const awal = fromISO(iso);
    const jamMulai = a.satuan === "jam" ? (durasi <= 3 ? "08:00" : "13:00") : undefined;
    const jamSelesai = jamMulai ? `${String(Number(jamMulai.slice(0, 2)) + durasi).padStart(2, "0")}:00` : undefined;
    const dur = a.satuan === "jam" || a.satuan === "hari" ? durasi : 1;
    const jml = a.kategori === "peralatan" ? jumlah : 1;
    const tgl2 = a.satuan === "hari" ? toISO(tambahHari(awal, dur - 1)) : iso;
    const total = a.tarif * dur * jml;
    const w = (d, h, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x.getTime(); };
    const ajukan = w(tambahHari(awal, -10), 9, 30);
    const setuju = w(tambahHari(awal, -9), 10, 15);
    const pakai = w(awal, 8, 0);
    const kembali = w(fromISO(tgl2), 16, 30);
    const butuhRincian = a.subkategori === "Aula";
    const dokumen = [
      { jenis: "Surat Permohonan / Perizinan", nama: `Surat_Permohonan_${p.nama.split(" ")[0]}.pdf`, ukuran: "1.1 MB" },
      { jenis: p.tipe === "mahasiswa" ? "Identitas / Kartu Tanda Mahasiswa (KTM)" : "Identitas / NIP / KTP", nama: `Identitas_${p.nama.split(" ")[0]}.jpg`, ukuran: "820 KB" },
      ...(butuhRincian ? [{ jenis: "Rincian Kegiatan", nama: `Rundown_${p.nama.split(" ")[0]}.pdf`, ukuran: "2.0 MB" }] : []),
    ];
    const dasar = {
      kode: `SPT-${String(no).padStart(4, "0")}`, email: p.email, penyewa: { nama: p.nama, tipe: p.tipe, idn: p.idn, unit: p.unit },
      asetSlug: slug, asetNama: a.nama, kodeAset: a.kode, kategori: a.kategori, satuan: a.satuan, tarif: a.tarif, jumlah: jml, durasi: dur,
      tanggalMulai: iso, tanggalSelesai: tgl2, ...(jamMulai ? { jamMulai, jamSelesai } : {}), total, tujuan, dokumen, dibuat: ajukan,
    };
    if (hasil === "ditolak")
      return { ...dasar, status: "ditolak", pembayaran: "tidak_ada", catatanAdmin: "Dokumen perizinan tidak lengkap.", riwayat: [{ s: "diajukan", w: ajukan }, { s: "ditolak", w: setuju }] };
    if (hasil === "batal") {
      const nominal = Math.round(total * 0.5);
      return { ...dasar, status: "dibatalkan", pembayaran: "lunas", catatanAdmin: "Dibatalkan oleh penyewa.", alasanBatal: "Narasumber berhalangan hadir.", refund: { persen: 50, nominal, ket: "Dibatalkan pada rentang H-2 sampai H-1.", diproses: true }, riwayat: [{ s: "diajukan", w: ajukan }, { s: "disetujui", w: setuju }, { s: "dibatalkan", w: w(tambahHari(awal, -1), 14, 0) }] };
    }
    const riwayat = [{ s: "diajukan", w: ajukan }, { s: "disetujui", w: setuju }, { s: "sedang_disewa", w: pakai }, { s: "dikembalikan", w: kembali }, { s: "selesai", w: kembali + 3600000 * 2 }];
    let denda;
    if (hasil === "selesai-denda-telat") denda = { keterlambatan: Math.round(0.1 * a.tarif), ketTelat: `Terlambat 1 jam: 10% × ${rupiah(a.tarif)} × 1 jam`, kerusakan: 0, kerusakanKet: "", konfirmasi: "dikonfirmasi", statusBayar: "lunas" };
    if (hasil === "selesai-denda-rusak") denda = { keterlambatan: Math.round(0.1 * a.tarif), ketTelat: `Terlambat 1 hari: 10% × ${rupiah(a.tarif)} × 1 hari`, kerusakan: 50000, kerusakanKet: "Lensa tergores, biaya pembersihan dan perbaikan.", konfirmasi: "dikonfirmasi", statusBayar: "lunas" };
    return { ...dasar, status: "selesai", pembayaran: "lunas", catatanAdmin: "Disetujui.", serahTerima: { waktu: pakai, petugas: "Slamet Riyadi", jumlah: jml, kondisi: "Baik", catatan: "" }, ...(denda ? { denda } : {}), riwayat };
  });
}

// ---------- kontrak sewa (nomor dan salinan parameter saat pembayaran lunas) ----------
const ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export function nomorKontrak(seq, ms) {
  const d = new Date(ms);
  return `${String(seq).padStart(3, "0")}/PKS/SIPASTI-FMIPA/${ROMAWI[d.getMonth()]}/${d.getFullYear()}`;
}
function beriKontrak(arr) {
  const lunas = arr
    .filter((t) => t.pembayaran === "lunas" && t.riwayat.some((r) => r.s === "disetujui"))
    .map((t) => ({ t, w: t.riwayat.find((r) => r.s === "disetujui").w + 3 * JAM }))
    .sort((a, b) => a.w - b.w);
  const hitung = {};
  lunas.forEach(({ t, w }) => {
    const y = new Date(w).getFullYear();
    hitung[y] = (hitung[y] ?? 0) + 1;
    t.kontrak = { nomor: nomorKontrak(hitung[y], w), tanggal: w, dendaPersen: 10, toleransiMenit: 30 };
  });
  return arr;
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

// Hook: seluruh transaksi (untuk admin dan petugas), urut terbaru.
export function useSemuaTransaksi() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => null);
  return useMemo(() => {
    if (raw === null) return { siap: false, items: [] };
    return { siap: true, items: JSON.parse(raw).sort((a, b) => b.dibuat - a.dibuat) };
  }, [raw]);
}

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
export function useOtomatisBatal() {
  const { siap, items } = useSemuaTransaksi();
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

// ---------- penyewa, jadwal, dan denda ----------
export const TIPE_LABEL = { mahasiswa: "Mahasiswa", dosen: "Dosen", staf: "Staf" };
export const penyewaTeks = (t) => t.penyewa?.nama ?? t.email;
export const penyewaUnit = (t) => t.penyewa?.unit ?? TIPE_LABEL[t.penyewa?.tipe] ?? "";

// Batas pengembalian (ms): jam selesai untuk sewa per jam, selain itu 18.00 pada tanggal selesai.
export function batasKembaliMs(t) {
  const d = fromISO(t.satuan === "jam" ? t.tanggalMulai : t.tanggalSelesai || t.tanggalMulai);
  const [h, m] = (t.satuan === "jam" ? t.jamSelesai : "18:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// Denda keterlambatan: persen × tarif × unit waktu (dibulatkan ke atas setelah toleransi) × jumlah, maks 100% total.
export function hitungDendaTelat(t, aktualMs, { dendaPersen, toleransiMenit }) {
  const telatMenit = Math.max(0, Math.round((aktualMs - batasKembaliMs(t)) / 60000));
  if (telatMenit <= toleransiMenit) return { telatMenit, unit: 0, nominal: 0, satuanUnit: t.satuan === "jam" ? "jam" : "hari", rumus: "Tidak terlambat (dalam toleransi)." };
  const unitMenit = t.satuan === "jam" ? 60 : 1440;
  const unit = Math.ceil(telatMenit / unitMenit);
  const jumlah = t.kategori === "peralatan" ? t.jumlah : 1;
  const nominal = Math.min(t.total, Math.round(((dendaPersen / 100) * t.tarif * unit * jumlah)));
  const sat = t.satuan === "jam" ? "jam" : "hari";
  return { telatMenit, unit, nominal, satuanUnit: sat, rumus: `${dendaPersen}% × ${rupiah(t.tarif)} × ${unit} ${sat}${jumlah > 1 ? ` × ${jumlah} ${getAset(t.asetSlug)?.stokSatuan ?? "unit"}` : ""} = ${rupiah(nominal)}` };
}
export const totalDenda = (t) => (t.denda ? (t.denda.keterlambatan || 0) + (t.denda.konfirmasi === "dikonfirmasi" ? t.denda.kerusakan || 0 : 0) : 0);
export const dendaBelumBayar = (t) => (t.denda && t.denda.statusBayar === "belum_dibayar" && t.denda.konfirmasi === "dikonfirmasi" ? totalDenda(t) : 0);
export const mulaiMs = (t) => {
  const d = fromISO(t.tanggalMulai);
  const [h, m] = (t.jamMulai ?? "07:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

// Membuat kontrak baru (nomor urut per tahun) saat admin menandai pembayaran lunas.
export function kontrakBaru(now = Date.now()) {
  const th = new Date(now).getFullYear();
  const seq = bacaSemua().reduce((m, t) => (t.kontrak && new Date(t.kontrak.tanggal).getFullYear() === th ? Math.max(m, Number(t.kontrak.nomor.split("/")[0]) || 0) : m), 0) + 1;
  const { dendaPersen, toleransiMenit } = ambilPengaturan();
  return { nomor: nomorKontrak(seq, now), tanggal: now, dendaPersen, toleransiMenit };
}
export function pastikanKontrak(t) {
  if (t.kontrak) return t.kontrak;
  const k = kontrakBaru();
  ubahTransaksi(t.kode, { kontrak: k });
  return k;
}
