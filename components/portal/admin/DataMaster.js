"use client";

import { useMemo, useState } from "react";
import { Building2, Wrench, Plus, CircleCheck, CircleAlert, UserPlus, Save, RotateCcw, Lock } from "lucide-react";
import { Kartu, JudulHalaman } from "../ui";
import { useAsetList, useSubkategori, tambahSubkategori, ubahAset } from "@/lib/asetStore";
import { useSemuaTransaksi, TIPE_LABEL } from "@/lib/transaksi";
import { akunTerdaftar, daftarAkun, daftarNonaktif, emailValid, setAktif } from "@/lib/auth";
import { usePengaturan, simpanPengaturan, PENGATURAN_AWAL, PARAMETER_TETAP } from "@/lib/pengaturan";
import { useSesi } from "@/lib/useClient";
import { KATEGORI, rupiah, satuanLabel } from "@/lib/data";
import { useSyncExternalStore } from "react";

/* ---------------- Kategori ---------------- */
export function Kategori() {
  const aset = useAsetList();
  const sub = useSubkategori();
  const [nama, setNama] = useState("");
  const [g, setG] = useState("");
  const jumlah = (k, s) => aset.filter((a) => a.kategori === k && (!s || a.subkategori === s)).length;
  const subDi = (k) => [...new Set([...sub.filter((s) => aset.some((a) => a.kategori === k && a.subkategori === s)), ...(k === "ruangan" ? sub.filter((s) => !aset.some((a) => a.subkategori === s)) : [])])];

  function tambah(e) {
    e.preventDefault();
    const n = nama.trim();
    if (n.length < 3) return setG("Nama subkategori minimal 3 karakter.");
    if (sub.some((s) => s.toLowerCase() === n.toLowerCase())) return setG("Subkategori sudah ada.");
    tambahSubkategori(n); setNama(""); setG("");
  }
  return (
    <div className="space-y-6">
      <JudulHalaman judul="Kategori Aset" sub="Dua kategori utama beserta subkategori untuk pengelompokan dan filter katalog." />
      <div className="grid gap-6 md:grid-cols-2">
        {[["ruangan", Building2], ["peralatan", Wrench]].map(([k, Ik]) => (
          <Kartu key={k} className="p-6">
            <div className="flex items-start gap-4"><span className="flex size-14 items-center justify-center rounded-2xl bg-[#fff3c4] text-[#b78a00]"><Ik size={26} /></span><div><h2 className="text-lg font-bold text-navy">{KATEGORI[k].nama}</h2><p className="text-xs text-slate-500">{KATEGORI[k].deskripsi}</p><p className="mt-1 text-sm font-bold text-sky">{jumlah(k)} aset</p></div></div>
            <ul className="mt-5 divide-y divide-pale text-sm">
              {subDi(k).map((s) => <li key={s} className="flex justify-between py-2.5"><span className="font-semibold text-navy">{s}</span><span className="text-slate-500">{jumlah(k, s)} aset</span></li>)}
              {subDi(k).length === 0 && <li className="py-3 text-slate-500">Belum ada subkategori.</li>}
            </ul>
          </Kartu>
        ))}
      </div>
      <Kartu className="p-6">
        <h2 className="text-lg font-bold text-navy">Tambah Subkategori</h2>
        <form onSubmit={tambah} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1"><input aria-label="Nama subkategori" value={nama} onChange={(e) => { setNama(e.target.value); setG(""); }} placeholder="mis. Studio Multimedia" className="w-full rounded-xl bg-pale/60 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-sky/40" />{g && <p role="alert" className="mt-1.5 flex gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5" /> {g}</p>}</div>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sun px-6 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5"><Plus size={17} /> Tambah</button>
        </form>
        <p className="mt-3 text-xs text-slate-500">Subkategori baru tersedia pada formulir aset (Manajemen Aset). Simulasi lokal sampai backend terhubung.</p>
      </Kartu>
    </div>
  );
}

