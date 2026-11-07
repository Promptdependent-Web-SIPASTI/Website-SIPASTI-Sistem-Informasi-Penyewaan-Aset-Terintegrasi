"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, ClipboardPlus, Lock, CircleCheck, ArrowRight, PackageSearch } from "lucide-react";
import { Kartu, JudulHalaman, StatusTrx, StatusBayar } from "../ui";
import { useSemuaTransaksi, asetTeks, penyewaTeks, periodeTeks, batasKembaliMs, mulaiMs } from "@/lib/transaksi";
import { useHariIni } from "@/lib/useClient";
import { fromISO, tambahHari, toISO } from "@/lib/waktu";

const BASE = "/dashboard/petugas";
const KONF = {
  jadwal: { judul: "Jadwal Penyewaan", sub: "Seluruh penyewaan terkonfirmasi dan sedang berjalan, menurut tanggal pemakaian." },
  "serah-terima": { judul: "Serah Terima Aset", sub: "Transaksi disetujui yang menunggu serah terima. Serah terima hanya dapat dicatat setelah pembayaran Lunas." },
  pengembalian: { judul: "Pengembalian Aset", sub: "Aset yang sedang disewa dan perlu dicatat pengembaliannya." },
};

export default function Daftar({ mode }) {
  const { siap, items } = useSemuaTransaksi();
  const hariIni = useHariIni();
  const [rentang, setRentang] = useState("semua");
  const k = KONF[mode];

  const hasil = useMemo(() => {
    const akhir7 = toISO(tambahHari(fromISO(hariIni || "2000-01-01"), 7));
    let l = items;
    if (mode === "jadwal") l = items.filter((t) => ["disetujui", "sedang_disewa"].includes(t.status));
    if (mode === "serah-terima") l = items.filter((t) => t.status === "disetujui");
    if (mode === "pengembalian") l = items.filter((t) => ["sedang_disewa", "dikembalikan"].includes(t.status));
    if (mode === "jadwal" && rentang === "hari-ini") l = l.filter((t) => t.tanggalMulai <= hariIni && toISO(new Date(batasKembaliMs(t))) >= hariIni);
    if (mode === "jadwal" && rentang === "tujuh") l = l.filter((t) => t.tanggalMulai >= hariIni && t.tanggalMulai <= akhir7);
    return [...l].sort((a, b) => mulaiMs(a) - mulaiMs(b));
  }, [items, mode, rentang, hariIni]);

  if (!siap) return null;
  const Ik = mode === "pengembalian" ? ClipboardPlus : ClipboardCheck;

  return (
    <div className="space-y-6">
      <JudulHalaman judul={k.judul} sub={k.sub} />
      {mode === "jadwal" && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Rentang jadwal">
          {[["semua", "Semua Aktif"], ["hari-ini", "Hari Ini"], ["tujuh", "7 Hari ke Depan"]].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={rentang === v} onClick={() => setRentang(v)} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${rentang === v ? "bg-navy text-white" : "bg-white text-navy shadow-sm hover:bg-pale"}`}><CalendarDays size={13} /> {l}</button>
          ))}
        </div>
      )}
      <Kartu className="p-5 md:p-6">
        {hasil.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-pale text-sky"><PackageSearch size={28} /></span><p className="mt-4 font-bold text-navy">Tidak ada data</p><p className="mt-1 text-sm text-ink">Belum ada transaksi yang sesuai pada daftar ini.</p></div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">No. Transaksi</th><th className="px-3 py-3">Penyewa</th><th className="px-3 py-3">Aset</th><th className="px-3 py-3">Periode</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Pembayaran</th><th className="rounded-r-lg px-3 py-3"><span className="sr-only">Aksi</span></th></tr></thead>
              <tbody className="divide-y divide-pale/80">
                {hasil.map((t) => {
                  const kunci = t.status === "disetujui" && t.pembayaran !== "lunas";
                  const tab = t.status === "disetujui" ? "serah-terima" : "pengembalian";
                  const aksi = t.status === "disetujui" ? (kunci ? "Lihat" : "Catat Serah Terima") : t.status === "sedang_disewa" ? "Catat Pengembalian" : "Lihat";
                  const tebal = aksi.startsWith("Catat");
                  return (
                    <tr key={t.kode} className="transition hover:bg-soft/70">
                      <td className="px-3 py-4 font-bold text-navy">{t.kode}</td>
                      <td className="px-3 py-4 text-ink">{penyewaTeks(t)}</td>
                      <td className="px-3 py-4 text-ink">{asetTeks(t)}</td>
                      <td className="px-3 py-4 text-xs text-ink">{periodeTeks(t)}</td>
                      <td className="px-3 py-4"><StatusTrx status={t.status} /></td>
                      <td className="px-3 py-4"><StatusBayar status={t.pembayaran} /></td>
                      <td className="px-3 py-4 text-right">
                        <Link href={`${BASE}/transaksi/${t.kode}?tab=${tab}`} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${tebal ? "bg-sun text-navy shadow-sm hover:-translate-y-0.5" : "border border-sky text-sky hover:bg-sky hover:text-white"}`}>
                          {kunci ? <Lock size={13} /> : tebal ? <Ik size={13} /> : t.status === "dikembalikan" ? <CircleCheck size={13} /> : <ArrowRight size={13} />} {aksi}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Kartu>
    </div>
  );
}
