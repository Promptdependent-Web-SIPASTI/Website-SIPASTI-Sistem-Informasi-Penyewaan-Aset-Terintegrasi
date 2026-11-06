"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Workflow, CircleHelp, Menu, X, UserRound, LayoutDashboard } from "lucide-react";
import { Brand } from "./Brand";
import { useSesi } from "@/lib/useClient";

const LINKS = [
  { href: "/aset", label: "Aset", icon: Boxes, match: (p) => p.startsWith("/aset") },
  { href: "/#cara-sewa", label: "Cara Sewa", icon: Workflow, match: () => false },
  { href: "/#faq", label: "FAQ", icon: CircleHelp, match: () => false },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useSesi();

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-sun bg-navy shadow-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
        <Brand />
        <nav className="hidden items-center gap-9 md:flex" aria-label="Navigasi utama">
          {LINKS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 border-b-2 pb-1.5 text-sm font-semibold transition-colors ${
                  active ? "border-sun text-white" : "border-transparent text-white/85 hover:text-white"
                }`}
              >
                <Icon size={16} className={active ? "text-sun" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-6 md:flex">
          {user ? (
            <>
              <Link href={`/dashboard/${user.peran}`} className="flex items-center gap-2 text-sm font-semibold text-white hover:text-sun">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <span className="flex size-9 items-center justify-center rounded-full bg-sky text-white" title={user.nama}>
                <UserRound size={18} />
              </span>
            </>
          ) : (
            <>
              <Link href="/masuk" className="text-sm font-semibold text-white hover:text-sun">Masuk</Link>
              <Link href="/daftar" className="rounded-full bg-sun px-6 py-2.5 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                Daftar
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-xl text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-white hover:bg-white/10">
                  <Icon size={18} className="text-sun" /> {label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3">
                {user ? (
                  <Link href={`/dashboard/${user.peran}`} className="flex-1 rounded-xl bg-sun py-3 text-center font-bold text-navy">Dashboard</Link>
                ) : (
                  <>
                    <Link href="/masuk" className="flex-1 rounded-xl border border-white/30 py-3 text-center font-semibold text-white">Masuk</Link>
                    <Link href="/daftar" className="flex-1 rounded-xl bg-sun py-3 text-center font-bold text-navy">Daftar</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
