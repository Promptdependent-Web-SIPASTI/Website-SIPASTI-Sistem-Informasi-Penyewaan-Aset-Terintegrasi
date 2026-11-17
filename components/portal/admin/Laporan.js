"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, LoaderCircle, ReceiptText, Users, Banknote, TrendingUp, CircleAlert, Info, PackageSearch } from "lucide-react";
import { Kartu, JudulHalaman, StatusTrx, StatusBayar } from "../ui";
import { useSemuaTransaksi, periodeTeks, fmtTglPendek } from "@/lib/transaksi";
import { hitungLaporan, tahunTersedia } from "@/lib/laporan";
import { unduhExcel } from "@/lib/laporanExcel";
import { useHariIni, useSesi } from "@/lib/useClient";
import { rupiah } from "@/lib/data";

const TAB = [["bulan", "Per Bulan"], ["penyewa", "Daftar Penyewa"], ["aset", "Per Aset"], ["detail", "Detail Transaksi"]];
const th = "px-3 py-3 text-xs font-bold uppercase tracking-wide text-navy";

function Total({ children }) {
  return <tr className="border-t-2 border-navy bg-pale/60 font-extrabold text-navy">{children}</tr>;
}

export default function Laporan() {
  const { siap, items } = useSemuaTransaksi();
  const sesi = useSesi();
  const hariIni = useHariIni();
  const [pilih, setPilih] = useState(null);
  const [tab, setTab] = useState("bulan");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState("");
  const [ok, setOk] = useState("");

  const daftarTahun = useMemo(() => tahunTersedia(items), [items]);
  const tahunIni = Number(hariIni.slice(0, 4));
  const tahun = pilih ?? (daftarTahun.includes(tahunIni) ? tahunIni : daftarTahun[0] ?? tahunIni);
  const lap = useMemo(() => hitungLaporan(items, tahun), [items, tahun]);
  const maks = Math.max(1, ...lap.perBulan.map((b) => b.bersih));

  if (!siap) return null;

  async function unduh() {
    setProses(true); setGalat(""); setOk("");
    try { const nama = await unduhExcel(lap, { dibuatOleh: sesi?.nama }); setOk(`${nama} berhasil dibuat.`); }
    catch (e) { console.error(e); setGalat("Gagal membuat file Excel. Coba lagi."); }
    finally { setProses(false); }
  }

  const stat = [
    { ikon: ReceiptText, l: "Jumlah transaksi", v: lap.total.transaksi },
    { ikon: Users, l: "Penyewa unik", v: lap.total.penyewa },
    { ikon: Banknote, l: "Pendapatan sewa", v: rupiah(lap.total.sewa), teks: true },
    { ikon: TrendingUp, l: "Pendapatan bersih", v: rupiah(lap.total.bersih), teks: true, sub: `Refund ${rupiah(lap.total.refund)} · Denda ${rupiah(lap.total.denda)}` },
  ];

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Laporan Tahunan" sub="Siapa saja yang menyewa dan berapa pendapatannya dalam setahun. Laporan dapat diunduh ke Excel kapan saja dan selalu berisi data terbaru."
        aksi={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">Tahun
              <select value={tahun} onChange={(e) => setPilih(Number(e.target.value))} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy shadow-sm outline-none focus:ring-2 focus:ring-sky/40">
                {(daftarTahun.length ? daftarTahun : [tahun]).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <button type="button" onClick={unduh} disabled={proses || lap.total.transaksi === 0} className="inline-flex items-center gap-2 rounded-xl bg-sun px-5 py-3 text-sm font-bold text-navy shadow-md transition enabled:hover:-translate-y-0.5 disabled:opacity-60">
              {proses ? <LoaderCircle size={17} className="animate-spin" /> : <FileSpreadsheet size={17} />} {proses ? "Menyusun file…" : "Unduh Excel (.xlsx)"}
            </button>
          </div>
        } />

      {ok && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><FileSpreadsheet size={16} /> {ok}</p>}
      {galat && <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><CircleAlert size={16} /> {galat}</p>}

      {lap.total.transaksi === 0 ? (
        <Kartu className="flex flex-col items-center px-6 py-16 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-pale text-sky"><PackageSearch size={30} /></span><p className="mt-4 font-bold text-navy">Belum ada transaksi pada tahun {tahun}</p></Kartu>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stat.map(({ ikon: Ik, l, v, teks, sub }) => (
              <Kartu key={l} className="p-5"><span className="flex size-11 items-center justify-center rounded-xl bg-navy text-sun"><Ik size={20} /></span><p className={`mt-4 font-extrabold text-navy ${teks ? "text-xl" : "text-3xl"}`}>{v}</p><p className="mt-1 text-xs text-slate-600">{l}</p>{sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}</Kartu>
            ))}
          </div>

          <Kartu className="p-6">
            <h2 className="text-lg font-bold text-navy">Pendapatan Bersih per Bulan — {tahun}</h2>
            <div className="mt-5 flex h-48 items-end gap-2 sm:gap-3" role="img" aria-label="Grafik batang pendapatan bersih per bulan">
              {lap.perBulan.map((b) => (
                <div key={b.bulan} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${b.bulan}: ${rupiah(b.bersih)} (${b.transaksi} transaksi)`}>
                  <span className="text-[10px] font-semibold text-slate-500">{b.bersih > 0 ? `${(b.bersih / 1000000).toFixed(1).replace(".", ",")}jt` : ""}</span>
                  <div className="w-full rounded-t-md bg-sky transition-all" style={{ height: `${Math.max(b.bersih > 0 ? 4 : 0, (b.bersih / maks) * 100)}%`, minHeight: b.bersih > 0 ? 4 : 0 }} />
                  <span className="text-[10px] font-medium text-slate-500 sm:text-xs">{b.bulan.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </Kartu>

          <Kartu className="p-5 md:p-6">
            <div className="flex flex-wrap gap-2" role="tablist">
              {TAB.map(([id, l]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${tab === id ? "bg-navy text-white" : "bg-soft text-navy hover:bg-pale"}`}>{l}</button>)}
            </div>

            <div className="relative mt-5 overflow-x-auto">
              {tab === "bulan" && (
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead><tr className="bg-pale/70"><th className={`${th} rounded-l-lg`}>Bulan</th><th className={th}>Transaksi</th><th className={th}>Penyewa Unik</th><th className={th}>Pendapatan Sewa</th><th className={th}>Refund</th><th className={th}>Denda</th><th className={`${th} rounded-r-lg`}>Pendapatan Bersih</th></tr></thead>
                  <tbody className="divide-y divide-pale/80">
                    {lap.perBulan.map((b) => <tr key={b.bulan} className={b.transaksi === 0 ? "text-slate-400" : ""}><td className="px-3 py-3 font-semibold text-navy">{b.bulan}</td><td className="px-3 py-3">{b.transaksi}</td><td className="px-3 py-3">{b.penyewa}</td><td className="px-3 py-3">{rupiah(b.sewa)}</td><td className="px-3 py-3">{rupiah(b.refund)}</td><td className="px-3 py-3">{rupiah(b.denda)}</td><td className="px-3 py-3 font-bold text-navy">{rupiah(b.bersih)}</td></tr>)}
                    <Total><td className="px-3 py-3">TOTAL</td><td className="px-3 py-3">{lap.total.transaksi}</td><td className="px-3 py-3">{lap.total.penyewa}</td><td className="px-3 py-3">{rupiah(lap.total.sewa)}</td><td className="px-3 py-3">{rupiah(lap.total.refund)}</td><td className="px-3 py-3">{rupiah(lap.total.denda)}</td><td className="px-3 py-3">{rupiah(lap.total.bersih)}</td></Total>
                  </tbody>
                </table>
              )}
              {tab === "penyewa" && (
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead><tr className="bg-pale/70"><th className={`${th} rounded-l-lg`}>No</th><th className={th}>Penyewa</th><th className={th}>NIM / NIP</th><th className={th}>Transaksi</th><th className={th}>Pendapatan Sewa</th><th className={th}>Refund</th><th className={th}>Denda</th><th className={`${th} rounded-r-lg`}>Bersih</th></tr></thead>
                  <tbody className="divide-y divide-pale/80">
                    {lap.penyewa.map((p, i) => <tr key={p.email}><td className="px-3 py-3 text-slate-500">{i + 1}</td><td className="px-3 py-3"><span className="block font-bold text-navy">{p.nama}</span><span className="text-xs text-slate-500">{p.unit || p.tipe}</span></td><td className="px-3 py-3 text-xs text-ink">{p.idn}</td><td className="px-3 py-3">{p.transaksi}</td><td className="px-3 py-3">{rupiah(p.sewa)}</td><td className="px-3 py-3">{rupiah(p.refund)}</td><td className="px-3 py-3">{rupiah(p.denda)}</td><td className="px-3 py-3 font-bold text-navy">{rupiah(p.bersih)}</td></tr>)}
                    <Total><td className="px-3 py-3" colSpan={3}>TOTAL ({lap.total.penyewa} penyewa)</td><td className="px-3 py-3">{lap.total.transaksi}</td><td className="px-3 py-3">{rupiah(lap.total.sewa)}</td><td className="px-3 py-3">{rupiah(lap.total.refund)}</td><td className="px-3 py-3">{rupiah(lap.total.denda)}</td><td className="px-3 py-3">{rupiah(lap.total.bersih)}</td></Total>
                  </tbody>
                </table>
              )}
              {tab === "aset" && (
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead><tr className="bg-pale/70"><th className={`${th} rounded-l-lg`}>No</th><th className={th}>Aset</th><th className={th}>Kategori</th><th className={th}>Transaksi</th><th className={th}>Pendapatan Sewa</th><th className={`${th} rounded-r-lg`}>Bersih</th></tr></thead>
                  <tbody className="divide-y divide-pale/80">
                    {lap.perAset.map((a, i) => <tr key={a.kode}><td className="px-3 py-3 text-slate-500">{i + 1}</td><td className="px-3 py-3"><span className="block font-bold text-navy">{a.nama}</span><span className="text-xs text-slate-500">{a.kode}</span></td><td className="px-3 py-3 text-xs text-ink">{a.kategori}</td><td className="px-3 py-3">{a.transaksi}</td><td className="px-3 py-3">{rupiah(a.sewa)}</td><td className="px-3 py-3 font-bold text-navy">{rupiah(a.bersih)}</td></tr>)}
                    <Total><td className="px-3 py-3" colSpan={3}>TOTAL</td><td className="px-3 py-3">{lap.total.transaksi}</td><td className="px-3 py-3">{rupiah(lap.total.sewa)}</td><td className="px-3 py-3">{rupiah(lap.total.bersih)}</td></Total>
                  </tbody>
                </table>
              )}
              {tab === "detail" && (
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead><tr className="bg-pale/70"><th className={`${th} rounded-l-lg`}>No. Transaksi</th><th className={th}>Tanggal</th><th className={th}>Penyewa</th><th className={th}>Aset</th><th className={th}>Status</th><th className={th}>Pembayaran</th><th className={`${th} rounded-r-lg`}>Bersih</th></tr></thead>
                  <tbody className="divide-y divide-pale/80">
                    {lap.baris.map((x) => <tr key={x.t.kode}><td className="px-3 py-3 font-bold text-navy">{x.t.kode}</td><td className="px-3 py-3 text-xs text-ink">{fmtTglPendek(x.t.tanggalMulai)}</td><td className="px-3 py-3 text-ink">{x.t.penyewa?.nama}</td><td className="px-3 py-3 text-ink">{x.t.asetNama}<span className="block text-xs text-slate-500">{periodeTeks(x.t)}</span></td><td className="px-3 py-3"><StatusTrx status={x.t.status} /></td><td className="px-3 py-3"><StatusBayar status={x.t.pembayaran} /></td><td className="px-3 py-3 font-bold text-navy">{rupiah(x.bersih)}</td></tr>)}
                    <Total><td className="px-3 py-3" colSpan={6}>TOTAL</td><td className="px-3 py-3">{rupiah(lap.total.bersih)}</td></Total>
                  </tbody>
                </table>
              )}
            </div>
          </Kartu>

          <p className="flex gap-2.5 rounded-xl bg-pale/60 px-4 py-3 text-xs leading-relaxed text-sky"><Info size={15} className="mt-0.5 shrink-0" /> Periode memakai tanggal pemakaian aset. Pendapatan bersih = pembayaran lunas − refund yang sudah ditransfer + denda yang sudah lunas. Transaksi yang ditolak, diajukan, atau dibatalkan sebelum dibayar tidak dihitung. File Excel memuat total sebagai rumus, sehingga ikut berubah bila data diedit.</p>
        </>
      )}
    </div>
  );
}
