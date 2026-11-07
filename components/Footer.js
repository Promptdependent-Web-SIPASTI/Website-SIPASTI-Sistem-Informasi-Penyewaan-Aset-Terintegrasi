import Link from "next/link";
import { MapPin } from "lucide-react";
import { LogoBadge } from "./Brand";

export default function Footer() {
  return (
    <footer className="border-t border-sun bg-navy text-slate-300">
      <div className="mx-auto max-w-7xl px-5 pb-12 pt-16 md:px-10">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3.5">
              <LogoBadge />
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-white">SIPASTI</p>
                <p className="text-xs text-sky-200">Sistem Informasi Penyewaan Aset Terintegrasi</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-white/90">
              Fakultas Matematika dan Ilmu Pengetahuan Alam, Universitas Negeri Semarang
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs">
              <MapPin size={16} className="mt-0.5 shrink-0 text-sun" /> Kampus Sekaran, Gunungpati, Semarang 50229
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm font-bold tracking-wide text-sun">Navigasi utama</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link href="/" className="hover:text-white">Beranda</Link></li>
              <li><Link href="/aset" className="hover:text-white">Aset</Link></li>
              <li><Link href="/#cara-sewa" className="hover:text-white">Cara Sewa</Link></li>
              <li><Link href="/#faq" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="text-sm font-bold tracking-wide text-sun">Portal layanan</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link href="/masuk" className="hover:text-white">Masuk ke Akun</Link></li>
              <li><Link href="/daftar" className="hover:text-white">Daftar Akun Baru</Link></li>
              <li className="text-xs text-slate-400">Jam Layanan: Senin–Sabtu 07.00–18.00 WIB</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-8 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>© 2026 FMIPA Universitas Negeri Semarang.</p>
        </div>
      </div>
    </footer>
  );
}
