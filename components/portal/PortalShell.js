"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X, LoaderCircle, UserRound } from "lucide-react";
import { Brand, LogoBadge } from "@/components/Brand";
import { keluar } from "@/lib/auth";
import { useKlienSiap, useSesi } from "@/lib/useClient";
import { useOtomatisBatal, useSemuaTransaksi } from "@/lib/transaksi";
import { MENUS } from "./menus";

const TIPE = { mahasiswa: "Mahasiswa", dosen: "Dosen", staf: "Staf" };
const aktif = (m, p) => (m.exact ? p === m.href : p === m.href || p.startsWith(m.href + "/"));
const inisial = (n = "") => n.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

function Sidebar({ cfg, sesi, pathname, badge, onNavigate, onKeluar }) {
  const peran = sesi.peran;
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="border-b border-white/10 p-5">
        <Brand size={42} tagline={false} />
        <p className="mt-2 text-[11px] leading-tight text-white/60">{peran === "admin" ? "FMIPA UNNES Terintegrasi" : "Sistem Informasi Penyewaan Aset Terintegrasi"}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label={`Menu ${peran}`}>
        {cfg.kepala && <p className="mb-3 px-3 text-[11px] font-bold tracking-widest text-white/50">{cfg.kepala}</p>}
        {cfg.grup.map((g, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>
            {g.judul && <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-white/50">{g.judul}</p>}
            <ul className="space-y-1">
              {g.items.map((m) => {
                const on = aktif(m, pathname);
                const Icon = m.icon;
                const n = m.badge ? badge[m.badge] : 0;
                return (
                  <li key={m.href}>
                    <Link href={m.href} onClick={onNavigate} aria-current={on ? "page" : undefined} className={`flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-semibold transition ${on ? "border-sun bg-white/10 text-sun" : "border-transparent text-white/85 hover:bg-white/5 hover:text-white"}`}>
                      <Icon size={18} className="shrink-0" /> <span className="flex-1 leading-tight">{m.label}</span>
                      {n > 0 && <span className="text-xs font-extrabold text-sun" aria-label={`${n} menunggu`}>{n}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold">{inisial(sesi.nama)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{sesi.nama}</p>
            <p className="text-xs text-white/60">{peran === "penyewa" ? TIPE[sesi.tipe] ?? "Penyewa" : peran === "admin" ? "Admin" : "Petugas"}</p>
          </div>
        </div>
        <button type="button" onClick={onKeluar} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
          <LogOut size={17} /> Keluar
        </button>
      </div>
    </div>
  );
}

export default function PortalShell({ peran, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const siap = useKlienSiap();
  const sesi = useSesi();
  const [drawer, setDrawer] = useState(false);
  const cfg = MENUS[peran];
  useOtomatisBatal();
  const { items } = useSemuaTransaksi();
  const badge = useMemo(
    () => ({ persetujuan: items.filter((t) => t.status === "diajukan").length, verifikasi: items.filter((t) => t.pembayaran === "menunggu_verifikasi").length }),
    [items]
  );

  useEffect(() => {
    if (!siap) return;
    if (!sesi) {
      let sengaja = false;
      try { sengaja = sessionStorage.getItem("sipasti_keluar") === "1"; sessionStorage.removeItem("sipasti_keluar"); } catch {}
      router.replace(sengaja ? "/masuk" : `/masuk?next=${encodeURIComponent(pathname)}`);
    }
    else if (sesi.peran !== peran) router.replace(`/dashboard/${sesi.peran}`);
  }, [siap, sesi, pathname, router, peran]);

  if (!siap || !sesi || sesi.peran !== peran) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft text-navy">
        <div className="flex items-center gap-3 text-sm font-semibold"><LoaderCircle className="animate-spin text-sky" /> Memuat {cfg.judul.toLowerCase()}…</div>
      </div>
    );
  }

  const onKeluar = () => { keluar(); router.push("/masuk"); };
  const semua = cfg.grup.flatMap((g) => g.items);
  const judul = (semua.filter((m) => aktif(m, pathname)).sort((a, b) => b.href.length - a.href.length)[0] ?? semua[0]).judul;

  return (
    <div className="min-h-screen bg-soft lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen lg:block"><Sidebar cfg={cfg} sesi={sesi} pathname={pathname} badge={badge} onKeluar={onKeluar} /></aside>

      <AnimatePresence>
        {drawer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-navy/60 lg:hidden" onClick={() => setDrawer(false)}>
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="h-full w-72">
              <Sidebar cfg={cfg} sesi={sesi} pathname={pathname} badge={badge} onNavigate={() => setDrawer(false)} onKeluar={onKeluar} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-pale bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDrawer(true)} aria-label="Buka menu" className="flex size-10 items-center justify-center rounded-xl text-navy hover:bg-soft lg:hidden"><Menu size={22} /></button>
            <span className="hidden lg:block"><LogoBadge size={34} className="!p-0 shadow-none" /></span>
            <p className="text-base font-bold text-navy md:text-lg">{judul}</p>
          </div>
          <Link href={peran === "penyewa" ? `${cfg.base}/profil` : cfg.base} className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-bold leading-tight text-navy">{sesi.nama}</span>
              <span className="block text-xs text-sky">{cfg.peranLabel}</span>
            </span>
            <span className="flex size-9 items-center justify-center rounded-full bg-sky text-white"><UserRound size={18} /></span>
          </Link>
        </header>
        <main className="flex-1 px-4 pb-14 pt-8 md:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
        <footer className="flex flex-col justify-between gap-1 border-t border-pale bg-white px-4 py-4 text-xs text-slate-500 sm:flex-row md:px-8">
          <span>© 2026 SIPASTI FMIPA UNNES. Proyek Akhir Web (UAS).</span>
          <span className="font-medium text-sky">Layanan Aset &amp; Fasilitas Terpadu FMIPA UNNES</span>
        </footer>
      </div>
    </div>
  );
}
