"use client";

import { useState } from "react";
import { Gavel, Hourglass, Banknote, CircleCheck, CircleAlert } from "lucide-react";
import { Kartu, JudulHalaman } from "../ui";
import { useSemuaTransaksi, penyewaTeks, asetTeks, totalDenda, dendaBelumBayar } from "@/lib/transaksi";
import { konfirmasiDendaKerusakan, lunasDenda, selesaikan } from "@/lib/aksi";
import { rupiah } from "@/lib/data";

function Baris({ t }) {
  const d = t.denda;
  const [nominal, setNominal] = useState(String(d.kerusakan || ""));
  const [galat, setGalat] = useState("");
  const menunggu = d.konfirmasi === "menunggu";
  return (
    <tr className="align-top">
      <td className="px-3 py-4 font-bold text-navy">{t.kode}</td>
      <td className="px-3 py-4 text-ink">{penyewaTeks(t)}<span className="block text-xs text-slate-500">{asetTeks(t)}</span></td>
      <td className="px-3 py-4 text-xs text-ink">{d.keterlambatan > 0 ? <><b className="text-sm text-navy">{rupiah(d.keterlambatan)}</b><span className="block text-slate-500">{d.ketTelat}</span></> : <span className="text-slate-400">—</span>}</td>
      <td className="px-3 py-4 text-xs text-ink">
        {menunggu ? (
          <div className="w-44"><p className="mb-1 font-semibold text-orange-600">Usulan petugas — menunggu konfirmasi</p>
            <input aria-label={`Nominal denda kerusakan ${t.kode}`} inputMode="numeric" value={nominal} onChange={(e) => { setNominal(e.target.value.replace(/\D/g, "")); setGalat(""); }} className="w-full rounded-lg bg-pale/60 px-3 py-2 text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-sky/40" />
            <p className="mt-1 text-slate-500">{d.kerusakanKet}</p>{galat && <p role="alert" className="mt-1 flex gap-1 text-red-600"><CircleAlert size={12} className="mt-0.5" /> {galat}</p>}</div>
        ) : d.kerusakan > 0 ? <><b className="text-sm text-navy">{rupiah(d.kerusakan)}</b><span className="block text-slate-500">{d.kerusakanKet}</span></> : <span className="text-slate-400">—</span>}
      </td>
      <td className="px-3 py-4 font-extrabold text-navy">{rupiah(totalDenda(t))}</td>
      <td className="px-3 py-4">
        {menunggu ? <button type="button" onClick={() => (Number(nominal) > 0 ? konfirmasiDendaKerusakan(t, Number(nominal)) : setGalat("Nominal wajib diisi."))} className="rounded-lg bg-sun px-3 py-1.5 text-xs font-bold text-navy shadow-sm transition hover:-translate-y-0.5">Konfirmasi</button>
          : d.statusBayar === "lunas" ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CircleCheck size={14} /> Lunas</span>
          : <button type="button" onClick={() => { lunasDenda(t); if (t.status === "dikembalikan") selesaikan(t); }} className="rounded-lg border border-sky px-3 py-1.5 text-xs font-bold text-sky transition hover:bg-sky hover:text-white">Tandai Lunas</button>}
      </td>
    </tr>
  );
}

export default function Denda() {
  const { siap, items } = useSemuaTransaksi();
  if (!siap) return null;
  const berdenda = items.filter((t) => t.denda);
  const menunggu = berdenda.filter((t) => t.denda.konfirmasi === "menunggu").length;
  const belum = items.reduce((s, t) => s + dendaBelumBayar(t), 0);
  return (
    <div className="space-y-6">
      <JudulHalaman judul="Konfirmasi Denda" sub="Tinjau denda keterlambatan (otomatis) dan kerusakan (usulan petugas), lalu catat pelunasannya." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[[Gavel, "Transaksi berdenda", `${berdenda.length} transaksi`], [Hourglass, "Menunggu konfirmasi", `${menunggu} usulan`], [Banknote, "Denda belum dibayar", rupiah(belum)]].map(([Ik, l, v]) => (
          <Kartu key={l} className="flex items-center gap-4 p-5"><span className="flex size-12 items-center justify-center rounded-xl bg-navy text-sun"><Ik size={22} /></span><span><span className="block text-xs text-slate-500">{l}</span><span className="block text-xl font-extrabold text-navy">{v}</span></span></Kartu>
        ))}
      </div>
      <Kartu className="p-6">
        {berdenda.length === 0 ? <p className="rounded-xl bg-soft p-8 text-center text-sm text-slate-500">Belum ada transaksi yang dikenai denda.</p> : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">No. Transaksi</th><th className="px-3 py-3">Penyewa / Aset</th><th className="px-3 py-3">Keterlambatan</th><th className="px-3 py-3">Kerusakan</th><th className="px-3 py-3">Total Denda</th><th className="rounded-r-lg px-3 py-3">Tindakan</th></tr></thead>
              <tbody className="divide-y divide-pale/80">{berdenda.map((t) => <Baris key={t.kode + t.denda.konfirmasi + t.denda.statusBayar} t={t} />)}</tbody>
            </table>
          </div>
        )}
      </Kartu>
    </div>
  );
}