/* ---------------- Tarif ---------------- */
function BarisTarif({ a }) {
  const [tarif, setTarif] = useState(String(a.tarif));
  const [satuan, setSatuan] = useState(a.satuan);
  const [ok, setOk] = useState(false);
  const berubah = Number(tarif) !== a.tarif || satuan !== a.satuan;
  const simpan = () => { if (tarif === "" || Number(tarif) < 0) return; ubahAset(a.slug, { tarif: Number(tarif), satuan }); setOk(true); setTimeout(() => setOk(false), 1800); };
  return (
    <tr>
      <td className="px-3 py-3 text-xs font-bold text-slate-500">{a.kode}</td>
      <td className="px-3 py-3 font-bold text-navy">{a.nama}</td>
      <td className="px-3 py-3"><select aria-label={`Satuan ${a.nama}`} value={satuan} onChange={(e) => setSatuan(e.target.value)} className="rounded-lg bg-pale/60 px-3 py-2 text-sm font-medium outline-none">{["jam", "hari", "kegiatan", "unit"].map((s) => <option key={s} value={s}>per {satuanLabel(s)}</option>)}</select></td>
      <td className="px-3 py-3"><span className="inline-flex items-center rounded-lg bg-pale/60 pl-3 text-sm font-medium text-slate-500">Rp<input aria-label={`Tarif ${a.nama}`} inputMode="numeric" value={tarif} onChange={(e) => setTarif(e.target.value.replace(/\D/g, ""))} className="w-28 bg-transparent px-2 py-2 font-bold text-navy outline-none" /></span></td>
      <td className="px-3 py-3 text-right">{ok ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CircleCheck size={14} /> Tersimpan</span> : <button type="button" disabled={!berubah} onClick={simpan} className="inline-flex items-center gap-1.5 rounded-lg bg-sun px-3.5 py-1.5 text-xs font-bold text-navy shadow-sm transition enabled:hover:-translate-y-0.5 disabled:opacity-40"><Save size={13} /> Simpan</button>}</td>
    </tr>
  );
}
export function Tarif() {
  const aset = useAsetList();
  return (
    <div className="space-y-6">
      <JudulHalaman judul="Tarif" sub="Atur tarif dan satuan sewa tiap aset. Tarif sama untuk semua tipe penyewa." />
      <p className="rounded-xl bg-pale/60 px-4 py-3 text-xs leading-relaxed text-sky">Tarif yang berlaku saat pengajuan disimpan pada transaksi, sehingga perubahan tarif tidak memengaruhi transaksi yang sudah dibuat.</p>
      <Kartu className="p-5 md:p-6">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">Kode</th><th className="px-3 py-3">Aset</th><th className="px-3 py-3">Satuan</th><th className="px-3 py-3">Tarif</th><th className="rounded-r-lg px-3 py-3"><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody className="divide-y divide-pale/80">{aset.map((a) => <BarisTarif key={a.slug + a.tarif + a.satuan} a={a} />)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">Contoh tampilan: {aset[0] ? `${aset[0].nama} ${rupiah(aset[0].tarif)} / ${satuanLabel(aset[0].satuan)}` : ""}</p>
      </Kartu>
    </div>
  );
}

/* ---------------- Pengguna ---------------- */
const subs = (cb) => { window.addEventListener("sipasti-data", cb); window.addEventListener("storage", cb); return () => { window.removeEventListener("sipasti-data", cb); window.removeEventListener("storage", cb); }; };
const snap = () => { try { return `${localStorage.getItem("sipasti_demo_accounts") ?? ""}|${localStorage.getItem("sipasti_demo_nonaktif") ?? ""}`; } catch { return ""; } };

