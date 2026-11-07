"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Wrench, TriangleAlert, CircleCheck, CircleAlert, Search } from "lucide-react";
import { Kartu, JudulHalaman } from "../ui";
import Modal from "../Modal";
import { useAsetList, ubahAset } from "@/lib/asetStore";

const OPSI = [["Baik", "Baik"], ["Rusak Ringan", "Rusak Ringan"], ["Rusak Berat", "Rusak Berat"], ["Dalam Pemeliharaan", "Dalam Pemeliharaan"]];

function FormKondisi({ a, tutup }) {
  const isP = a.kategori === "peralatan";
  const [k, setK] = useState(/rusak berat/i.test(a.kondisi) ? "Rusak Berat" : /pemeliharaan/i.test(a.kondisi) ? "Dalam Pemeliharaan" : /rusak/i.test(a.kondisi) ? "Rusak Ringan" : "Baik");
  const [n, setN] = useState(String(isP ? Math.max(1, a.stokTotal - a.stok) : 1));
  const [g, setG] = useState("");
  function simpan(e) {
    e.preventDefault();
    if (isP && k !== "Baik" && k !== "Dalam Pemeliharaan" && !(Number(n) >= 1 && Number(n) <= a.stokTotal)) return setG(`Jumlah unit harus 1–${a.stokTotal}.`);
    if (k === "Baik") ubahAset(a.slug, { kondisi: "Baik", status: "Tersedia", statusKet: undefined, ...(isP ? { stok: a.stokTotal } : {}) });
    else if (isP && k !== "Dalam Pemeliharaan") { const r = Number(n); ubahAset(a.slug, { stok: a.stokTotal - r, kondisi: `${r} unit ${k === "Rusak Berat" ? "rusak berat" : "rusak ringan"}, ${a.stokTotal - r} baik`, status: a.stokTotal - r > 0 ? "Tersedia" : "Tidak tersedia", statusKet: a.stokTotal - r > 0 ? undefined : "rusak" }); }
    else if (k === "Rusak Ringan") ubahAset(a.slug, { kondisi: "Rusak Ringan" });
    else ubahAset(a.slug, { kondisi: k === "Rusak Berat" ? "Rusak Berat" : "Dalam Pemeliharaan", status: "Tidak tersedia", statusKet: k === "Rusak Berat" ? "rusak berat" : "perawatan", ...(isP ? { stok: 0 } : {}) });
    tutup();
  }
  return (
    <Modal judul={`Catat Kondisi: ${a.nama}`} tutup={tutup} lebar="max-w-md">
      <form onSubmit={simpan} noValidate className="space-y-4">
        <div><label htmlFor="kd" className="mb-1.5 block text-sm font-bold text-navy">Kondisi</label><select id="kd" value={k} onChange={(e) => setK(e.target.value)} className="w-full rounded-xl bg-pale/60 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-sky/40">{OPSI.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        {isP && (k === "Rusak Ringan" || k === "Rusak Berat") && <div><label htmlFor="un" className="mb-1.5 block text-sm font-bold text-navy">Jumlah unit rusak (dari {a.stokTotal})</label><input id="un" inputMode="numeric" value={n} onChange={(e) => { setN(e.target.value.replace(/\D/g, "")); setG(""); }} className="w-full rounded-xl bg-pale/60 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky/40" />{g && <p role="alert" className="mt-1.5 flex gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5" /> {g}</p>}</div>}
        <p className="rounded-xl bg-soft p-3 text-xs leading-relaxed text-slate-600">{k === "Baik" ? "Aset kembali tersedia dan seluruh unit dihitung sebagai stok." : k === "Rusak Ringan" ? "Unit rusak ringan tidak dihitung sebagai stok tersedia." : "Aset tidak dapat disewa sampai diperbaiki dan kondisinya dicatat kembali sebagai Baik."}</p>
        <div className="flex gap-3"><button type="button" onClick={tutup} className="flex-1 rounded-xl border border-sky py-3 text-sm font-bold text-sky hover:bg-pale">Batal</button><button type="submit" className="flex-1 rounded-xl bg-sun py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Simpan</button></div>
      </form>
    </Modal>
  );
}

export default function Kondisi() {
  const aset = useAsetList();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const hasil = useMemo(() => aset.filter((a) => !q.trim() || `${a.nama} ${a.kode}`.toLowerCase().includes(q.trim().toLowerCase())), [aset, q]);
  const bermasalah = aset.filter((a) => a.status === "Tidak tersedia" || /rusak|pemeliharaan/i.test(a.kondisi)).length;
  const edit = modal ? aset.find((a) => a.slug === modal) : null;
  return (
    <div className="space-y-6">
      <JudulHalaman judul="Kondisi dan Kerusakan Aset" sub="Catat kondisi terbaru aset. Perubahan memengaruhi stok tersedia dan status aset." />
      <Kartu className="flex items-center gap-4 p-5"><span className="flex size-12 items-center justify-center rounded-xl bg-navy text-sun"><Wrench size={22} /></span><span><span className="block text-xs text-slate-500">Aset perlu perhatian</span><span className="block text-xl font-extrabold text-navy">{bermasalah} aset</span></span></Kartu>
      <Kartu className="p-5 md:p-6">
        <span className="relative block sm:max-w-sm"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Cari aset" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau kode aset…" className="w-full rounded-xl bg-pale py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky/40" /></span>
        <div className="relative mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">Kode</th><th className="px-3 py-3">Aset</th><th className="px-3 py-3">Stok Tersedia</th><th className="px-3 py-3">Kondisi</th><th className="px-3 py-3">Status</th><th className="rounded-r-lg px-3 py-3"><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody className="divide-y divide-pale/80">
              {hasil.map((a) => {
                const buruk = a.status === "Tidak tersedia" || /rusak|pemeliharaan/i.test(a.kondisi);
                return (
                  <tr key={a.slug}>
                    <td className="px-3 py-3.5 text-xs font-bold text-slate-500">{a.kode}</td>
                    <td className="px-3 py-3.5 font-bold text-navy">{a.nama}</td>
                    <td className="px-3 py-3.5 text-ink">{a.kategori === "peralatan" ? `${a.stok} dari ${a.stokTotal} ${a.stokSatuan ?? "unit"}` : "—"}</td>
                    <td className={`px-3 py-3.5 text-xs font-semibold ${buruk ? "text-red-600" : "text-sky"}`}><span className="inline-flex items-center gap-1.5">{buruk ? <TriangleAlert size={14} /> : <CircleCheck size={14} />} {a.kondisi}</span></td>
                    <td className="px-3 py-3.5"><span className={`rounded-full px-3 py-1 text-xs font-bold ${a.status === "Tidak tersedia" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{a.status === "Tidak tersedia" ? "Nonaktif" : "Tersedia"}</span></td>
                    <td className="px-3 py-3.5 text-right"><button type="button" onClick={() => setModal(a.slug)} aria-label={`Catat kondisi ${a.nama}`} className="rounded-lg border border-sky px-3 py-1.5 text-xs font-bold text-sky transition hover:bg-sky hover:text-white">Catat Kondisi</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Kartu>
      <AnimatePresence>{edit && <FormKondisi key={edit.slug} a={edit} tutup={() => setModal(null)} />}</AnimatePresence>
    </div>
  );
}
