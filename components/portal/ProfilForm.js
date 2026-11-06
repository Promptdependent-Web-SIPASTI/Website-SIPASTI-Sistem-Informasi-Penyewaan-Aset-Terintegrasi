"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleAlert, LogOut, RotateCcw } from "lucide-react";
import { Kartu, JudulHalaman } from "./ui";
import { useSesi } from "@/lib/useClient";
import { keluar, perbaruiProfil } from "@/lib/auth";
import { setelUlang } from "@/lib/transaksi";

const TIPE = { mahasiswa: "Mahasiswa", dosen: "Dosen", staf: "Staf" };

function Isi({ sesi }) {
  const router = useRouter();
  const [nama, setNama] = useState(sesi.nama);
  const [telp, setTelp] = useState(sesi.telp ?? "");
  const [galat, setGalat] = useState({});
  const [ok, setOk] = useState(false);

  function simpan(e) {
    e.preventDefault();
    const g = {};
    if (nama.trim().length < 3) g.nama = "Nama lengkap wajib diisi.";
    if (!/^(\+62|62|0)8\d{7,12}$/.test(telp.replace(/[\s-]/g, ""))) g.telp = "Nomor telepon tidak valid (mis. 081234567890).";
    setGalat(g);
    setOk(false);
    if (Object.keys(g).length) return;
    perbaruiProfil({ nama: nama.trim(), telp });
    setOk(true);
  }
  const inp = (bad) => `w-full rounded-xl border bg-field px-4 py-3 text-sm outline-none transition focus:bg-white ${bad ? "border-red-300 focus:border-red-400" : "border-pale focus:border-sky"}`;
  const lab = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy";
  const baca = "w-full rounded-xl border border-pale bg-pale/50 px-4 py-3 text-sm text-slate-600";

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Profil Saya" sub="Kelola data diri Anda sebagai penyewa aset FMIPA UNNES." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Kartu className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-navy">Data Diri</h2>
          <form onSubmit={simpan} noValidate className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="p-nama" className={lab}>Nama lengkap</label><input id="p-nama" value={nama} onChange={(e) => setNama(e.target.value)} className={inp(galat.nama)} />{galat.nama && <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5" /> {galat.nama}</p>}</div>
            <div><label htmlFor="p-telp" className={lab}>Nomor telepon / WhatsApp</label><input id="p-telp" value={telp} onChange={(e) => setTelp(e.target.value)} className={inp(galat.telp)} />{galat.telp && <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5" /> {galat.telp}</p>}</div>
            <div><span className={lab}>Email UNNES</span><p className={baca}>{sesi.email}</p></div>
            <div><span className={lab}>Tipe penyewa</span><p className={baca}>{TIPE[sesi.tipe] ?? "Penyewa"}</p></div>
            {sesi.idn && <div><span className={lab}>{sesi.tipe === "mahasiswa" ? "NIM" : "NIP"}</span><p className={baca}>{sesi.idn}</p></div>}
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-sun px-7 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Simpan Perubahan</button>
              {ok && <span role="status" className="ml-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CircleCheck size={16} /> Profil diperbarui</span>}
            </div>
          </form>
          <p className="mt-6 border-t border-pale pt-4 text-xs text-slate-500">Email, tipe penyewa, dan {sesi.tipe === "mahasiswa" ? "NIM" : "NIP"} diverifikasi melalui basis data FMIPA UNNES sehingga tidak dapat diubah sendiri.</p>
        </Kartu>

        <div className="space-y-6">
          <Kartu className="p-6">
            <h2 className="font-bold text-navy">Sesi</h2>
            <button type="button" onClick={() => { keluar(); router.push("/masuk"); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"><LogOut size={16} /> Keluar</button>
          </Kartu>
          <Kartu className="border-dashed p-6">
            <h2 className="font-bold text-navy">Data simulasi</h2>
            <p className="mt-1 text-xs text-slate-500">Khusus tahap front end: kembalikan transaksi contoh ke kondisi awal.</p>
            <button type="button" onClick={() => { if (window.confirm("Setel ulang seluruh transaksi simulasi ke kondisi awal?")) setelUlang(); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-sky py-2.5 text-sm font-bold text-sky transition hover:bg-sky hover:text-white"><RotateCcw size={15} /> Setel Ulang Data Demo</button>
          </Kartu>
        </div>
      </div>
    </div>
  );
}

export default function ProfilForm() {
  const sesi = useSesi();
  if (!sesi) return null;
  return <Isi key={sesi.email} sesi={sesi} />;
}
