"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Hourglass, Wallet, KeyRound, CircleCheck, Plus, TriangleAlert, ArrowRight, CalendarDays, Clock3, Info, PackageSearch } from "lucide-react";
import { Kartu, StatusTrx, Sisa } from "./ui";
import { useSesi } from "@/lib/useClient";
import { useTransaksi, asetTeks, periodeTeks, fmtTgl, fmtJam } from "@/lib/transaksi";
import { rupiah } from "@/lib/data";

const BASE = "/dashboard/penyewa";
const PERLU_BAYAR = (t) => t.status === "disetujui" && ["belum_dibayar", "bukti_ditolak"].includes(t.pembayaran);

export default function DashboardPenyewa() {
  const sesi = useSesi();
  const { siap, items } = useTransaksi(sesi?.email);
  if (!siap || !sesi) return null;

  const nama = sesi.nama.split(" ")[0];
  const stat = [
    { n: items.filter((t) => t.status === "diajukan").length, label: "Menunggu Persetujuan", ikon: Hourglass },
    { n: items.filter(PERLU_BAYAR).length, label: "Menunggu Pembayaran", ikon: Wallet },
    { n: items.filter((t) => t.status === "sedang_disewa").length, label: "Sedang Disewa", ikon: KeyRound },
    { n: items.filter((t) => t.status === "selesai").length, label: "Selesai", ikon: CircleCheck },
  ];
  const tindakan = items.find(PERLU_BAYAR);
  const jadwal = items
    .filter((t) => ["diajukan", "disetujui", "sedang_disewa"].includes(t.status))
    .sort((a, b) => a.tanggalMulai.localeCompare(b.tanggalMulai))
    .slice(0, 3);
  const info = { diajukan: ["Menunggu persetujuan", "text-orange-600"], disetujui: ["Menunggu pembayaran", "text-orange-600"], sedang_disewa: ["Sedang disewa", "text-sky"] };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">Selamat datang, {nama}</h1>
          <span className="mt-3 block h-1 w-12 rounded-full bg-sun" />
          <p className="mt-3 text-sm text-ink">Pantau pengajuan dan transaksi sewa Anda di sini.</p>
        </div>
        <Link href={`${BASE}/ajukan`} className="inline-flex w-fit items-center gap-2 rounded-xl bg-sun px-6 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
          <Plus size={18} /> Ajukan Sewa Baru
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat.map(({ n, label, ikon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Kartu className="flex items-center gap-4 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy text-sun"><Icon size={22} /></span>
              <span>
                <span className="block text-3xl font-extrabold leading-none text-navy">{n}</span>
                <span className="mt-1 block text-xs font-medium text-slate-600">{label}</span>
              </span>
            </Kartu>
          </motion.div>
        ))}
      </div>

      {items.length === 0 ? (
        <Kartu className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-pale text-sky"><PackageSearch size={38} /></span>
          <h2 className="mt-6 text-xl font-bold text-navy">Belum ada transaksi</h2>
          <p className="mt-2 max-w-md text-sm text-ink">Anda belum pernah mengajukan sewa. Jelajahi katalog untuk menemukan fasilitas dan peralatan FMIPA UNNES.</p>
          <Link href="/aset" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sun px-7 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Cari Aset <ArrowRight size={16} /></Link>
        </Kartu>
      ) : (
        <>
          {tindakan && (
            <Kartu className="flex flex-col justify-between gap-4 border-l-4 border-l-sun p-6 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold text-navy"><TriangleAlert size={20} className="text-sun" /> Perlu Tindakan</p>
                <p className="mt-2 font-semibold text-navy">
                  {tindakan.pembayaran === "bukti_ditolak"
                    ? `Bukti pembayaran transaksi ${tindakan.kode} (${asetTeks(tindakan)}) ditolak. Unggah ulang bukti yang valid.`
                    : `Transaksi ${tindakan.kode} (${asetTeks(tindakan)}) telah disetujui dan menunggu pembayaran.`}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {tindakan.batasBayar ? `Batas pembayaran: ${new Date(tindakan.batasBayar).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} WIB. ` : ""}Transaksi dibatalkan otomatis bila batas waktu terlewat. <Sisa batas={tindakan.batasBayar} />
                </p>
              </div>
              <Link href={`${BASE}/transaksi/${tindakan.kode}`} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sun px-5 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">
                <Wallet size={16} /> Bayar Sekarang
              </Link>
            </Kartu>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Kartu className="p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold text-navy">Transaksi Terbaru</h2>
                <span className="text-xs text-slate-500">Terakhir diperbarui: Hari ini</span>
              </div>
              <div className="mt-4 relative overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy">
                      <th className="rounded-l-lg px-4 py-3">No. Transaksi</th><th className="px-4 py-3">Aset</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Total Biaya</th><th className="rounded-r-lg px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pale/80">
                    {items.slice(0, 5).map((t) => (
                      <tr key={t.kode} className="transition hover:bg-soft/70">
                        <td className="px-4 py-4"><Link href={`${BASE}/transaksi/${t.kode}`} className="font-bold text-navy hover:text-sky">{t.kode}</Link></td>
                        <td className="px-4 py-4 text-ink">{asetTeks(t)}</td>
                        <td className="px-4 py-4 text-ink">{periodeTeks(t)}</td>
                        <td className="px-4 py-4 font-semibold text-navy">{rupiah(t.total)}</td>
                        <td className="px-4 py-4"><StatusTrx status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link href={`${BASE}/transaksi`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-sky hover:underline">Lihat Semua Transaksi <ArrowRight size={15} /></Link>
            </Kartu>

            <Kartu className="flex flex-col p-6">
              <h2 className="text-xl font-bold text-navy">Jadwal Terdekat</h2>
              <p className="mt-1 text-xs text-slate-500">Agenda penggunaan aset yang telah terkonfirmasi atau sedang diproses.</p>
              <div className="mt-4 flex-1 space-y-3">
                {jadwal.length === 0 && <p className="rounded-xl bg-soft p-4 text-sm text-slate-500">Belum ada jadwal mendatang.</p>}
                {jadwal.map((t, i) => (
                  <Link key={t.kode} href={`${BASE}/transaksi/${t.kode}`} className={`block rounded-xl p-4 transition hover:-translate-y-0.5 ${i === 0 ? "bg-pale" : "bg-soft"}`}>
                    <p className="flex items-center gap-2 text-sm font-bold text-navy"><CalendarDays size={16} className="text-sky" /> {fmtTgl(t.tanggalMulai)}{t.satuan === "jam" ? `, ${fmtJam(t.jamMulai)}–${fmtJam(t.jamSelesai)}` : ""}</p>
                    <p className="mt-1 text-sm text-ink">{asetTeks(t)}</p>
                    <p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${info[t.status][1]}`}><Clock3 size={13} /> {info[t.status][0]}</p>
                  </Link>
                ))}
              </div>
              <p className="mt-5 flex gap-2 border-t border-pale pt-4 text-xs leading-relaxed text-slate-500"><Info size={14} className="mt-0.5 shrink-0" /> Butuh perubahan jadwal? Hubungi pengelola unit terkait selambatnya H-2 kegiatan.</p>
            </Kartu>
          </div>
        </>
      )}
    </div>
  );
}
