"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, PackageSearch, ArrowRight, Plus } from "lucide-react";
import { Kartu, JudulHalaman, StatusTrx, StatusBayar, Sisa } from "./ui";
import { useSesi } from "@/lib/useClient";
import { useTransaksi, asetTeks, periodeTeks, STATUS_TRX } from "@/lib/transaksi";
import { rupiah } from "@/lib/data";

const BASE = "/dashboard/penyewa";
const AKHIR = ["selesai", "ditolak", "dibatalkan"];

export default function TransaksiList({ mode = "semua" }) {
  const sesi = useSesi();
  const { siap, items } = useTransaksi(sesi?.email);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("semua");

  const dasar = useMemo(() => (mode === "riwayat" ? items.filter((t) => AKHIR.includes(t.status)) : items), [items, mode]);
  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return dasar.filter((t) => (status === "semua" || t.status === status) && (!kata || `${t.kode} ${asetTeks(t)}`.toLowerCase().includes(kata)));
  }, [dasar, q, status]);

  if (!siap) return null;
  const pilihan = mode === "riwayat" ? AKHIR : Object.keys(STATUS_TRX);

  return (
    <div className="space-y-6">
      <JudulHalaman
        judul={mode === "riwayat" ? "Riwayat Penyewaan" : "Transaksi Saya"}
        sub={mode === "riwayat" ? "Arsip penyewaan yang telah selesai, ditolak, atau dibatalkan." : "Seluruh pengajuan dan penyewaan aset yang pernah Anda lakukan."}
        aksi={mode !== "riwayat" && <Link href={`${BASE}/ajukan`} className="inline-flex w-fit items-center gap-2 rounded-xl bg-sun px-6 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5"><Plus size={18} /> Ajukan Sewa Baru</Link>}
      />
      <Kartu className="p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-80">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari no. transaksi atau aset…" aria-label="Cari transaksi" className="w-full rounded-xl bg-pale py-2.5 pl-10 pr-3 text-sm outline-none ring-sky/40 placeholder:text-slate-500 focus:ring-2" />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status">
            {["semua", ...pilihan].map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={status === s} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${status === s ? "bg-navy text-white" : "bg-soft text-navy hover:bg-pale"}`}>
                {s === "semua" ? "Semua" : STATUS_TRX[s].label}
              </button>
            ))}
          </div>
        </div>

        {hasil.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-pale text-sky"><PackageSearch size={30} /></span>
            <p className="mt-4 font-bold text-navy">Tidak ada transaksi</p>
            <p className="mt-1 text-sm text-ink">Coba ubah kata kunci atau filter status.</p>
          </div>
        ) : (
          <div className="mt-5 relative overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy">
                  <th className="rounded-l-lg px-4 py-3">No. Transaksi</th><th className="px-4 py-3">Aset</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pembayaran</th><th className="rounded-r-lg px-4 py-3"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pale/80">
                {hasil.map((t) => (
                  <tr key={t.kode} className="transition hover:bg-soft/70">
                    <td className="px-4 py-4 font-bold text-navy">{t.kode}</td>
                    <td className="px-4 py-4 text-ink">{asetTeks(t)}</td>
                    <td className="px-4 py-4 text-ink">{periodeTeks(t)}</td>
                    <td className="px-4 py-4 font-semibold text-navy">{rupiah(t.total)}</td>
                    <td className="px-4 py-4"><StatusTrx status={t.status} /></td>
                    <td className="px-4 py-4"><div className="flex flex-col items-start gap-1"><StatusBayar status={t.pembayaran} />{t.status === "disetujui" && ["belum_dibayar", "bukti_ditolak"].includes(t.pembayaran) && <Sisa batas={t.batasBayar} />}</div></td>
                    <td className="px-4 py-4 text-right"><Link href={`${BASE}/transaksi/${t.kode}`} className="inline-flex items-center gap-1 text-sm font-bold text-sky hover:underline">Detail <ArrowRight size={14} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Kartu>
    </div>
  );
}
