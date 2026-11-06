import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Brand } from "./Brand";

export default function AuthShell({ children, poin = [], lebar = "max-w-md" }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/gedung-fmipa.jpg" alt="" className="absolute inset-0 h-full w-full scale-110 object-cover object-left motion-safe:animate-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-b from-sky/50 via-navy/55 to-navy" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <Brand />
          {poin.length > 0 && (
            <ul className="space-y-5">
              {poin.map((p) => (
                <li key={p.judul} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-sun backdrop-blur"><Check size={14} strokeWidth={3} /></span>
                  <div><p className="font-semibold text-white">{p.judul}</p><p className="mt-0.5 max-w-sm text-sm text-white/75">{p.teks}</p></div>
                </li>
              ))}
            </ul>
          )}
          <div>
            <span className="mb-5 block h-1 w-14 rounded-full bg-sun" />
            <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">Kelola penyewaan aset kampus secara tertib dan transparan.</h2>
            <p className="mt-4 max-w-md text-sm text-white/80">Fakultas Matematika dan Ilmu Pengetahuan Alam, Universitas Negeri Semarang.</p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col bg-soft px-5 py-8 sm:px-10">
        <div className="mx-auto w-full max-w-xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-sky hover:underline"><ArrowLeft size={16} /> Kembali ke Beranda</Link>
          <div className="mt-6 lg:hidden"><Brand light={false} size={44} /></div>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className={`relative w-full ${lebar}`}>{children}</div>
        </div>
      </main>
    </div>
  );
}
