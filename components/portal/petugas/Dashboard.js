"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ClipboardCheck, ClipboardPlus, KeyRound, Hourglass, Bell, Wrench, TriangleAlert, ArrowRight, CircleCheck, Clock3, Info } from "lucide-react";
import { Kartu } from "../ui";
import { useSemuaTransaksi, asetTeks, penyewaTeks, batasKembaliMs, fmtJam, fmtTgl, mulaiMs } from "@/lib/transaksi";
import { useAsetList } from "@/lib/asetStore";
import { useHariIni } from "@/lib/useClient";
import { HARI_PANJANG, fromISO, tambahHari, toISO } from "@/lib/waktu";

const BASE = "/dashboard/petugas";
const jamTeks = (ms) => new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
const tglBatas = (t) => toISO(new Date(batasKembaliMs(t)));

export default function DashboardPetugas() {
  const { siap, items } = useSemuaTransaksi();
  const aset = useAsetList();
  const hariIni = useHariIni();
  if (!siap) return null;

  const hari = HARI_PANJANG[fromISO(hariIni).getDay()];
  const serahHariIni = items.filter((t) => t.status === "disetujui" && t.pembayaran === "lunas" && t.tanggalMulai === hariIni);
  const kembaliHariIni = items.filter((t) => t.status === "sedang_disewa" && tglBatas(t) <= hariIni);
  const sedang = items.filter((t) => t.status === "sedang_disewa");
  const tunggu = items.filter((t) => t.status === "disetujui" && t.pembayaran !== "lunas");
  const akhirMinggu = toISO(tambahHari(fromISO(hariIni), 7));
  const tujuhHari = items.filter((t) => ["disetujui"].includes(t.status) && t.tanggalMulai > hariIni && t.tanggalMulai <= akhirMinggu).sort((a, b) => mulaiMs(a) - mulaiMs(b));
  const stat = [
    { n: serahHariIni.length, label: "Perlu Serah Terima Hari Ini", ikon: ClipboardCheck },
    { n: kembaliHariIni.length, label: "Perlu Dikembalikan Hari Ini", ikon: ClipboardPlus },
    { n: sedang.length, label: "Sedang Disewa", ikon: KeyRound },
    { n: tunggu.length, label: "Menunggu Pelunasan", ikon: Hourglass },
  ];
  const perhatian = [
    ...aset.filter((a) => a.kategori === "peralatan" && /rusak/i.test(a.kondisi)).map((a) => ({ ikon: Wrench, warna: "text-sky", teks: `${a.nama}: ${a.kondisi} (tersedia ${a.stok} dari ${a.stokTotal} unit).` })),
    ...aset.filter((a) => a.status === "Tidak tersedia").map((a) => ({ ikon: TriangleAlert, warna: "text-orange-500", teks: `${a.nama2 ?? a.nama} nonaktif karena ${a.statusKet ?? "perawatan"}.` })),
  ];
  const adaHariIni = serahHariIni.length + kembaliHariIni.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Dashboard Petugas</h1>
        <span className="mt-3 block h-1 w-12 rounded-full bg-sun" />
        <p className="mt-3 text-sm text-ink">{hari}, {fmtTgl(hariIni)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat.map(({ n, label, ikon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Kartu className="flex h-full items-center gap-4 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy text-sun"><Icon size={22} /></span>
              <span className="min-w-0"><span className="block text-3xl font-extrabold leading-none text-navy">{n}</span><span className="mt-1 block text-xs font-medium leading-snug text-slate-600">{label}</span></span>
            </Kartu>
          </motion.div>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Kartu className="p-6">
            <h2 className="text-xl font-bold text-navy">Jadwal Hari Ini</h2>
            <div className="mt-4 space-y-3">
              {kembaliHariIni.map((t) => (
                <div key={t.kode} className="flex flex-col justify-between gap-3 rounded-xl bg-pale/60 p-4 sm:flex-row sm:items-center">
                  <div><p className="font-bold leading-snug text-navy">Batas kembali {jamTeks(batasKembaliMs(t))} WIB · {asetTeks(t)} · {penyewaTeks(t)} · {t.kode}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-sky"><Clock3 size={14} /> Sedang Disewa</p></div>
                  <Link href={`${BASE}/transaksi/${t.kode}?tab=pengembalian`} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sun px-5 py-2.5 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Catat Pengembalian</Link>
                </div>
              ))}
              {serahHariIni.map((t) => (
                <div key={t.kode} className="flex flex-col justify-between gap-3 rounded-xl bg-pale/60 p-4 sm:flex-row sm:items-center">
                  <div><p className="font-bold leading-snug text-navy">Mulai {t.satuan === "jam" ? fmtJam(t.jamMulai) : "07.00"} WIB · {asetTeks(t)} · {penyewaTeks(t)} · {t.kode}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CircleCheck size={14} /> Lunas, siap serah terima</p></div>
                  <Link href={`${BASE}/transaksi/${t.kode}?tab=serah-terima`} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sun px-5 py-2.5 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Catat Serah Terima</Link>
                </div>
              ))}
              {!adaHariIni && <p className="rounded-xl bg-soft p-5 text-sm text-slate-500">Tidak ada serah terima atau pengembalian terjadwal hari ini.</p>}
            </div>
            {serahHariIni.length === 0 && adaHariIni && <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><CircleCheck size={15} /> Tidak ada serah terima terjadwal hari ini.</p>}
          </Kartu>

          <Kartu className="p-6">
            <h2 className="text-xl font-bold text-navy">Jadwal Tujuh Hari ke Depan</h2>
            {tujuhHari.length === 0 ? <p className="mt-4 rounded-xl bg-soft p-5 text-sm text-slate-500">Belum ada jadwal penyewaan terkonfirmasi dalam tujuh hari ke depan.</p> : (
              <ul className="mt-4 divide-y divide-pale">
                {tujuhHari.map((t) => (
                  <li key={t.kode} className="flex flex-col justify-between gap-1 py-4 sm:flex-row sm:items-center">
                    <Link href={`${BASE}/transaksi/${t.kode}?tab=serah-terima`} className="text-sm leading-relaxed text-ink hover:text-sky">{HARI_PANJANG[fromISO(t.tanggalMulai).getDay()]}, {fmtTgl(t.tanggalMulai)}{t.satuan === "jam" ? `, ${fmtJam(t.jamMulai)}–${fmtJam(t.jamSelesai)}` : ""} · {asetTeks(t)} · {penyewaTeks(t)} · {t.kode}</Link>
                    {t.pembayaran === "lunas" ? <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-700"><CircleCheck size={15} /> Siap serah terima</span> : <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-orange-600"><Clock3 size={15} /> Menunggu pelunasan</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 flex gap-2.5 rounded-xl bg-pale/60 p-3.5 text-xs text-sky"><Info size={15} className="mt-0.5 shrink-0" /> Serah terima hanya dapat dicatat setelah pembayaran berstatus Lunas.</p>
          </Kartu>
        </div>

        <Kartu className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Bell size={18} className="text-sun" /> Perlu Perhatian</h2>
          <ul className="mt-4 space-y-4">
            {perhatian.length === 0 && <li className="text-sm text-slate-500">Semua aset dalam kondisi baik.</li>}
            {perhatian.slice(0, 4).map((p, i) => <li key={i} className="flex gap-3 text-sm leading-snug text-ink"><p.ikon size={18} className={`mt-0.5 shrink-0 ${p.warna}`} /> {p.teks}</li>)}
          </ul>
          <Link href={`${BASE}/kondisi`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-sky hover:underline">Catat Kondisi Aset <ArrowRight size={15} /></Link>
        </Kartu>
      </div>
    </div>
  );
}
