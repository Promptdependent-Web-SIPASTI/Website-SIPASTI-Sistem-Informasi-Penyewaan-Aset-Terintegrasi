"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ClipboardClock, Receipt, DoorOpen, Banknote, Gavel, Bell, TriangleAlert, Wrench, CircleAlert, ArrowRight, Hourglass, Download, CalendarDays } from "lucide-react";
import { Kartu } from "../ui";
import { useSemuaTransaksi, STATUS_TRX, asetTeks, periodeTeks, penyewaUnit, penyewaTeks, dendaBelumBayar, fmtWaktu, fmtTgl } from "@/lib/transaksi";
import { useAsetList } from "@/lib/asetStore";
import { useHariIni } from "@/lib/useClient";
import { rupiah } from "@/lib/data";
import { unduhCsv } from "@/lib/csv";

const BASE = "/dashboard/admin";

export function barisRekap(items) {
  return [
    ["No. Transaksi", "Penyewa", "Tipe", "Aset", "Kode Aset", "Tanggal Mulai", "Tanggal Selesai", "Jumlah", "Total (Rp)", "Status", "Pembayaran", "Denda (Rp)"],
    ...items.map((t) => [t.kode, penyewaTeks(t), t.penyewa?.tipe ?? "", t.asetNama, t.kodeAset, t.tanggalMulai, t.tanggalSelesai, t.jumlah, t.total, STATUS_TRX[t.status]?.label, t.pembayaran, dendaBelumBayar(t)]),
  ];
}

