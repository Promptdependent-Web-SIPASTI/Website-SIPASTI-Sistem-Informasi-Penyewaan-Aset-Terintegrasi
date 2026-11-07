"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, LockKeyhole, Eye, EyeOff, ArrowRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { AKUN_DEMO, emailValid, masuk } from "@/lib/auth";

export default function LoginForm({ next, baruDaftar }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [ingat, setIngat] = useState(true);
  const [galat, setGalat] = useState("");
  const [fe, setFe] = useState({});
  const [proses, setProses] = useState(false);

  function kirim(e) {
    e.preventDefault();
    const f = {};
    if (!email.trim()) f.email = "Email wajib diisi.";
    else if (!emailValid(email)) f.email = "Format email tidak valid.";
    if (!sandi) f.sandi = "Kata sandi wajib diisi.";
    setFe(f);
    setGalat("");
    if (Object.keys(f).length) return;
    setProses(true);
    setTimeout(() => {
      const sesi = masuk(email, sandi);
      if (sesi?.nonaktif) {
        setProses(false);
        setGalat("Akun Anda dinonaktifkan. Hubungi admin FMIPA UNNES untuk mengaktifkannya kembali.");
        return;
      }
      if (!sesi) {
        setProses(false);
        setGalat("Email atau kata sandi tidak sesuai. Periksa kembali informasi masuk Anda.");
        return;
      }
      const aman = next && next.startsWith("/") && !next.startsWith("//") ? next : `/dashboard/${sesi.peran}`;
      router.push(aman);
    }, 550);
  }

  const input = (bad) => `w-full rounded-xl border bg-field py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white ${bad ? "border-red-300 focus:border-red-400" : "border-pale focus:border-sky"}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-pale bg-white shadow-pop">
      <div className="h-1.5 bg-sun" />
      <div className="p-8 sm:p-10">
        <h1 className="text-2xl font-extrabold text-navy">Masuk ke SIPASTI</h1>
        <p className="mt-1.5 text-sm text-ink">Gunakan akun yang telah terdaftar.</p>

        {baruDaftar && (
          <p role="status" className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CircleCheck size={18} className="mt-0.5 shrink-0" /> Akun berhasil dibuat. Silakan masuk dengan email dan kata sandi Anda.
          </p>
        )}
        {galat && (
          <p role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert size={18} className="mt-0.5 shrink-0" /> {galat}
          </p>
        )}

        <form onSubmit={kirim} noValidate className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy">Email</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@students.unnes.ac.id" className={input(fe.email || galat)} />
            </div>
            {fe.email && <p className="mt-1.5 text-xs text-red-600">{fe.email}</p>}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="sandi" className="text-xs font-bold uppercase tracking-wide text-navy">Kata sandi</label>
              <a href="mailto:sipasti@fmipa.unnes.ac.id?subject=Reset%20kata%20sandi" className="text-xs font-semibold text-sky hover:underline">Lupa sandi?</a>
            </div>
            <div className="relative">
              <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="sandi" type={lihat ? "text" : "password"} autoComplete="current-password" value={sandi} onChange={(e) => setSandi(e.target.value)} placeholder="Masukkan kata sandi" className={`${input(fe.sandi || galat)} pr-12`} />
              <button type="button" onClick={() => setLihat((v) => !v)} aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-navy">
                {lihat ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fe.sandi && <p className="mt-1.5 text-xs text-red-600">{fe.sandi}</p>}
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-ink">
            <input type="checkbox" checked={ingat} onChange={(e) => setIngat(e.target.checked)} className="size-4 rounded accent-sky" /> Ingat perangkat ini
          </label>
          <button type="submit" disabled={proses} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sun py-3.5 font-bold text-navy shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:opacity-80">
            {proses ? <><LoaderCircle size={18} className="animate-spin" /> Memproses…</> : <>Masuk <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="mt-7 border-t border-pale pt-6 text-center text-sm text-ink">
          Belum punya akun? <Link href="/daftar" className="font-bold text-sky hover:underline">Daftar sekarang</Link>
        </p>

        <details className="mt-5 rounded-xl bg-soft px-4 py-3 text-xs text-ink">
          <summary className="cursor-pointer font-bold text-navy">Akun demo (khusus pengujian front end)</summary>
          <ul className="mt-3 space-y-2">
            {AKUN_DEMO.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-3">
                <span><b className="capitalize text-navy">{a.peran}</b> · {a.email}</span>
                <button type="button" onClick={() => { setEmail(a.email); setSandi(a.sandi); setFe({}); setGalat(""); }} className="shrink-0 rounded-md bg-white px-2.5 py-1 font-semibold text-sky shadow-sm hover:bg-sky hover:text-white">Isi</button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-slate-500">Kata sandi demo: <code className="rounded bg-white px-1.5 py-0.5 font-mono">Sipasti123</code></p>
        </details>
      </div>
    </div>
  );
}