export function Pengguna() {
  const sesi = useSesi();
  const { items } = useSemuaTransaksi();
  const kunci = useSyncExternalStore(subs, snap, () => "");
  const [f, setF] = useState({ nama: "", email: "", sandi: "" });
  const [g, setG] = useState({});
  const [ok, setOk] = useState("");

  const daftar = useMemo(() => {
    void kunci;
    const peta = new Map();
    akunTerdaftar().forEach((a) => peta.set(a.email, { nama: a.nama, email: a.email, peran: a.peran, tipe: a.tipe }));
    items.forEach((t) => { if (!peta.has(t.email)) peta.set(t.email, { nama: t.penyewa?.nama ?? t.email, email: t.email, peran: "penyewa", tipe: t.penyewa?.tipe }); });
    const nonaktif = new Set(daftarNonaktif());
    const urut = { admin: 0, petugas: 1, penyewa: 2 };
    return [...peta.values()].map((u) => ({ ...u, aktif: !nonaktif.has(u.email), trx: items.filter((t) => t.email === u.email).length })).sort((a, b) => urut[a.peran] - urut[b.peran] || a.nama.localeCompare(b.nama));
  }, [kunci, items]);

  function tambah(e) {
    e.preventDefault();
    const x = {};
    if (f.nama.trim().length < 3) x.nama = "Nama wajib diisi.";
    if (!emailValid(f.email)) x.email = "Format email tidak valid.";
    if (f.sandi.length < 8) x.sandi = "Kata sandi minimal 8 karakter.";
    setG(x); setOk("");
    if (Object.keys(x).length) return;
    const r = daftarAkun({ nama: f.nama.trim(), email: f.email.trim(), sandi: f.sandi }, "petugas");
    if (!r.ok) return setG({ email: r.pesan });
    setF({ nama: "", email: "", sandi: "" }); setOk(`Akun petugas ${f.nama.trim()} dibuat.`);
  }
  const inp = (bad) => `mt-1.5 w-full rounded-xl border bg-pale/60 px-4 py-2.5 text-sm font-medium outline-none focus:bg-white ${bad ? "border-red-300" : "border-transparent focus:border-sky"}`;
  const er = (k) => (g[k] ? <p role="alert" className="mt-1 flex gap-1 text-xs text-red-600"><CircleAlert size={12} className="mt-0.5" /> {g[k]}</p> : null);
  const chip = { admin: "bg-navy text-white", petugas: "bg-sun text-navy", penyewa: "bg-pale text-sky" };

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Pengguna" sub="Kelola akun penyewa, petugas, dan admin. Akun petugas dibuat oleh admin." />
      <Kartu className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><UserPlus size={18} className="text-sky" /> Tambah Akun Petugas</h2>
        {ok && <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800"><CircleCheck size={16} /> {ok}</p>}
        <form onSubmit={tambah} noValidate className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-start">
          <label className="block text-sm font-bold text-navy">Nama<input value={f.nama} onChange={(e) => { setF({ ...f, nama: e.target.value }); setG({ ...g, nama: "" }); }} className={inp(g.nama)} />{er("nama")}</label>
          <label className="block text-sm font-bold text-navy">Email<input type="email" value={f.email} onChange={(e) => { setF({ ...f, email: e.target.value }); setG({ ...g, email: "" }); }} className={inp(g.email)} />{er("email")}</label>
          <label className="block text-sm font-bold text-navy">Kata sandi awal<input type="password" value={f.sandi} onChange={(e) => { setF({ ...f, sandi: e.target.value }); setG({ ...g, sandi: "" }); }} className={inp(g.sandi)} />{er("sandi")}</label>
          <button type="submit" className="mt-[26px] rounded-xl bg-sun px-6 py-2.5 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Tambah</button>
        </form>
      </Kartu>
      <Kartu className="p-5 md:p-6">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">Nama</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Peran</th><th className="px-3 py-3">Transaksi</th><th className="px-3 py-3">Status</th><th className="rounded-r-lg px-3 py-3"><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody className="divide-y divide-pale/80">
              {daftar.map((u) => (
                <tr key={u.email}>
                  <td className="px-3 py-3.5 font-bold text-navy">{u.nama}</td>
                  <td className="px-3 py-3.5 text-xs text-ink">{u.email}</td>
                  <td className="px-3 py-3.5"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${chip[u.peran]}`}>{u.peran === "penyewa" ? TIPE_LABEL[u.tipe] ?? "Penyewa" : u.peran}</span></td>
                  <td className="px-3 py-3.5 text-ink">{u.trx}</td>
                  <td className="px-3 py-3.5"><span className={`text-xs font-bold ${u.aktif ? "text-emerald-700" : "text-red-600"}`}>{u.aktif ? "Aktif" : "Nonaktif"}</span></td>
                  <td className="px-3 py-3.5 text-right">{u.email === sesi?.email ? <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Lock size={12} /> Akun Anda</span> : <button type="button" onClick={() => setAktif(u.email, !u.aktif)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${u.aktif ? "border-red-300 text-red-600 hover:bg-red-50" : "border-sky text-sky hover:bg-sky hover:text-white"}`}>{u.aktif ? "Nonaktifkan" : "Aktifkan"}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kartu>
    </div>
  );
}

/* ---------------- Pengaturan ---------------- */
export function Pengaturan() {
  const p = usePengaturan();
  const [f, setF] = useState(null);
  const nilai = f ?? { dendaPersen: String(p.dendaPersen), toleransiMenit: String(p.toleransiMenit), batasBayarJam: String(p.batasBayarJam) };
  const [g, setG] = useState({});
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => { setF({ ...nilai, [k]: e.target.value.replace(/\D/g, "") }); setG({ ...g, [k]: "" }); setOk(false); };

  function simpan(e) {
    e.preventDefault();
    const x = {};
    const d = Number(nilai.dendaPersen), t = Number(nilai.toleransiMenit), b = Number(nilai.batasBayarJam);
    if (!(d >= 1 && d <= 100)) x.dendaPersen = "Persentase denda harus 1–100.";
    if (!(t >= 0 && t <= 180)) x.toleransiMenit = "Toleransi harus 0–180 menit.";
    if (!(b >= 1 && b <= 72)) x.batasBayarJam = "Batas waktu bayar harus 1–72 jam.";
    setG(x);
    if (Object.keys(x).length) return;
    simpanPengaturan({ dendaPersen: d, toleransiMenit: t, batasBayarJam: b });
    setF(null); setOk(true);
  }
  const inp = (bad) => `mt-1.5 w-full rounded-xl border bg-pale/60 px-4 py-2.5 text-sm font-bold text-navy outline-none focus:bg-white ${bad ? "border-red-300" : "border-transparent focus:border-sky"}`;
  const baris = [
    ["dendaPersen", "Persentase denda keterlambatan (%)", "Dihitung dari tarif satuan untuk tiap jam (sewa per jam) atau hari (sewa per hari/kegiatan) keterlambatan."],
    ["toleransiMenit", "Toleransi keterlambatan (menit)", "Keterlambatan hingga batas ini tidak dikenai denda."],
    ["batasBayarJam", "Batas waktu pembayaran (jam)", "Dihitung sejak persetujuan atau paling lambat H-1 sebelum pemakaian, mana yang lebih awal."],
  ];
  return (
    <div className="space-y-6">
      <JudulHalaman judul="Pengaturan Sistem" sub="Parameter yang memengaruhi perhitungan denda dan batas waktu pembayaran." />
      <Kartu className="p-6 md:p-8">
        <h2 className="text-lg font-bold text-navy">Parameter yang Dapat Diubah</h2>
        {ok && <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800"><CircleCheck size={16} /> Pengaturan disimpan dan langsung dipakai pada perhitungan berikutnya.</p>}
        <form onSubmit={simpan} noValidate className="mt-5 grid gap-6 md:grid-cols-3">
          {baris.map(([k, l, ket]) => (
            <label key={k} className="block text-sm font-bold text-navy">{l}<input inputMode="numeric" value={nilai[k]} onChange={set(k)} className={inp(g[k])} /><span className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-500">{ket}</span>{g[k] && <span role="alert" className="mt-1 flex gap-1 text-xs font-medium text-red-600"><CircleAlert size={12} className="mt-0.5" /> {g[k]}</span>}</label>
          ))}
          <div className="flex gap-3 md:col-span-3"><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-sun px-7 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5"><Save size={16} /> Simpan Pengaturan</button><button type="button" onClick={() => { simpanPengaturan(PENGATURAN_AWAL); setF(null); setOk(true); }} className="inline-flex items-center gap-2 rounded-xl border border-sky px-5 py-3 text-sm font-bold text-sky hover:bg-pale"><RotateCcw size={15} /> Kembalikan Standar</button></div>
        </form>
      </Kartu>
      <Kartu className="p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Lock size={16} className="text-slate-400" /> Parameter Tetap</h2>
        <dl className="mt-4 divide-y divide-pale text-sm">
          {[["Batas minimal pengajuan", `H-${PARAMETER_TETAP.minPengajuanHari} sebelum pemakaian`], ["Durasi sewa maksimal", `${PARAMETER_TETAP.maksDurasiHari} hari`], ["Jam operasional", PARAMETER_TETAP.jamOperasional]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-bold text-navy">{v}</dd></div>)}
        </dl>
        <p className="mt-3 text-xs text-slate-500">Parameter ini diterapkan langsung pada validasi formulir; perubahannya dijadwalkan setelah backend terhubung.</p>
      </Kartu>
    </div>
  );
}
