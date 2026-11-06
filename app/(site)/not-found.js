import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-pale text-sky"><SearchX size={38} /></span>
      <h1 className="mt-6 text-3xl font-extrabold text-navy">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-ink">Aset atau halaman yang Anda cari tidak tersedia atau sudah dipindahkan.</p>
      <Link href="/aset" className="mt-7 rounded-xl bg-sun px-7 py-3 font-bold text-navy shadow-md transition hover:-translate-y-0.5">Kembali ke Katalog</Link>
    </div>
  );
}
