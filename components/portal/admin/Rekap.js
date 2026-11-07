"use client";

import { useMemo, useState } from "react";
import { Download, ReceiptText, Banknote, Gavel, Trophy } from "lucide-react";
import { Kartu, JudulHalaman, StatusTrx, StatusBayar } from "../ui";
import { useSemuaTransaksi, STATUS_TRX, asetTeks, penyewaTeks, periodeTeks, dendaBelumBayar, totalDenda } from "@/lib/transaksi";
import { barisRekap } from "./Dashboard";
import { unduhCsv } from "@/lib/csv";
import { rupiah } from "@/lib/data";

const AWAL = { bulan: "", kategori: "semua", status: "semua", aset: "semua" };

export default function Rekap() {
  const { siap, items } = useSemuaTransaksi();
  const [f, setF] = useState(AWAL);
  const asetOpsi = useMemo(() => [...new Map(items.map((t) => [t.asetSlug, t.asetNama])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [items]);
  const hasil = useMemo(() => items.filter((t) => (!f.bulan || t.tanggalMulai.startsWith(f.bulan)) && (f.kategori === "semua" || t.kategori === f.kategori) && (f.status === "semua" || t.status === f.status) && (f.aset === "semua" || t.asetSlug === f.aset)).sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai)), [items, f]);
  if (!siap) return null;

  const pendapatan = hasil.filter((t) => t.pembayaran === "lunas").reduce((s, t) => s + t.total, 0);
  const denda = hasil.reduce((s, t) => s + totalDenda(t), 0);
  const populer = Object.entries(hasil.reduce((m, t) => ({ ...m, [t.asetNama]: (m[t.asetNama] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maks = populer[0]?.[1] ?? 1;
  const sel = "w-full rounded-lg bg-pale/70 px-3.5 py-2.5 text-sm font-medium text-navy outline-none focus:ring-2 focus:ring-sky/40";
  const lab = "block text-[11px] font-bold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Rekap Transaksi" sub="Rekap penyewaan menurut periode, kategori, aset, dan status, termasuk pendapatan dan denda."
        aksi={<button type="button" onClick={() => unduhCsv(`rekap-sipasti${f.bulan ? "-" + f.bulan : ""}.csv`, barisRekap(hasil))} className="inline-flex w-fit items-center gap-2 rounded-xl bg-sun px-5 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5"><Download size={17} /> Unduh CSV</button>} />
      <Kartu className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className={lab}>Bulan<input type="month" value={f.bulan} onChange={(e) => setF({ ...f, bulan: e.target.value })} className={`${sel} mt-1.5`} /></label>
          <label className={lab}>Kategori<select value={f.kategori} onChange={(e) => setF({ ...f, kategori: e.target.value })} className={`${sel} mt-1.5`}><option value="semua">Semua</option><option value="ruangan">Fasilitas dan Ruangan</option><option value="peralatan">Peralatan dan Perlengkapan</option></select></label>
          <label className={lab}>Aset<select value={f.aset} onChange={(e) => setF({ ...f, aset: e.target.value })} className={`${sel} mt-1.5`}><option value="semua">Semua Aset</option>{asetOpsi.map(([s, n]) => <option key={s} value={s}>{n}</option>)}</select></label>
          <label className={lab}>Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={`${sel} mt-1.5`}><option value="semua">Semua Status</option>{Object.entries(STATUS_TRX).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
          <button type="button" onClick={() => setF(AWAL)} className="py-2.5 text-left text-sm font-semibold text-sky hover:underline">Atur Ulang</button>
        </div>
      </Kartu>

      <div className="grid gap-4 sm:grid-cols-3">
        {[[ReceiptText, "Jumlah transaksi", `${hasil.length}`], [Banknote, "Pendapatan (lunas)", rupiah(pendapatan)], [Gavel, "Total denda", rupiah(denda)]].map(([Ik, l, v]) => (
          <Kartu key={l} className="flex items-center gap-4 p-5"><span className="flex size-12 items-center justify-center rounded-xl bg-navy text-sun"><Ik size={22} /></span><span><span className="block text-xs text-slate-500">{l}</span><span className="block text-xl font-extrabold text-navy">{v}</span></span></Kartu>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Kartu className="p-6">
          {hasil.length === 0 ? <p className="rounded-xl bg-soft p-8 text-center text-sm text-slate-500">Tidak ada transaksi pada filter ini.</p> : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">No.</th><th className="px-3 py-3">Penyewa</th><th className="px-3 py-3">Aset</th><th className="px-3 py-3">Periode</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th><th className="rounded-r-lg px-3 py-3">Bayar</th></tr></thead>
                <tbody className="divide-y divide-pale/80">
                  {hasil.map((t) => (
                    <tr key={t.kode}><td className="px-3 py-3.5 font-bold text-navy">{t.kode}</td><td className="px-3 py-3.5 text-ink">{penyewaTeks(t)}</td><td className="px-3 py-3.5 text-ink">{asetTeks(t)}</td><td className="px-3 py-3.5 text-xs text-ink">{periodeTeks(t)}</td><td className="px-3 py-3.5 font-semibold text-navy">{rupiah(t.total)}{dendaBelumBayar(t) > 0 && <span className="block text-xs font-normal text-red-600">+ denda {rupiah(dendaBelumBayar(t))}</span>}</td><td className="px-3 py-3.5"><StatusTrx status={t.status} /></td><td className="px-3 py-3.5"><StatusBayar status={t.pembayaran} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Kartu>
        <Kartu className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Trophy size={17} className="text-sun" /> Aset Paling Sering Disewa</h2>
          <ul className="mt-4 space-y-3.5">
            {populer.length === 0 && <li className="text-sm text-slate-500">Belum ada data.</li>}
            {populer.map(([n, c]) => <li key={n}><div className="flex justify-between text-xs"><span className="font-semibold text-navy">{n}</span><b className="text-sky">{c}×</b></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-pale/70"><div className="h-full rounded-full bg-sky" style={{ width: `${(c / maks) * 100}%` }} /></div></li>)}
          </ul>
        </Kartu>
      </div>
    </div>
  );
}
