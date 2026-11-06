"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpenText, Briefcase, ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import { daftarAkun, emailValid, emailResmi } from "@/lib/auth";

const TIPE = [
  { id: "mahasiswa", label: "Mahasiswa", sub: "Gunakan NIM", ikon: GraduationCap, idLabel: "NIM (Nomor Induk Mahasiswa)", idPh: "mis. 4201421008" },
  { id: "dosen", label: "Dosen", sub: "Gunakan NIP", ikon: BookOpenText, idLabel: "NIP (Nomor Induk Pegawai)", idPh: "mis. 198501012010011001" },
  { id: "staf", label: "Staf", sub: "Gunakan NIP", ikon: Briefcase, idLabel: "NIP (Nomor Induk Pegawai)", idPh: "mis. 198501012010011001" },
];

export default function RegisterForm() {
  const router = useRouter();
  const [tipe, setTipe] = useState("mahasiswa");
  const [f, setF] = useState({ nama: "", idn: "", email: "", telp: "", sandi: "", konfirmasi: "", setuju: false });
  const [e, setE] = useState({});
  const [proses, setProses] = useState(false);
  const t = TIPE.find((x) => x.id === tipe);
  const set = (k) => (ev) => setF((s) => ({ ...s, [k]: ev.target.type === "checkbox" ? ev.target.checked : ev.target.value }));

  function validasi() {
    const x = {};
    if (f.nama.trim().length < 3) x.nama = "Nama lengkap wajib diisi.";
    if (!/^\d{8,22}$/.test(f.idn)) x.idn = `${tipe === "mahasiswa" ? "NIM" : "NIP"} harus berupa angka (minimal 8 digit).`;
    if (!emailValid(f.email)) x.email = "Format email tidak valid.";
    else if (!emailResmi(f.email)) x.email = "Gunakan domain email resmi @students.unnes.ac.id atau @mail.unnes.ac.id";
    if (!/^(\+62|62|0)8\d{7,12}$/.test(f.telp.replace(/[\s-]/g, ""))) x.telp = "Nomor telepon tidak valid (mis. 081234567890).";
    if (f.sandi.length < 8) x.sandi = "Kata sandi minimal 8 karakter.";
    if (f.konfirmasi !== f.sandi) x.konfirmasi = "Konfirmasi kata sandi tidak cocok dengan kata sandi sebelumnya.";
    if (!f.setuju) x.setuju = "Anda harus menyetujui ketentuan penyewaan aset.";
    return x;
  }

  function kirim(ev) {
    ev.preventDefault();
    const x = validasi();
    setE(x);
    if (Object.keys(x).length) return;
    setProses(true);
    setTimeout(() => {
      const r = daftarAkun({ nama: f.nama.trim(), email: f.email.trim(), sandi: f.sandi, tipe, idn: f.idn, telp: f.telp });
      if (!r.ok) {
        setProses(false);
        setE({ email: r.pesan });
        return;
      }
      router.push("/masuk?baru=1");
    }, 600);
  }

  const inp = (bad) => `w-full rounded-xl border bg-field px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white ${bad ? "border-red-300 bg-red-50/40 focus:border-red-400" : "border-pale focus:border-sky"}`;
  const lab = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy";
  const err = (k) => (e[k] ? <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5 shrink-0" /> {e[k]}</p> : null);

  return (
    <div className="overflow-hidden rounded-3xl border border-pale bg-white shadow-pop">
      <div className="h-1.5 bg-sun" />
      <div className="p-8 sm:p-10">
        <h1 className="text-2xl font-extrabold text-navy">Buat Akun Penyewa</h1>
        <p className="mt-1.5 text-sm text-ink">Untuk mahasiswa, dosen, dan staf UNNES.</p>

        <form onSubmit={kirim} noValidate className="mt-7 space-y-5">
          <fieldset>
            <legend className={lab}>Tipe penyewa</legend>
            <div className="grid grid-cols-3 gap-3">
              {TIPE.map(({ id, label, sub, ikon: Icon }) => (
                <button key={id} type="button" onClick={() => setTipe(id)} aria-pressed={tipe === id} className={`rounded-xl border px-2 py-3 text-center transition ${tipe === id ? "border-sky bg-soft shadow-sm ring-2 ring-sky/20" : "border-pale bg-white hover:border-sky/50"}`}>
                  <span className={`mb-1 flex items-center justify-center gap-1.5 text-sm font-bold ${tipe === id ? "text-navy" : "text-slate-600"}`}><Icon size={15} /> {label}</span>
                  <span className={`text-xs ${tipe === id ? "text-sky" : "text-slate-400"}`}>{sub}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="nama" className={lab}>Nama lengkap</label><input id="nama" value={f.nama} onChange={set("nama")} placeholder="Nama sesuai identitas" autoComplete="name" className={inp(e.nama)} />{err("nama")}</div>
            <div><label htmlFor="idn" className={lab}>{t.idLabel}</label><input id="idn" inputMode="numeric" value={f.idn} onChange={set("idn")} placeholder={t.idPh} className={inp(e.idn)} />{err("idn")}</div>
            <div><label htmlFor="email" className={lab}>Email UNNES</label><input id="email" type="email" value={f.email} onChange={set("email")} placeholder="nama@students.unnes.ac.id" autoComplete="email" className={inp(e.email)} />{err("email")}</div>
            <div><label htmlFor="telp" className={lab}>Nomor telepon / WhatsApp</label><input id="telp" inputMode="tel" value={f.telp} onChange={set("telp")} placeholder="081234567890" autoComplete="tel" className={inp(e.telp)} />{err("telp")}</div>
            <div>
              <div className="flex items-baseline justify-between"><label htmlFor="sandi" className={lab}>Kata sandi</label><span className="text-[11px] text-slate-400">Minimal 8 karakter</span></div>
              <input id="sandi" type="password" value={f.sandi} onChange={set("sandi")} autoComplete="new-password" className={inp(e.sandi)} />{err("sandi")}
            </div>
            <div><label htmlFor="konfirmasi" className={lab}>Konfirmasi kata sandi</label><input id="konfirmasi" type="password" value={f.konfirmasi} onChange={set("konfirmasi")} autoComplete="new-password" className={inp(e.konfirmasi)} />{err("konfirmasi")}</div>
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
              <input type="checkbox" checked={f.setuju} onChange={set("setuju")} className="mt-0.5 size-4 rounded accent-sky" />
              <span>Saya menyetujui <Link href="/#faq" className="font-semibold text-sky hover:underline">ketentuan penyewaan aset</Link> dan kebijakan privasi FMIPA Universitas Negeri Semarang.</span>
            </label>
            {err("setuju")}
          </div>

          <button type="submit" disabled={proses} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sun py-3.5 font-bold text-navy shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:opacity-80">
            {proses ? <><LoaderCircle size={18} className="animate-spin" /> Memproses…</> : <>Daftar Akun <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="mt-6 border-t border-pale pt-6 text-center text-sm text-ink">
          Sudah punya akun? <Link href="/masuk" className="font-bold text-sky hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
