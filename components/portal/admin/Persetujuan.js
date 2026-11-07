"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Search, CalendarDays, Check, X, FileText, IdCard, ClipboardList, CircleCheck, CircleAlert, ChevronDown, Info, Clock3 } from "lucide-react";
import { Kartu, JudulHalaman, StatusTrx } from "../ui";
import { useSemuaTransaksi, asetTeks, periodeTeks, penyewaUnit, penyewaTeks, rumusBiaya, fmtWaktu, fmtTgl, mulaiMs } from "@/lib/transaksi";
import { setujui, tolak } from "@/lib/aksi";
import { getAset, rupiah } from "@/lib/data";
import { HARI_PANJANG, fromISO } from "@/lib/waktu";

const AWAL = { q: "", status: "diajukan", kategori: "semua", bulan: "" };

function tumpang(a, b) {
  if (a.tanggalSelesai < b.tanggalMulai || b.tanggalSelesai < a.tanggalMulai) return false;
  if (a.satuan === "jam" && b.satuan === "jam" && a.tanggalMulai === b.tanggalMulai) return a.jamMulai < b.jamSelesai && b.jamMulai < a.jamSelesai;
  return true;
}

export function cekKelayakan(t, semua) {
  const aset = getAset(t.asetSlug);
  const aktif = semua.filter((x) => x.kode !== t.kode && x.asetSlug === t.asetSlug && ["disetujui", "sedang_disewa"].includes(x.status) && tumpang(t, x));
  const bentrok = t.kategori === "ruangan" ? aktif.length > 0 : aktif.reduce((s, x) => s + x.jumlah, t.jumlah) > (aset?.stokTotal ?? aset?.stok ?? 0);
  const selisihHari = Math.floor((mulaiMs(t) - t.dibuat) / 86400000);
  const butuhRincian = aset && (aset.subkategori === "Aula" || aset.slug === "ruang-rapat-besar-gedung-ukm");
  const wajib = butuhRincian ? 3 : 2;
  const rentang = t.tanggalSelesai !== t.tanggalMulai ? `${fromISO(t.tanggalMulai).getDate()}–${fmtTgl(t.tanggalSelesai)}` : fmtTgl(t.tanggalMulai);
  return [
    { ok: !bentrok, teks: bentrok ? (t.kategori === "ruangan" ? "Terdapat bentrok jadwal dengan transaksi lain pada periode ini" : "Stok tidak mencukupi pada periode ini") : `Tidak ada bentrok jadwal pada ${rentang}` },
    { ok: selisihHari >= 2, teks: selisihHari >= 2 ? "Diajukan lebih dari H-2 sebelum pemakaian" : "Diajukan kurang dari H-2 sebelum pemakaian" },
    { ok: t.dokumen.length >= wajib, teks: t.dokumen.length >= wajib ? `Seluruh dokumen wajib terunggah (${t.dokumen.length} dari ${wajib})` : `Dokumen wajib belum lengkap (${t.dokumen.length} dari ${wajib})` },
  ];
}

export function InfoPenyewa({ t }) {
  const p = t.penyewa;
  return (
    <>
      <p className="font-bold text-navy">{penyewaTeks(t)}</p>
      <p className="text-xs text-slate-500">{penyewaUnit(t)}{p?.idn ? ` · ${p.tipe === "mahasiswa" ? "NIM" : "NIP"} ${p.idn}` : ""}</p>
    </>
  );
}

