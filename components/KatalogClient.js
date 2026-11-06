"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Funnel, Search, CalendarDays, SlidersHorizontal, ChevronLeft, ChevronRight, PackageSearch, Users, X } from "lucide-react";
import AsetCard from "@/components/AsetCard";
import { ASET, SUBKATEGORI } from "@/lib/data";
import { fromISO, minTanggalSewa } from "@/lib/waktu";

const PER_HALAMAN = 9;
const AWAL = { q: "", kategori: "semua", sub: [], kapasitas: "", tanggal: "" };

const SORT = {
  sesuai: { label: "Paling Sesuai", fn: () => 0 },
  termurah: { label: "Tarif Terendah", fn: (a, b) => a.tarif - b.tarif },
  termahal: { label: "Tarif Tertinggi", fn: (a, b) => b.tarif - a.tarif },
  nama: { label: "Nama A–Z", fn: (a, b) => a.nama.localeCompare(b.nama, "id") },
};

function hitungAktif(f) {
  return (f.q.trim() ? 1 : 0) + (f.kategori !== "semua" ? 1 : 0) + (f.sub.length ? 1 : 0) + (f.kapasitas ? 1 : 0) + (f.tanggal ? 1 : 0);
}

export default function KatalogClient({ awal }) {
  const mulai = { ...AWAL, ...awal };
  const [draft, setDraft] = useState(mulai);
  const [terapan, setTerapan] = useState(mulai);
  const [urut, setUrut] = useState("sesuai");
  const [halaman, setHalaman] = useState(1);
  const [panel, setPanel] = useState(false);

  const hasil = useMemo(() => {
    const q = terapan.q.trim().toLowerCase();
    const kap = Number(terapan.kapasitas) || 0;
    let list = ASET.filter((a) => {
      if (q && !(`${a.nama} ${a.kode} ${a.subkategori}`.toLowerCase().includes(q))) return false;
      if (terapan.kategori !== "semua" && a.kategori !== terapan.kategori) return false;
      if (terapan.sub.length && !terapan.sub.includes(a.subkategori)) return false;
      if (kap && (a.kategori === "ruangan" ? a.kapasitas : a.stok) < kap) return false;
      if (terapan.tanggal && a.status === "Tidak tersedia") return false;
      return true;
    });
    return [...list].sort(SORT[urut].fn);
  }, [terapan, urut]);

  const jumlahHal = Math.max(1, Math.ceil(hasil.length / PER_HALAMAN));
  const hal = Math.min(halaman, jumlahHal);
  const tampil = hasil.slice((hal - 1) * PER_HALAMAN, hal * PER_HALAMAN);

  const subTersedia = SUBKATEGORI.filter((s) => draft.kategori === "semua" || ASET.some((a) => a.subkategori === s && a.kategori === draft.kategori));
  const tglProblem = (() => {
    if (!draft.tanggal) return "";
    const d = fromISO(draft.tanggal);
    if (d.getDay() === 0) return "Layanan hanya Senin–Sabtu.";
    if (d < minTanggalSewa()) return "Pengajuan paling lambat H-2 sebelum pemakaian.";
    return "";
  })();

  const terapkan = (e) => {
    e?.preventDefault();
    setTerapan(draft);
    setHalaman(1);
    setPanel(false);
  };
  const reset = () => {
    setDraft(AWAL);
    setTerapan(AWAL);
    setHalaman(1);
  };
  const toggleSub = (s) => setDraft((d) => ({ ...d, sub: d.sub.includes(s) ? d.sub.filter((x) => x !== s) : [...d.sub, s] }));

  const aktif = hitungAktif(terapan);

  const filterForm = (
    <form onSubmit={terapkan} className="space-y-5 text-sm">
      <div>
        <label htmlFor="f-q" className="mb-2 block font-bold text-navy">Cari Aset</label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="f-q" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Cari nama aset..." className="w-full rounded-lg bg-pale py-2.5 pl-10 pr-3 outline-none ring-sky/40 placeholder:text-slate-500 focus:ring-2" />
        </div>
      </div>
      <fieldset className="border-t border-pale pt-5">
        <legend className="mb-2 font-bold text-navy">Kategori</legend>
        {[["semua", "Semua Kategori"], ["ruangan", "Fasilitas dan Ruangan"], ["peralatan", "Peralatan dan Perlengkapan"]].map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 py-1.5">
            <input type="radio" name="kategori" checked={draft.kategori === v} onChange={() => setDraft({ ...draft, kategori: v, sub: [] })} className="size-4 accent-sky" /> {l}
          </label>
        ))}
      </fieldset>
      <fieldset className="border-t border-pale pt-5">
        <legend className="mb-2 font-bold text-navy">Subkategori</legend>
        {subTersedia.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-2.5 py-1.5">
            <input type="checkbox" checked={draft.sub.includes(s)} onChange={() => toggleSub(s)} className="size-4 rounded accent-sky" /> {s}
          </label>
        ))}
      </fieldset>
      <div className="border-t border-pale pt-5">
        <label htmlFor="f-kap" className="mb-2 block font-bold text-navy">Kapasitas Minimal</label>
        <div className="relative">
          <Users size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input id="f-kap" type="number" min="0" value={draft.kapasitas} onChange={(e) => setDraft({ ...draft, kapasitas: e.target.value })} placeholder="mis. 30 orang" className="w-full rounded-lg bg-pale py-2.5 pl-10 pr-3 outline-none ring-sky/40 placeholder:text-slate-500 focus:ring-2" />
        </div>
      </div>
      <div className="border-t border-pale pt-5">
        <label htmlFor="f-tgl" className="mb-2 block font-bold text-navy">Tanggal Pemakaian</label>
        <div className="relative">
          <CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input id="f-tgl" type="date" value={draft.tanggal} onChange={(e) => setDraft({ ...draft, tanggal: e.target.value })} className="w-full rounded-lg bg-pale py-2.5 pl-10 pr-3 outline-none ring-sky/40 focus:ring-2" />
        </div>
        {tglProblem && <p className="mt-1.5 text-xs text-red-600">{tglProblem}</p>}
      </div>
      <div className="border-t border-pale pt-5">
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-sun py-3 font-bold text-navy shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
          <SlidersHorizontal size={16} /> Terapkan Filter
        </button>
        <button type="button" onClick={reset} className="mt-3 w-full text-center font-semibold text-sky hover:underline">Atur Ulang</button>
      </div>
    </form>
  );

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[272px_1fr]">
      {/* tombol filter untuk layar kecil */}
      <button type="button" onClick={() => setPanel(true)} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-navy shadow-card lg:hidden">
        <Funnel size={16} className="text-sky" /> Filter Pencarian {aktif > 0 && <span className="rounded-full bg-sun px-2 text-xs">{aktif}</span>}
      </button>

      <aside className="hidden self-start rounded-2xl bg-white p-6 shadow-card lg:sticky lg:top-28 lg:block">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-navy"><Funnel size={16} className="text-sky" /> Filter Pencarian</h2>
          {aktif > 0 && <span className="text-xs font-semibold text-sky">Aktif ({aktif})</span>}
        </div>
        {filterForm}
      </aside>

      <AnimatePresence>
        {panel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-navy/50 lg:hidden" onClick={() => setPanel(false)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-navy"><Funnel size={16} className="text-sky" /> Filter Pencarian</h2>
                <button type="button" onClick={() => setPanel(false)} aria-label="Tutup filter" className="flex size-9 items-center justify-center rounded-full bg-soft"><X size={18} /></button>
              </div>
              {filterForm}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <div className="flex flex-col justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-sm shadow-card sm:flex-row sm:items-center">
          <p className="text-ink">
            Menampilkan <b className="text-sky">{tampil.length}</b> dari <b>{hasil.length}</b> aset terdaftar
          </p>
          <label className="flex items-center gap-3 text-slate-500">
            Urutkan:
            <select value={urut} onChange={(e) => { setUrut(e.target.value); setHalaman(1); }} className="rounded-lg bg-pale px-4 py-1.5 font-medium text-navy outline-none">
              {Object.entries(SORT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
        </div>

        {tampil.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl bg-white px-6 py-20 text-center shadow-card">
            <span className="flex size-20 items-center justify-center rounded-full bg-pale text-sky"><PackageSearch size={38} /></span>
            <h3 className="mt-6 text-xl font-bold text-navy">Aset tidak ditemukan</h3>
            <p className="mt-2 max-w-md text-sm text-ink">Tidak ada aset yang cocok dengan filter yang Anda pilih. Coba ubah kata kunci, kategori, atau tanggal pemakaian.</p>
            <button type="button" onClick={reset} className="mt-6 rounded-xl bg-sun px-7 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Atur Ulang Filter</button>
          </div>
        ) : (
          <motion.div layout className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {tampil.map((a) => (
                <motion.div key={a.slug} layout className="h-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35 }}>
                  <AsetCard aset={a} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {jumlahHal > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="Halaman">
            <button type="button" disabled={hal === 1} onClick={() => setHalaman(hal - 1)} className="flex items-center gap-1 rounded-lg bg-white px-3.5 py-2 font-medium shadow-sm transition enabled:hover:bg-pale disabled:opacity-50">
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            {Array.from({ length: jumlahHal }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" onClick={() => setHalaman(n)} aria-current={n === hal ? "page" : undefined} className={`size-9 rounded-lg font-bold shadow-sm transition ${n === hal ? "bg-sun text-navy" : "bg-white hover:bg-pale"}`}>
                {n}
              </button>
            ))}
            <button type="button" disabled={hal === jumlahHal} onClick={() => setHalaman(hal + 1)} className="flex items-center gap-1 rounded-lg bg-white px-3.5 py-2 font-medium shadow-sm transition enabled:hover:bg-pale disabled:opacity-50">
              Selanjutnya <ChevronRight size={14} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
