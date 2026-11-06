import Link from "next/link";
import { Hammer } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default function DashboardSementara() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-pale text-sky"><Hammer size={36} /></span>
      <h1 className="mt-6 text-3xl font-extrabold text-navy">Dashboard sedang disiapkan</h1>
      <p className="mt-3 text-ink">Halaman dashboard Penyewa, Petugas, dan Admin dikerjakan pada tahap berikutnya. Untuk saat ini Anda dapat menjelajahi katalog dan detail aset.</p>
      <Link href="/aset" className="mt-7 rounded-xl bg-sun px-7 py-3 font-bold text-navy shadow-md transition hover:-translate-y-0.5">Lihat Katalog Aset</Link>
    </div>
  );
}
