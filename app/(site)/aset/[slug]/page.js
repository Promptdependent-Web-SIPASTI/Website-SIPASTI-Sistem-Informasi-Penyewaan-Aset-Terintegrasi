import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import DetailClient from "@/components/DetailClient";
import { ASET, getAset } from "@/lib/data";

export function generateStaticParams() {
  return ASET.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = getAset(slug);
  return { title: a ? a.nama2 ?? a.nama : "Aset tidak ditemukan" };
}

export default async function DetailAsetPage({ params }) {
  const { slug } = await params;
  const aset = getAset(slug);
  if (!aset) notFound();
  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky">Beranda</Link> <ChevronRight size={13} />
        <Link href="/aset" className="hover:text-sky">Aset</Link> <ChevronRight size={13} />
        <b className="text-navy">{aset.nama2 ?? aset.nama}</b>
      </nav>
      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy md:text-4xl">{aset.nama2 ?? aset.nama}</h1>
          <span className="mt-3 block h-1 w-14 rounded-full bg-sun" />
          <p className="mt-4 text-sm text-ink">{aset.ringkas}</p>
        </div>
        <p className="text-sm font-bold text-sky">Kode Aset: {aset.kode}</p>
      </div>
      <DetailClient aset={aset} />
    </div>
  );
}