export default function DashboardAdmin() {
  const { siap, items } = useSemuaTransaksi();
  const aset = useAsetList();
  const hariIni = useHariIni();
  if (!siap) return null;

  const bulanIni = hariIni.slice(0, 7);
  const pendapatan = items.filter((t) => t.pembayaran === "lunas" && t.tanggalMulai.startsWith(bulanIni)).reduce((s, t) => s + t.total, 0);
  const denda = items.reduce((s, t) => s + dendaBelumBayar(t), 0);
  const menunggu = items.filter((t) => t.status === "diajukan");
  const stat = [
    { n: menunggu.length, label: "Pengajuan Menunggu", ikon: ClipboardClock },
    { n: items.filter((t) => t.pembayaran === "menunggu_verifikasi").length, label: "Pembayaran Perlu Verifikasi", ikon: Receipt },
    { n: items.filter((t) => t.status === "sedang_disewa").length, label: "Aset Sedang Disewa", ikon: DoorOpen },
    { n: rupiah(pendapatan), label: "Pendapatan Bulan Ini", ikon: Banknote, teks: true },
    { n: rupiah(denda), label: "Denda Belum Dibayar", ikon: Gavel, teks: true },
  ];
  const urutan = ["diajukan", "disetujui", "sedang_disewa", "dikembalikan", "selesai"];
  const hitung = urutan.map((s) => [s, items.filter((t) => t.status === s).length]);
  const maks = Math.max(1, ...hitung.map((x) => x[1]));
  const diproses = items.filter((t) => !["diajukan", "ditolak", "dibatalkan"].includes(t.status)).length;
  const rasio = items.length ? ((diproses / items.length) * 100).toFixed(1).replace(".", ",") : "0";

  const perhatian = [
    ...aset.filter((a) => a.status === "Tidak tersedia").map((a) => ({ ikon: TriangleAlert, warna: "text-orange-500", judul: `${a.nama2 ?? a.nama} nonaktif karena ${a.statusKet ?? "perawatan"}.`, sub: `${a.kode} · ${a.lokasi}` })),
    ...aset.filter((a) => a.kategori === "peralatan" && /rusak/i.test(a.kondisi)).map((a) => ({ ikon: Wrench, warna: "text-sky", judul: `${a.nama}: ${a.kondisi} (tersedia ${a.stok} dari ${a.stokTotal} unit).`, sub: "Unit dalam antrean perbaikan teknis" })),
    ...items.filter((t) => dendaBelumBayar(t) > 0).map((t) => ({ ikon: CircleAlert, warna: "text-red-600", judul: `Denda belum dibayar pada ${t.kode}: ${rupiah(dendaBelumBayar(t))}.`, sub: t.denda.ketTelat || "Denda kerusakan terkonfirmasi" })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">Dashboard Admin</h1>
          <span className="mt-3 block h-1 w-12 rounded-full bg-sun" />
          <p className="mt-3 text-sm text-ink">Ringkasan penyewaan aset FMIPA per {fmtTgl(hariIni)}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm"><CalendarDays size={16} className="text-sky" /> Semester Gasal 2026/2027</span>
          <button type="button" onClick={() => unduhCsv("rekap-sipasti.csv", barisRekap(items))} className="inline-flex items-center gap-2 rounded-xl bg-pale px-4 py-2.5 text-sm font-bold text-navy transition hover:bg-sky hover:text-white"><Download size={16} /> Unduh Rekap</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {stat.map(({ n, label, ikon: Icon, teks }, i) => (
          <motion.div
            key={label}
            className={i < 3 ? "lg:col-span-2" : "lg:col-span-3"}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Kartu className="h-full p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-sun"><Icon size={20} /></span>
              <p className={`mt-4 font-extrabold text-navy ${teks ? "text-xl" : "text-3xl"}`}>{n}</p>
              <p className="mt-1 text-xs leading-snug text-slate-600">{label}</p>
            </Kartu>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Kartu className="flex flex-col p-6">
          <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-navy">Transaksi menurut Status</h2><p className="mt-1 text-xs text-slate-500">Distribusi status transaksi aktif per semester ini</p></div><span className="text-xs text-slate-500">Total {items.length} berkas</span></div>
          <ul className="mt-6 flex-1 space-y-4">
            {hitung.map(([s, n]) => (
              <li key={s} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-sm sm:grid-cols-[130px_1fr_32px]">
                <span className="text-ink">{STATUS_TRX[s].label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-pale/70"><motion.span initial={{ width: 0 }} animate={{ width: `${(n / maks) * 100}%` }} transition={{ duration: 0.7 }} className="block h-full rounded-full bg-sky" /></span>
                <b className="text-right text-navy">{n}</b>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between border-t border-pale pt-4 text-xs"><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-sky" /> Aktivitas operasional berjalan</span></div>
        </Kartu>

        <Kartu className="flex flex-col p-6">
          <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-navy">Perlu Perhatian</h2><p className="mt-1 text-xs text-slate-500">Catatan inventaris dan kendala transaksi</p></div><Bell size={20} className="text-sun" /></div>
          <ul className="mt-5 flex-1 space-y-3">
            {perhatian.length === 0 && <li className="rounded-xl bg-soft p-4 text-sm text-slate-500">Tidak ada catatan yang memerlukan tindakan.</li>}
            {perhatian.slice(0, 4).map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-soft p-4"><p.ikon size={18} className={`mt-0.5 shrink-0 ${p.warna}`} /><div><p className="text-sm font-semibold leading-snug text-navy">{p.judul}</p><p className="mt-1 text-xs text-slate-500">{p.sub}</p></div></li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between border-t border-pale pt-4 text-xs"><span className="text-slate-500">{perhatian.length} catatan membutuhkan tindakan</span><Link href={`${BASE}/denda`} className="font-bold text-navy hover:text-sky">Kelola Isu ›</Link></div>
        </Kartu>
      </div>

      <Kartu className="p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div><h2 className="text-xl font-bold text-navy">Pengajuan Menunggu Persetujuan</h2><p className="mt-1 text-xs text-slate-500">Daftar permohonan sewa yang memerlukan persetujuan Kepala Subbagian Umum/Pengelola Lab</p></div>
          <span className="flex items-center gap-2 text-sm font-bold text-sky"><Hourglass size={16} /> {menunggu.length} Menunggu Konfirmasi</span>
        </div>
        {menunggu.length === 0 ? (
          <p className="mt-6 rounded-xl bg-soft p-6 text-center text-sm text-slate-500">Tidak ada pengajuan yang menunggu persetujuan.</p>
        ) : (
          <div className="relative mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-4 py-3">No. Transaksi</th><th className="px-4 py-3">Penyewa</th><th className="px-4 py-3">Aset</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Total Biaya</th><th className="px-4 py-3">Diajukan</th><th className="rounded-r-lg px-4 py-3 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-pale/80">
                {menunggu.slice(0, 5).map((t) => (
                  <tr key={t.kode} className="hover:bg-soft/70">
                    <td className="px-4 py-4 font-bold text-navy">{t.kode}</td>
                    <td className="px-4 py-4"><span className="block font-semibold text-navy">{penyewaTeks(t)}</span><span className="text-xs text-slate-500">{penyewaUnit(t)}</span></td>
                    <td className="px-4 py-4 text-ink">{asetTeks(t)}</td>
                    <td className="px-4 py-4 text-ink">{periodeTeks(t)}</td>
                    <td className="px-4 py-4 font-bold text-navy">{rupiah(t.total)}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{fmtWaktu(t.dibuat)}</td>
                    <td className="px-4 py-4 text-right"><Link href={`${BASE}/persetujuan?kode=${t.kode}`} className="inline-flex items-center gap-1 rounded-lg bg-sun px-4 py-1.5 text-xs font-bold text-navy transition hover:-translate-y-0.5">Tinjau <ArrowRight size={13} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-pale pt-4 text-xs"><span className="text-slate-500">Menampilkan {Math.min(5, menunggu.length)} dari {menunggu.length} permohonan aktif</span><Link href={`${BASE}/persetujuan`} className="font-bold text-sky hover:underline">Lihat Semua Pengajuan →</Link></div>
      </Kartu>
    </div>
  );
}
