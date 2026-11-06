"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Search, CalendarRange, CalendarCheck2, Zap, ShieldCheck, Boxes, CircleCheck, Package } from "lucide-react";

const FITUR = [
  { ikon: Zap, judul: "Mudah & Cepat", teks: "Cari dan ajukan sewa online" },
  { ikon: ShieldCheck, judul: "Aman & Tertib", teks: "Sistem resmi FMIPA" },
  { ikon: Boxes, judul: "Fasilitas & Peralatan", teks: "Siap untuk kegiatan kampus" },
];

const KATA = ["Mudahnya", "Sewa", "Fasilitas", "&", "Peralatan"];

export default function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [err, setErr] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (q.trim() && q.trim().length < 3) {
      setErr("Ketik minimal 3 karakter");
      return;
    }
    setErr("");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (mulai) params.set("tanggal", mulai);
    router.push(`/aset${params.toString() ? `?${params}` : ""}`);
  }

  const fade = (i) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <section className="relative isolate overflow-hidden border-b border-pale">
      {/* foto gedung bergerak perlahan */}
      <div className="absolute inset-0 -z-30 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/gedung-fmipa.jpg" alt="" className="h-full w-full origin-center object-cover motion-safe:animate-kenburns" />
      </div>
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-white/95 via-white/90 to-white/80 lg:via-white/80 lg:to-white/10" />
      {/* gelembung warna bergerak */}
      <motion.div
        aria-hidden
        className="absolute -left-24 top-10 -z-10 size-72 rounded-full bg-sky/20 blur-3xl"
        animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-0 right-1/3 -z-10 size-64 rounded-full bg-sun/25 blur-3xl"
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 md:px-10 lg:grid-cols-12 lg:pt-16">
        <div className="lg:col-span-7">
          <motion.p {...fade(0)} className="mb-5 inline-flex items-center gap-2 rounded-full border border-pale bg-white/80 px-4 py-1.5 text-xs font-bold tracking-wide text-sky backdrop-blur">
            <span className="size-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" /> Layanan penyewaan aset FMIPA UNNES
          </motion.p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-[44px] lg:leading-[48px]">
            {KATA.map((k, i) => (
              <motion.span key={k + i} {...fade(i + 1)} className="mr-3 inline-block">
                {k}
              </motion.span>
            ))}
            <motion.span {...fade(6)} className="relative inline-block text-sky">
              FMIPA UNNES
              <motion.span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-1 origin-left rounded-full bg-sun"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
              />
            </motion.span>
          </h1>
          <motion.p {...fade(7)} className="mt-6 max-w-xl text-lg leading-7 text-ink">
            Temukan dan ajukan sewa ruang, laboratorium, dan peralatan kampus — proses jelas, tertib, dan transparan.
          </motion.p>

          <motion.ul {...fade(8)} className="mt-8 grid gap-5 border-t border-pale/80 pt-6 sm:grid-cols-3">
            {FITUR.map(({ ikon: Icon, judul, teks }) => (
              <li key={judul}>
                <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-navy text-sun shadow-sm transition hover:-translate-y-1">
                  <Icon size={22} />
                </span>
                <p className="font-bold text-navy">{judul}</p>
                <p className="mt-1 text-xs text-mute">{teks}</p>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div {...fade(5)} className="relative lg:col-span-5">
          {/* chip melayang */}
          <div className="pointer-events-none absolute -left-10 -top-6 z-10 hidden xl:block motion-safe:animate-float">
            <div className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-navy shadow-pop">
              <span className="relative flex size-2.5"><span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" /><span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" /></span>
              Aula D12 · Tersedia
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-4 z-10 hidden xl:block motion-safe:animate-float-slow">
            <div className="flex items-center gap-2 rounded-xl bg-navy px-3.5 py-2 text-xs font-bold text-white shadow-pop">
              <Package size={14} className="text-sun" /> Proyektor · 5 set siap
            </div>
          </div>

          <form onSubmit={onSubmit} className="relative overflow-hidden rounded-2xl border border-pale bg-white p-7 shadow-pop">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-sun" />
            <h2 className="text-2xl font-bold text-navy">Cek Ketersediaan</h2>
            <p className="mt-1 text-sm text-ink">Cari aset, pilih tanggal, lalu lihat jadwal yang tersedia.</p>

            <label className="mt-5 block text-sm font-bold text-navy" htmlFor="hero-q">Cari Aset</label>
            <div className="relative mt-1.5">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="hero-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="mis. Aula, Laboratorium, Proyektor…"
                className="w-full rounded-xl border border-pale bg-field py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky focus:bg-white"
              />
            </div>
            <p className={`mt-1.5 text-xs ${err ? "text-red-600" : "text-slate-400"}`}>{err || "Ketik minimal 3 karakter"}</p>

            <p className="mt-4 text-sm font-bold text-navy">Pilih Rentang Tanggal</p>
            <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
              <label className="relative block">
                <span className="sr-only">Tanggal mulai</span>
                <CalendarRange size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} className="w-full rounded-xl border border-pale bg-field py-3.5 pl-11 pr-2 text-sm outline-none focus:border-sky focus:bg-white" />
              </label>
              <label className="relative block">
                <span className="sr-only">Tanggal selesai</span>
                <input type="date" value={selesai} min={mulai || undefined} onChange={(e) => setSelesai(e.target.value)} className="w-full rounded-xl border border-pale bg-field px-3.5 py-3.5 text-sm outline-none focus:border-sky focus:bg-white" />
              </label>
            </div>

            <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sun py-3.5 text-base font-bold text-navy shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0">
              <CalendarCheck2 size={20} /> Cek Ketersediaan
            </button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><CircleCheck size={13} className="text-emerald-500" /> Pengajuan paling lambat H-2 sebelum pemakaian.</p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
