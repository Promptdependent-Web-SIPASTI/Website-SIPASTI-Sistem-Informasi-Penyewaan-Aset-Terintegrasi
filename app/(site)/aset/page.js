import Link from "next/link";
import KatalogClient from "@/components/KatalogClient";
import { Reveal } from "@/components/motion";

export const metadata = { title: "Katalog Aset" };

export default async function KatalogPage({ searchParams }) {
  const sp = await searchParams;
  const awal = {
    q: typeof sp?.q === "string" ? sp.q : "",
    kategori: ["ruangan", "peralatan"].includes(sp?.kategori) ? sp.kategori : "semua",
    tanggal: typeof sp?.tanggal === "string" ? sp.tanggal : "",
  };
  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-10">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/" className="hover:text-sky">Beranda</Link> <span className="mx-2">/</span> <b className="text-navy">Aset</b>
      </nav>
      <Reveal>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-navy md:text-5xl">Katalog Aset</h1>
        <span className="mt-3 block h-1 w-14 rounded-full bg-sun" />
        <p className="mt-4 text-ink">Pilih fasilitas dan peralatan yang Anda butuhkan untuk kegiatan akademik, seminar, atau penelitian</p>
      </Reveal>
      <KatalogClient key={JSON.stringify(awal)} awal={awal} />
    </div>
  );
}
