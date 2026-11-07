"use client";

import { useMemo, useState } from "react";
import { Banknote, Ban, CircleCheck, CircleAlert, Hourglass } from "lucide-react";
import { Kartu, JudulHalaman } from "../ui";
import { useSemuaTransaksi, asetTeks, penyewaTeks, fmtWaktu, periodeTeks } from "@/lib/transaksi";
import { batalkanOlehKampus, tandaiRefund } from "@/lib/aksi";
import { rupiah } from "@/lib/data";

export default function Refund() {
  const { siap, items } = useSemuaTransaksi();
  const [kode, setKode] = useState("");
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState("");
  const [ok, setOk] = useState("");

  const batal = useMemo(() => items.filter((t) => t.status === "dibatalkan"), [items]);
  const bisa = useMemo(() => items.filter((t) => ["diajukan", "disetujui"].includes(t.status)), [items]);
  if (!siap) return null;

  const perlu = batal.filter((t) => t.refund?.nominal > 0 && !t.refund.diproses);
  const totalPerlu = perlu.reduce((s, t) => s + t.refund.nominal, 0);

  function kirim(e) {
    e.preventDefault();
    const t = bisa.find((x) => x.kode === kode);
    if (!t) return setGalat("Pilih transaksi yang akan dibatalkan.");
    if (alasan.trim().length < 5) return setGalat("Alasan pembatalan wajib diisi (minimal 5 karakter).");
    batalkanOlehKampus(t, alasan);
    setGalat(""); setKode(""); setAlasan(""); setOk(`Transaksi ${t.kode} dibatalkan oleh pihak kampus.`);
  }

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Pembatalan dan Refund" sub="Pantau transaksi yang dibatalkan, catat pengembalian dana, dan batalkan transaksi atas nama kampus." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[[Hourglass, "Refund perlu diproses", `${perlu.length} transaksi`], [Banknote, "Total dana dikembalikan", rupiah(totalPerlu)], [Ban, "Transaksi dibatalkan", `${batal.length} transaksi`]].map(([Ik, l, v]) => (
          <Kartu key={l} className="flex items-center gap-4 p-5"><span className="flex size-12 items-center justify-center rounded-xl bg-navy text-sun"><Ik size={22} /></span><span><span className="block text-xs text-slate-500">{l}</span><span className="block text-xl font-extrabold text-navy">{v}</span></span></Kartu>
        ))}
      </div>

      <Kartu className="p-6">
        <h2 className="text-lg font-bold text-navy">Daftar Pembatalan</h2>
        {batal.length === 0 ? <p className="mt-4 rounded-xl bg-soft p-8 text-center text-sm text-slate-500">Belum ada transaksi yang dibatalkan.</p> : (
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">No. Transaksi</th><th className="px-3 py-3">Penyewa</th><th className="px-3 py-3">Aset</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Refund</th><th className="px-3 py-3">Keterangan</th><th className="rounded-r-lg px-3 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-pale/80">
                {batal.map((t) => {
                  const r = t.refund;
                  return (
                    <tr key={t.kode}>
                      <td className="px-3 py-4 font-bold text-navy">{t.kode}</td>
                      <td className="px-3 py-4 text-ink">{penyewaTeks(t)}</td>
                      <td className="px-3 py-4 text-ink">{asetTeks(t)}<span className="block text-xs text-slate-500">{periodeTeks(t)}</span></td>
                      <td className="px-3 py-4 font-semibold text-navy">{rupiah(t.total)}</td>
                      <td className="px-3 py-4 font-bold text-navy">{r ? `${rupiah(r.nominal)} (${r.persen}%)` : "—"}</td>
                      <td className="max-w-56 px-3 py-4 text-xs text-slate-600">{t.alasanBatal || t.catatanAdmin || r?.ket}<span className="block text-slate-400">{fmtWaktu(t.riwayat.at(-1).w)}</span></td>
                      <td className="px-3 py-4">
                        {!r || r.nominal === 0 ? <span className="text-xs font-semibold text-slate-500">Tanpa refund</span>
                          : r.diproses ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CircleCheck size={14} /> Sudah ditransfer</span>
                          : <button type="button" onClick={() => tandaiRefund(t)} className="rounded-lg bg-sun px-3 py-1.5 text-xs font-bold text-navy shadow-sm transition hover:-translate-y-0.5">Tandai Sudah Ditransfer</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Kartu>

      <Kartu className="p-6">
        <h2 className="text-lg font-bold text-navy">Pembatalan oleh Pihak Kampus</h2>
        <p className="mt-1 text-xs text-slate-500">Misalnya jadwal bentrok dengan kegiatan prioritas atau aset memerlukan perawatan. Penyewa yang sudah membayar memperoleh refund 100%.</p>
        {ok && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CircleCheck size={17} /> {ok}</p>}
        <form onSubmit={kirim} className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
          <label className="block text-sm font-bold text-navy">Transaksi
            <select value={kode} onChange={(e) => { setKode(e.target.value); setGalat(""); setOk(""); }} className="mt-1.5 w-full rounded-xl bg-pale/60 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-sky/40">
              <option value="">— Pilih transaksi aktif —</option>
              {bisa.map((t) => <option key={t.kode} value={t.kode}>{t.kode} · {t.asetNama} · {penyewaTeks(t)}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-navy">Alasan Pembatalan
            <input value={alasan} onChange={(e) => { setAlasan(e.target.value); setGalat(""); }} placeholder="mis. Bentrok dengan kegiatan fakultas" className="mt-1.5 w-full rounded-xl bg-pale/60 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-sky/40" />
          </label>
          <button type="submit" className="rounded-xl border border-red-300 px-6 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50">Batalkan Transaksi</button>
        </form>
        {galat && <p role="alert" className="mt-3 flex items-center gap-1.5 text-xs text-red-600"><CircleAlert size={13} /> {galat}</p>}
      </Kartu>
    </div>
  );
}