function Detail({ t, semua, indeks }) {
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState("");
  const aset = getAset(t.asetSlug);
  const hari = HARI_PANJANG[fromISO(t.tanggalMulai).getDay()];
  const cek = cekKelayakan(t, semua);
  const buka = t.status === "diajukan";

  return (
    <Kartu className="p-6 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold leading-tight text-navy">Detail Pengajuan: {t.kode}</h2>
        {buka && <span className="shrink-0 text-xs text-slate-400">Verifikasi #{String(indeks).padStart(2, "0")}</span>}
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-orange-600"><Clock3 size={13} /> {buka ? "Diajukan" : "Status"} ({fmtWaktu(t.dibuat)} WIB)</p>
      <dl className="mt-4 divide-y divide-pale text-sm">
        <div className="py-3"><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Penyewa</dt><dd className="mt-1"><InfoPenyewa t={t} /></dd></div>
        <div className="py-3"><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Aset dan Jadwal</dt><dd className="mt-1"><p className="font-bold text-navy">{aset?.nama2 ?? t.asetNama} ({t.kodeAset}), {aset?.lokasi}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600"><CalendarDays size={13} className="text-sky" /> {hari}, {periodeTeks(t)}{t.satuan === "jam" ? "" : ` (${t.durasi} ${t.satuan === "hari" ? "hari" : "kegiatan"})`} · Jumlah: {t.kategori === "ruangan" ? "1 ruangan" : `${t.jumlah} ${aset?.stokSatuan ?? "unit"}`}</p></dd></div>
        <div className="py-3"><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Estimasi Tarif Sewa</dt><dd className="mt-1 font-extrabold text-navy">{rumusBiaya(t)} = {rupiah(t.total)}</dd><dd className="text-xs text-slate-500">Tarif sivitas akademika internal FMIPA UNNES</dd></div>
        <div className="py-3"><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tujuan Kegiatan</dt><dd className="mt-1 text-ink">{t.tujuan}</dd></div>
        <div className="py-3">
          <dt className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-slate-400"><span>Dokumen Pendukung</span><span className="font-medium normal-case">{t.dokumen.length} berkas terverifikasi</span></dt>
          <dd className="mt-2 space-y-2">
            {t.dokumen.map((d) => (
              <div key={d.jenis} className="flex items-center justify-between gap-2 rounded-lg bg-soft px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">{d.jenis.startsWith("Identitas") ? <IdCard size={17} className="shrink-0 text-sky" /> : d.jenis.startsWith("Rincian") ? <ClipboardList size={17} className="shrink-0 text-sky" /> : <FileText size={17} className="shrink-0 text-sky" />}<div className="min-w-0"><p className="text-xs font-bold text-navy">{d.jenis}</p><p className="truncate text-[11px] text-slate-500">{d.nama}</p></div></div>
                <span className="shrink-0 rounded-md border border-sky px-2.5 py-1 text-xs font-bold text-sky">Lihat</span>
              </div>
            ))}
          </dd>
        </div>
        {buka && (
          <div className="py-3">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pemeriksaan Kelayakan Otomatis</dt>
            <dd className="mt-2 space-y-1.5">{cek.map((c) => <p key={c.teks} className={`flex items-start gap-2 text-xs font-medium ${c.ok ? "text-emerald-700" : "text-red-600"}`}>{c.ok ? <CircleCheck size={15} className="mt-0.5 shrink-0" /> : <CircleAlert size={15} className="mt-0.5 shrink-0" />} {c.teks}</p>)}</dd>
          </div>
        )}
      </dl>

      {buka ? (
        <div className="border-t border-pale pt-4">
          <label htmlFor="catatan" className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Catatan Persetujuan atau Penolakan</label>
          <textarea id="catatan" rows={3} value={catatan} onChange={(e) => { setCatatan(e.target.value); setGalat(""); }} placeholder="Tulis catatan dispensasi, arahan teknis lab, atau alasan penolakan bila ditolak…" className={`mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:bg-white ${galat ? "border-red-300 bg-red-50/50" : "border-transparent bg-pale/60 focus:border-sky"}`} />
          {galat && <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5 shrink-0" /> {galat}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setujui(t, catatan)} className="flex items-center justify-center gap-2 rounded-xl bg-sun py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5"><Check size={17} /> Setujui</button>
            <button type="button" onClick={() => (catatan.trim().length < 5 ? setGalat("Alasan penolakan wajib diisi (minimal 5 karakter) agar penyewa mengetahui penyebabnya.") : tolak(t, catatan))} className="flex items-center justify-center gap-2 rounded-xl border border-red-300 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"><X size={17} /> Tolak</button>
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">Persetujuan mengunci jadwal aset. Penyewa wajib membayar dalam 24 jam setelah persetujuan atau paling lambat H-1, mana yang lebih awal.</p>
        </div>
      ) : (
        <div className="border-t border-pale pt-4"><StatusTrx status={t.status} />{t.catatanAdmin && <p className="mt-3 flex gap-2 rounded-xl bg-soft p-3 text-xs text-ink"><Info size={14} className="mt-0.5 shrink-0 text-sky" /> {t.catatanAdmin}</p>}</div>
      )}
    </Kartu>
  );
}

export default function Persetujuan({ kodeAwal }) {
  const { siap, items } = useSemuaTransaksi();
  const [draft, setDraft] = useState(AWAL);
  const [f, setF] = useState(AWAL);
  const [pilih, setPilih] = useState(kodeAwal ?? "");

  const hasil = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return items
      .filter((t) => ["diajukan", "disetujui", "ditolak"].includes(t.status) || f.status === "semua")
      .filter((t) => (f.status === "semua" || t.status === f.status) && (f.kategori === "semua" || t.kategori === f.kategori) && (!f.bulan || t.tanggalMulai.startsWith(f.bulan)) && (!q || `${t.kode} ${penyewaTeks(t)} ${asetTeks(t)}`.toLowerCase().includes(q)))
      .sort((a, b) => a.dibuat - b.dibuat);
  }, [items, f]);

  if (!siap) return null;
  const terpilih = hasil.find((t) => t.kode === pilih) ?? hasil[0];
  const antre = items.filter((t) => t.status === "diajukan").length;
  const idx = terpilih ? hasil.indexOf(terpilih) + 1 : 0;
  const sel = "w-full appearance-none rounded-lg bg-pale/70 px-4 py-2.5 pr-9 text-sm font-medium text-navy outline-none focus:ring-2 focus:ring-sky/40";

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Persetujuan Pengajuan" sub="Verifikasi kelayakan peminjaman fasilitas dan peralatan FMIPA UNNES." />
      <Kartu className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); setF(draft); }} className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr]">
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Cari Transaksi
            <span className="relative mt-1.5 block"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky" /><input value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Cari nomor transaksi atau penyewa…" className="w-full rounded-lg bg-pale/70 py-2.5 pl-10 pr-3 text-sm font-medium normal-case text-navy outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky/40" /></span>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Status
            <span className="relative mt-1.5 block"><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className={sel}><option value="diajukan">Diajukan</option><option value="disetujui">Disetujui</option><option value="ditolak">Ditolak</option><option value="semua">Semua Status</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky" /></span>
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Kategori
            <span className="relative mt-1.5 block"><select value={draft.kategori} onChange={(e) => setDraft({ ...draft, kategori: e.target.value })} className={sel}><option value="semua">Semua Kategori</option><option value="ruangan">Fasilitas dan Ruangan</option><option value="peralatan">Peralatan dan Perlengkapan</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky" /></span>
          </label>
          <div className="flex flex-wrap items-end gap-3 md:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Rentang Tanggal (bulan)
              <span className="relative mt-1.5 block w-56"><CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky" /><input type="month" value={draft.bulan} onChange={(e) => setDraft({ ...draft, bulan: e.target.value })} className="w-full rounded-lg bg-pale/70 py-2.5 pl-10 pr-3 text-sm font-medium text-navy outline-none focus:ring-2 focus:ring-sky/40" /></span>
            </label>
            <button type="submit" className="rounded-lg bg-sun px-6 py-2.5 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5">Terapkan</button>
            <button type="button" onClick={() => { setDraft(AWAL); setF(AWAL); }} className="px-2 py-2.5 text-sm font-semibold text-sky hover:underline">Atur Ulang</button>
          </div>
        </form>
      </Kartu>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Kartu className="p-6">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Inbox size={18} className="text-sky" /> Daftar Pengajuan Masuk</h2><span className="text-xs font-semibold text-slate-500">{antre} antrean verifikasi</span></div>
          {hasil.length === 0 ? (
            <p className="mt-6 rounded-xl bg-soft p-8 text-center text-sm text-slate-500">Tidak ada pengajuan yang sesuai dengan filter.</p>
          ) : (
            <div className="relative mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">No. Transaksi</th><th className="px-3 py-3">Penyewa</th><th className="px-3 py-3">Aset</th><th className="px-3 py-3">Tanggal Pakai</th><th className="rounded-r-lg px-3 py-3">Status</th></tr></thead>
                <tbody>
                  {hasil.map((t) => {
                    const on = terpilih?.kode === t.kode;
                    return (
                      <tr key={t.kode} onClick={() => setPilih(t.kode)} className={`cursor-pointer border-b border-pale/70 transition ${on ? "bg-pale/70 shadow-[inset_4px_0_0_var(--color-sun)]" : "hover:bg-soft/70"}`}>
                        <td className="px-3 py-4 font-bold text-navy"><button type="button" onClick={() => setPilih(t.kode)} className="text-left">{t.kode}</button></td>
                        <td className="px-3 py-4"><span className="block font-semibold text-navy">{penyewaTeks(t)}</span><span className="text-xs text-slate-500">{penyewaUnit(t)}</span></td>
                        <td className="px-3 py-4 text-ink"><span className="block font-semibold">{t.asetNama}</span><span className="text-xs text-slate-500">{t.kategori === "ruangan" ? getAset(t.asetSlug)?.lokasi : `${t.jumlah} unit`}</span></td>
                        <td className="px-3 py-4 text-xs text-ink">{periodeTeks(t)}</td>
                        <td className="px-3 py-4"><StatusTrx status={t.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">Menampilkan {hasil.length} pengajuan</p>
        </Kartu>
        <AnimatePresence mode="wait">
          {terpilih ? (
            <motion.div key={terpilih.kode + terpilih.status} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><Detail t={terpilih} semua={items} indeks={idx} /></motion.div>
          ) : (
            <Kartu className="p-8 text-center text-sm text-slate-500">Pilih pengajuan untuk melihat detail.</Kartu>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
