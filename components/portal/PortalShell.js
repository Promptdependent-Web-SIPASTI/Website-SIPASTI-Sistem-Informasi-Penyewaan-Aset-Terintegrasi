"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, SquarePlus, ReceiptText, Wallet, History, UserRound, LogOut, Menu, X, LoaderCircle } from "lucide-react";
import { Brand, LogoBadge } from "@/components/Brand";
import { keluar } from "@/lib/auth";
import { useKlienSiap, useSesi } from "@/lib/useClient";
import { useOtomatisBatal } from "@/lib/transaksi";

const BASE = "/dashboard/penyewa";
const MENU = [
  { href: BASE, label: "Dashboard", icon: LayoutGrid, exact: true, judul: "Dashboard Penyewa" },
  { href: `${BASE}/ajukan`, label: "Ajukan Sewa", icon: SquarePlus, judul: "Ajukan Sewa" },
  { href: `${BASE}/transaksi`, label: "Transaksi Saya", icon: ReceiptText, judul: "Transaksi Saya" },
  { href: `${BASE}/pembayaran`, label: "Pembayaran", icon: Wallet, judul: "Pembayaran" },
  { href: `${BASE}/riwayat`, label: "Riwayat Penyewaan", icon: History, judul: "Riwayat Penyewaan" },
  { href: `${BASE}/profil`, label: "Profil", icon: UserRound, judul: "Profil Saya" },
];
const TIPE = { mahasiswa: "Mahasiswa", dosen: "Dosen", staf: "Staf" };

const aktif = (m, p) => (m.exact ? p === m.href : p === m.href || p.startsWith(m.href + "/"));
const inisial = (n = "") => n.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

function Sidebar({ sesi, pathname, onNavigate, onKeluar }) {
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="border-b border-white/10 p-5">
        <Brand size={42} tagline={false} />
        <p className="mt-2 text-[11px] leading-tight text-white/60">Sistem Informasi Penyewaan Aset Terintegrasi</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Menu penyewa">
        <p className="mb-3 px-3 text-[11px] font-bold tracking-widest text-white/50">MENU UTAMA</p>
        <ul className="space-y-1">
          {MENU.map((m) => {
            const on = aktif(m, pathname);
            const Icon = m.icon;
            return (
              <li key={m.href}>
                <Link href={m.href} onClick={onNavigate} aria-current={on ? "page" : undefined} className={`flex items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-sm font-semibold transition ${on ? "border-sun bg-white/10 text-sun" : "border-transparent text-white/85 hover:bg-white/5 hover:text-white"}`}>
                  <Icon size={18} /> {m.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold">{inisial(sesi.nama)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{sesi.nama}</p>
            <p className="text-xs text-white/60">{TIPE[sesi.tipe] ?? "Penyewa"}</p>
          </div>
        </div>
        <button type="button" onClick={onKeluar} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
          <LogOut size={17} /> Keluar
        </button>
      </div>
    </div>
  );
}

export default function PortalShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const siap = useKlienSiap();
  const sesi = useSesi();
  const [drawer, setDrawer] = useState(false);
  useOtomatisBatal(sesi?.email);

  useEffect(() => {
    if (!siap) return;
    if (!sesi) router.replace(`/masuk?next=${encodeURIComponent(pathname)}`);
    else if (sesi.peran !== "penyewa") router.replace(`/dashboard/${sesi.peran}`);
  }, [siap, sesi, pathname, router]);

  if (!siap || !sesi || sesi.peran !== "penyewa") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft text-navy">
        <div className="flex items-center gap-3 text-sm font-semibold"><LoaderCircle className="animate-spin text-sky" /> Memuat portal penyewa…</div>
      </div>
    );
  }

  const onKeluar = () => {
    keluar();
    router.push("/masuk");
  };
  const judul = (MENU.filter((m) => aktif(m, pathname)).sort((a, b) => b.href.length - a.href.length)[0] ?? MENU[0]).judul;

  return (
    <div className="min-h-screen bg-soft lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen lg:block"><Sidebar sesi={sesi} pathname={pathname} onKeluar={onKeluar} /></aside>

      <AnimatePresence>
        {drawer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-navy/60 lg:hidden" onClick={() => setDrawer(false)}>
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="h-full w-72">
              <Sidebar sesi={sesi} pathname={pathname} onNavigate={() => setDrawer(false)} onKeluar={onKeluar} />
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
          <Link href={`${BASE}/profil`} className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-bold leading-tight text-navy">{sesi.nama}</span>
              <span className="block text-xs text-sky">Penyewa Aktif</span>
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
