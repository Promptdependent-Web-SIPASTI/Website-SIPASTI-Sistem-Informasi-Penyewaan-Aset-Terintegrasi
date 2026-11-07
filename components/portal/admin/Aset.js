"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, Plus, Pencil, Info, CircleAlert } from "lucide-react";
import { Kartu, JudulHalaman } from "../ui";
import Modal from "../Modal";
import { useAsetList, ubahAset, tambahAsetBaru, useSubkategori, setelUlangAset } from "@/lib/asetStore";
import { rupiah, satuanLabel } from "@/lib/data";

const KONDISI = ["Baik", "Rusak Ringan", "Rusak Berat", "Dalam Pemeliharaan"];
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function FormAset({ aset, semua, subkategori, tutup }) {
  const baru = !aset;
  const [f, setF] = useState({
    nama: aset?.nama ?? "", kategori: aset?.kategori ?? "ruangan", subkategori: aset?.subkategori ?? "Aula", lokasi: aset?.lokasi ?? "",
    jumlah: String(aset ? (aset.kategori === "ruangan" ? aset.kapasitas : aset.stokTotal ?? aset.stok) : ""),
    satuan: aset?.satuan ?? "jam", tarif: String(aset?.tarif ?? ""), kondisi: aset?.kondisi ?? "Baik", aktif: aset ? aset.status !== "Tidak tersedia" : true,
  });
  const [g, setG] = useState({});
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }); setG({ ...g, [k]: "" }); };
  const isR = f.kategori === "ruangan";

  function simpan(e) {
    e.preventDefault();
    const x = {};
    if (f.nama.trim().length < 3) x.nama = "Nama aset wajib diisi.";
    if (!f.lokasi.trim()) x.lokasi = "Lokasi wajib diisi.";
    if (!(Number(f.jumlah) > 0)) x.jumlah = isR ? "Kapasitas harus lebih dari 0." : "Stok harus lebih dari 0.";
    if (!(Number(f.tarif) >= 0) || f.tarif === "") x.tarif = "Tarif wajib diisi (angka).";
    setG(x);
    if (Object.keys(x).length) return;
    const n = Number(f.jumlah);
    const status = f.aktif ? "Tersedia" : "Tidak tersedia";
    if (baru) {
      const awalan = isR ? (f.subkategori === "Laboratorium" ? "LAB" : f.subkategori === "Ruang Rapat" ? "RPT" : "FAS") : "ALT";
      const urut = semua.filter((a) => a.kode.startsWith(awalan)).length + 1;
      const kode = `${awalan}-${String(urut).padStart(2, "0")}`;
      tambahAsetBaru({
        slug: `${slugify(f.nama)}-${kode.toLowerCase()}`, kode, nama: f.nama.trim(), kategori: f.kategori, subkategori: f.subkategori, lokasi: f.lokasi.trim(),
        ...(isR ? { kapasitas: n } : { stok: n, stokTotal: n, pengelola: f.lokasi.trim() }), kondisi: f.kondisi, status, ...(f.aktif ? {} : { statusKet: "dinonaktifkan" }),
        satuan: f.satuan, tarif: Number(f.tarif), ringkas: `${f.nama.trim()} — ${f.subkategori}.`, deskripsi: `${f.nama.trim()} di ${f.lokasi.trim()}.`, fasilitas: "-", aturan: ["Pengajuan paling lambat H-2 sebelum hari pemakaian.", "Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB."], foto: null,
      });
    } else {
      ubahAset(aset.slug, { nama: f.nama.trim(), lokasi: f.lokasi.trim(), ...(isR ? { kapasitas: n } : { stokTotal: n, stok: Math.min(aset.stok, n) }), kondisi: f.kondisi, status, statusKet: f.aktif ? undefined : aset.statusKet ?? "dinonaktifkan", satuan: f.satuan, tarif: Number(f.tarif) });
    }
    tutup();
  }
  const inp = (bad) => `mt-1.5 w-full rounded-xl border bg-pale/60 px-4 py-2.5 text-sm font-medium text-navy outline-none focus:bg-white ${bad ? "border-red-300" : "border-transparent focus:border-sky"}`;
  const lab = "block text-sm font-bold text-navy";
  const er = (k) => (g[k] ? <p role="alert" className="mt-1 flex gap-1 text-xs text-red-600"><CircleAlert size={12} className="mt-0.5" /> {g[k]}</p> : null);
  return (
    <Modal judul={baru ? "Tambah Aset Baru" : `Ubah Aset ${aset.kode}`} tutup={tutup}>
      <form onSubmit={simpan} noValidate className="grid gap-4 sm:grid-cols-2">
        <label className={`${lab} sm:col-span-2`}>Nama aset<input value={f.nama} onChange={set("nama")} className={inp(g.nama)} />{er("nama")}</label>
        <label className={lab}>Kategori<select value={f.kategori} onChange={set("kategori")} disabled={!baru} className={inp()}><option value="ruangan">Fasilitas dan Ruangan</option><option value="peralatan">Peralatan dan Perlengkapan</option></select></label>
        <label className={lab}>Subkategori<select value={f.subkategori} onChange={set("subkategori")} disabled={!baru} className={inp()}>{subkategori.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className={`${lab} sm:col-span-2`}>{isR ? "Lokasi" : "Pengelola / lokasi penyimpanan"}<input value={f.lokasi} onChange={set("lokasi")} className={inp(g.lokasi)} />{er("lokasi")}</label>
        <label className={lab}>{isR ? "Kapasitas (orang)" : "Stok total (unit)"}<input inputMode="numeric" value={f.jumlah} onChange={set("jumlah")} className={inp(g.jumlah)} />{er("jumlah")}</label>
        <label className={lab}>Kondisi<select value={f.kondisi} onChange={set("kondisi")} className={inp()}>{[...new Set([f.kondisi, ...KONDISI])].map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className={lab}>Satuan sewa<select value={f.satuan} onChange={set("satuan")} className={inp()}>{["jam", "hari", "kegiatan", "unit"].map((s) => <option key={s} value={s}>per {satuanLabel(s)}</option>)}</select></label>
        <label className={lab}>Tarif (Rp)<input inputMode="numeric" value={f.tarif} onChange={(e) => { setF({ ...f, tarif: e.target.value.replace(/\D/g, "") }); setG({ ...g, tarif: "" }); }} className={inp(g.tarif)} />{er("tarif")}</label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-navy sm:col-span-2"><input type="checkbox" checked={f.aktif} onChange={set("aktif")} className="size-4 accent-sky" /> Aset aktif dan dapat disewa</label>
        <div className="mt-2 flex gap-3 sm:col-span-2"><button type="button" onClick={tutup} className="flex-1 rounded-xl border border-sky py-3 text-sm font-bold text-sky hover:bg-pale">Batal</button><button type="submit" className="flex-1 rounded-xl bg-sun py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Simpan</button></div>
      </form>
    </Modal>
  );
}

export default function Aset() {
  const semua = useAsetList();
  const subkategori = useSubkategori();
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("semua");
  const [modal, setModal] = useState(null); // null | "baru" | slug

  const hasil = useMemo(() => semua.filter((a) => (kat === "semua" || a.kategori === kat) && (!q.trim() || `${a.nama} ${a.kode} ${a.subkategori}`.toLowerCase().includes(q.trim().toLowerCase()))), [semua, q, kat]);
  const edit = modal && modal !== "baru" ? semua.find((a) => a.slug === modal) : null;

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Manajemen Aset" sub="Kelola data aset: lokasi, kapasitas/stok, kondisi, tarif, dan status aktif."
        aksi={<button type="button" onClick={() => setModal("baru")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-sun px-6 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5"><Plus size={18} /> Tambah Aset</button>} />
      <p className="flex gap-2.5 rounded-xl bg-pale/60 px-4 py-3 text-xs leading-relaxed text-sky"><Info size={15} className="mt-0.5 shrink-0" /> Tahap front end: perubahan disimpan di peramban ini dan memengaruhi halaman admin/petugas. Katalog publik memakai data tetap sampai backend (Supabase) terhubung. <button type="button" onClick={() => { if (window.confirm("Kembalikan semua perubahan aset ke data awal?")) setelUlangAset(); }} className="font-bold underline">Setel ulang</button></p>
      <Kartu className="p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <span className="relative flex-1"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Cari aset" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau kode aset…" className="w-full rounded-xl bg-pale py-2.5 pl-10 pr-3 text-sm outline-none ring-sky/40 placeholder:text-slate-500 focus:ring-2" /></span>
          <select aria-label="Kategori" value={kat} onChange={(e) => setKat(e.target.value)} className="rounded-xl bg-pale px-4 py-2.5 text-sm font-medium text-navy outline-none"><option value="semua">Semua Kategori</option><option value="ruangan">Fasilitas dan Ruangan</option><option value="peralatan">Peralatan dan Perlengkapan</option></select>
        </div>
        <div className="relative mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">Kode</th><th className="px-3 py-3">Nama Aset</th><th className="px-3 py-3">Lokasi</th><th className="px-3 py-3">Kapasitas / Stok</th><th className="px-3 py-3">Tarif</th><th className="px-3 py-3">Kondisi</th><th className="px-3 py-3">Status</th><th className="rounded-r-lg px-3 py-3"><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody className="divide-y divide-pale/80">
              {hasil.map((a) => (
                <tr key={a.slug}>
                  <td className="px-3 py-3.5 text-xs font-bold text-slate-500">{a.kode}</td>
                  <td className="px-3 py-3.5"><span className="block font-bold text-navy">{a.nama}</span><span className="text-xs text-slate-500">{a.subkategori}</span></td>
                  <td className="px-3 py-3.5 text-ink">{a.lokasi}</td>
                  <td className="px-3 py-3.5 text-ink">{a.kategori === "ruangan" ? `${a.kapasitas} ${a.kapasitasSatuan ?? "orang"}` : `${a.stok} / ${a.stokTotal} ${a.stokSatuan ?? "unit"}`}</td>
                  <td className="px-3 py-3.5 font-semibold text-navy">{rupiah(a.tarif)}<span className="font-normal text-slate-500"> / {satuanLabel(a.satuan)}</span></td>
                  <td className="px-3 py-3.5 text-xs text-ink">{a.kondisi}</td>
                  <td className="px-3 py-3.5"><span className={`rounded-full px-3 py-1 text-xs font-bold ${a.status === "Tidak tersedia" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{a.status === "Tidak tersedia" ? "Nonaktif" : "Aktif"}</span></td>
                  <td className="px-3 py-3.5 text-right"><button type="button" onClick={() => setModal(a.slug)} aria-label={`Ubah ${a.nama}`} className="inline-flex items-center gap-1.5 rounded-lg border border-sky px-3 py-1.5 text-xs font-bold text-sky transition hover:bg-sky hover:text-white"><Pencil size={13} /> Ubah</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasil.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Aset tidak ditemukan.</p>}
        </div>
      </Kartu>
      <AnimatePresence>{modal && (modal === "baru" || edit) && <FormAset key={modal} aset={edit} semua={semua} subkategori={subkategori} tutup={() => setModal(null)} />}</AnimatePresence>
    </div>
  );
}
