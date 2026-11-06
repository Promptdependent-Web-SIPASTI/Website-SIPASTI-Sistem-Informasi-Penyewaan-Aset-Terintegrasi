import Link from "next/link";
import { ArrowRight, Building2, Wrench, Search, FileUp, ShieldCheck, Wallet, PackageCheck } from "lucide-react";
import Hero from "@/components/Hero";
import AsetCard from "@/components/AsetCard";
import FaqAccordion from "@/components/FaqAccordion";
import { Reveal } from "@/components/motion";
import { ASET, KATEGORI, FAQ, LANGKAH, getAset } from "@/lib/data";

const IKON = { Search, FileUp, ShieldCheck, Wallet, PackageCheck };
const UNGGULAN = ["aula-d12", "laboratorium-ilmu-komputer", "proyektor-dan-layar-proyektor"].map(getAset);
const jumlah = (k) => ASET.filter((a) => a.kategori === k).length;

function SectionTitle({ judul, sub, center = false, light = false }) {
  return (
    <div className={`flex flex-col gap-2 ${center ? "items-center text-center" : ""}`}>
      <h2 className={`text-3xl font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}>{judul}</h2>
      <span className="h-1 w-14 rounded-full bg-sun" />
      <p className={`text-base ${light ? "text-slate-300" : "text-ink"}`}>{sub}</p>
    </div>
  );
}

export default function Beranda() {
  const tanda = [...ASET.map((a) => a.nama), "Senin–Sabtu 07.00–18.00 WIB"];
  return (
    <>
      <Hero />

      {/* pita nama aset bergerak */}
      <div className="overflow-hidden border-b border-pale bg-white py-3" aria-hidden>
        <div className="flex w-max motion-safe:animate-marquee">
          {[0, 1].map((r) => (
            <div key={r} className="flex shrink-0 items-center">
              {tanda.map((t) => (
                <span key={t + r} className="mx-6 flex items-center gap-6 text-sm font-semibold text-navy/70">
                  {t} <span className="size-1.5 rounded-full bg-sun" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="aset-unggulan" className="bg-soft py-14">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <SectionTitle judul="Aset Unggulan" sub="Beberapa aset yang siap disewa saat ini" />
            <Link href="/aset" className="inline-flex w-fit items-center gap-2 rounded-full bg-pale px-5 py-2.5 text-sm font-bold text-sky transition hover:bg-sky hover:text-white">
              Lihat Semua Aset <ArrowRight size={16} />
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {UNGGULAN.map((a, i) => (
              <Reveal key={a.slug} delay={i * 0.1}>
                <AsetCard aset={a} variant="unggulan" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="kategori" className="bg-soft pb-16">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <Reveal><SectionTitle judul="Kategori Aset" sub="Pilih jenis aset yang Anda butuhkan" /></Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {[
              { k: KATEGORI.ruangan, ikon: Building2 },
              { k: KATEGORI.peralatan, ikon: Wrench },
            ].map(({ k, ikon: Icon }, i) => (
              <Reveal key={k.id} delay={i * 0.1}>
                <Link
                  href={`/aset?kategori=${k.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-l-4 border-sun bg-white p-8 shadow-card transition hover:-translate-y-1 hover:shadow-pop"
                >
                  <span className="flex items-start gap-6">
                    <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#fff3c4] text-[#b78a00] transition group-hover:rotate-6 group-hover:scale-105">
                      <Icon size={30} />
                    </span>
                    <span>
                      <span className="block text-xl font-bold text-navy">{k.nama}</span>
                      <span className="mt-1.5 block text-sm text-ink">{k.deskripsi}</span>
                      <span className="mt-2 block text-sm font-semibold text-mute">{jumlah(k.id)} aset terdaftar</span>
                    </span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-navy transition group-hover:bg-sun">
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-sewa" className="border-y border-slate-800 bg-navy py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <Reveal><SectionTitle center light judul="Cara Menyewa" sub="Alur pengajuan sewa fasilitas dan peralatan di FMIPA UNNES yang mudah dan terstruktur" /></Reveal>
          <div className="relative mt-12">
            <div className="absolute inset-x-12 top-[44px] hidden border-t-2 border-dashed border-sun/60 lg:block" aria-hidden />
            <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {LANGKAH.map((l, i) => {
                const Icon = IKON[l.ikon];
                return (
                  <Reveal as="li" key={l.judul} delay={i * 0.1} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition hover:-translate-y-1.5 hover:bg-white/15">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-full bg-sun text-sm font-extrabold text-navy shadow-md">{i + 1}</span>
                      <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white"><Icon size={20} /></span>
                    </div>
                    <h3 className="mt-5 text-base font-bold leading-snug text-white">{l.judul}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{l.isi}</p>
                  </Reveal>
                );
              })}
            </ol>
          </div>
          <Reveal className="mt-12 flex justify-center">
            <Link href="/aset" className="rounded-xl bg-sun px-9 py-3.5 text-base font-bold text-navy shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              Mulai Ajukan Sewa
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="faq" className="bg-soft py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <Reveal><SectionTitle judul="Pertanyaan yang Sering Diajukan" sub="Temukan jawaban seputar pengajuan, pembayaran, dan pengembalian aset." /></Reveal>
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <div className="relative flex min-h-[460px] flex-col justify-end overflow-hidden rounded-3xl p-8 shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/gedung-fmipa.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/0" />
                <div className="relative">
                  <h3 className="text-2xl font-bold text-white">Butuh bantuan lebih lanjut?</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-200">Tim kami siap membantu Anda untuk pertanyaan, pengajuan sewa, dan informasi lainnya.</p>
                  <a href="mailto:sipasti@fmipa.unnes.ac.id" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sun px-6 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">
                    Hubungi Kami <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={0.1}>
              <FaqAccordion items={FAQ} />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
