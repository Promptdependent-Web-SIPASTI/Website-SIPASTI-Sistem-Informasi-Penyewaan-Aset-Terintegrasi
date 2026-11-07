"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CalendarDays, ChevronDown, Landmark, ZoomIn, BadgeCheck, X, CircleCheck, CircleAlert, ShieldAlert } from "lucide-react";
import { Kartu, JudulHalaman, StatusBayar } from "../ui";
import { useSemuaTransaksi, asetTeks, penyewaTeks, TIPE_LABEL, rumusBiaya, fmtWaktu, fmtTgl, fmtJam, periodeTeks } from "@/lib/transaksi";
import { verifikasiLunas, tolakBukti } from "@/lib/aksi";
import { getAset, rupiah } from "@/lib/data";
import { HARI_PANJANG, fromISO } from "@/lib/waktu";

const AWAL = { q: "", status: "semua", bulan: "" };
const REK = "Bank Mandiri 1370019284720";

function Struk({ t, besar = false }) {
  const b = t.buktiBayar;
  const w = new Date(b?.waktu ?? t.dibuat);
  const p = (n) => String(n).padStart(2, "0");
  const ref = `TRX-${w.getFullYear()}${p(w.getMonth() + 1)}${p(w.getDate())}-${t.kode.slice(-4)}${Math.abs(t.kode.charCodeAt(5) * 37) % 900 + 100}`;
  const baris = [
    ["No. Referensi", ref], ["Rekening Tujuan", `${REK} a.n. FMIPA UNNES`], ["Nama Pengirim", penyewaTeks(t).toUpperCase()],
    ["Jumlah Transfer", `${rupiah(t.total)},00`], ["Berita", `Sewa ${t.asetNama} ${t.kode}`],
  ];
  return (
    <div className={`rounded-xl bg-white shadow-sm ring-1 ring-pale ${besar ? "p-7" : "p-4"}`}>
      <div className="flex justify-center"><span className="flex size-9 items-center justify-center rounded-full bg-pale text-sky"><Landmark size={18} /></span></div>
      <p className="mt-2 text-center text-[11px] font-extrabold tracking-wider text-navy">BUKTI TRANSFER ELEKTRONIK (M-BANKING)</p>
      <p className="text-center text-[10px] text-slate-500">{w.getDate()}/{p(w.getMonth() + 1)}/{w.getFullYear()} · {p(w.getHours())}:{p(w.getMinutes())}:19 WIB</p>
      <dl className={`mt-3 space-y-1.5 ${besar ? "text-sm" : "text-[11px]"}`}>
        {baris.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-bold text-navy">{v}</dd></div>)}
        <div className="flex justify-between gap-3 border-t border-pale pt-1.5"><dt className="text-slate-500">Status Transfer</dt><dd className="flex items-center gap-1 font-bold text-emerald-600"><CircleCheck size={12} /> BERHASIL / SUKSES</dd></div>
      </dl>
      {b && <p className="mt-3 text-center text-[10px] text-slate-400">Pratinjau simulasi dari berkas {b.nama}</p>}
    </div>
  );
}

function Detail({ t, aksiTolak }) {
  const aset = getAset(t.asetSlug);
  const [besar, setBesar] = useState(false);
  const tepat = t.buktiBayar && t.batasBayar ? t.buktiBayar.waktu <= t.batasBayar : true;
  const menunggu = t.pembayaran === "menunggu_verifikasi";
  const hari = HARI_PANJANG[fromISO(t.tanggalMulai).getDay()];
  const baris = [
    ["Penyewa", <span key="p" className="block text-right"><b className="text-navy">{penyewaTeks(t)}</b><span className="block text-xs text-slate-500">{TIPE_LABEL[t.penyewa?.tipe]} {t.penyewa?.idn ? `(${t.penyewa.tipe === "mahasiswa" ? "NIM" : "NIP"} ${t.penyewa.idn})` : ""}</span></span>],
    ["Aset", <b key="a" className="block text-right text-navy">{aset?.nama2 ?? t.asetNama}</b>],
    ["Jadwal", <span key="j" className="block text-right"><b className="text-navy">{hari}, {fmtTgl(t.tanggalMulai)}</b>{t.satuan === "jam" && <span className="block text-xs text-slate-500">{fmtJam(t.jamMulai)}–{fmtJam(t.jamSelesai)} WIB</span>}</span>],
    ["Rincian Tarif", <b key="r" className="block text-right text-navy">{rumusBiaya(t)}</b>],
  ];
  return (
    <Kartu className="p-6 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Rincian Transaksi</p><h2 className="text-xl font-extrabold text-navy">{t.kode}</h2></div>
        <StatusBayar status={t.pembayaran} />
      </div>
      <dl className="mt-4 divide-y divide-pale text-sm">
        {baris.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="shrink-0 text-slate-500">{k}</dt><dd>{v}</dd></div>)}
        <div className="flex justify-between gap-4 py-3"><dt className="font-bold text-navy">Total Tagihan</dt><dd className="font-extrabold text-navy">{rupiah(t.total)}</dd></div>
        {t.batasBayar && <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">Batas Bayar</dt><dd className="text-right font-bold text-navy">{fmtWaktu(t.batasBayar)} WIB</dd></div>}
        {t.buktiBayar && (
          <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">Waktu Diunggah</dt><dd className="text-right"><b className="text-navy">{fmtWaktu(t.buktiBayar.waktu)} WIB</b><span className={`mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold ${tepat ? "text-emerald-600" : "text-red-600"}`}>{tepat ? <CircleCheck size={13} /> : <CircleAlert size={13} />} {tepat ? "Diunggah sebelum batas waktu" : "Diunggah setelah batas waktu"}</span></dd></div>
        )}
      </dl>

      {t.buktiBayar ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-wide text-navy">Bukti Pembayaran</p><span className="text-xs font-semibold text-sky">Format Digital</span></div>
          <div className="rounded-xl bg-pale/50 p-3"><Struk t={t} /></div>
          <button type="button" onClick={() => setBesar(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sky py-2 text-sm font-bold text-sky transition hover:bg-sky hover:text-white"><ZoomIn size={15} /> Buka Ukuran Penuh</button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-soft p-4 text-sm text-slate-500">Penyewa belum mengunggah bukti pembayaran.</p>
      )}

      {menunggu ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => verifikasiLunas(t)} className="flex items-center justify-center gap-2 rounded-xl bg-sun py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5"><BadgeCheck size={17} /> Tandai Lunas</button>
            <button type="button" onClick={aksiTolak} className="flex items-center justify-center gap-2 rounded-xl border border-red-300 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"><X size={17} /> Tolak Bukti</button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Pastikan nominal pada bukti sesuai {rupiah(t.total)}. Setelah Lunas, petugas dapat mencatat serah terima fasilitas.</p>
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-soft p-3 text-center text-xs text-slate-500">{t.pembayaran === "lunas" ? "Pembayaran telah ditandai lunas." : t.pembayaran === "bukti_ditolak" ? `Bukti ditolak: ${t.alasanBukti}` : "Belum ada tindakan verifikasi yang diperlukan."}</p>
      )}

      <AnimatePresence>
        {besar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/70 p-4" onClick={() => setBesar(false)}>
            <motion.div role="dialog" aria-modal="true" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
              <Struk t={t} besar />
              <button type="button" onClick={() => setBesar(false)} className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-navy">Tutup</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Kartu>
  );
}

function DialogTolak({ t, tutup }) {
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState("");
  const kirim = () => {
    if (alasan.trim().length < 5) return setGalat("Alasan penolakan wajib diisi (minimal 5 karakter).");
    tolakBukti(t, alasan);
    tutup();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/60 p-4" onClick={tutup}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="jt" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-pop">
        <span className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600"><ShieldAlert size={26} /></span>
        <h2 id="jt" className="mt-4 text-xl font-extrabold text-navy">Tolak Bukti Pembayaran</h2>
        <p className="mt-2 text-sm text-ink">Penyewa akan diminta mengunggah ulang bukti untuk transaksi <b>{t.kode}</b>. Jelaskan alasan penolakan.</p>
        <textarea rows={3} value={alasan} onChange={(e) => { setAlasan(e.target.value); setGalat(""); }} placeholder="mis. Nominal pada bukti tidak sesuai dengan tagihan." className={`mt-4 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-sky ${galat ? "border-red-300" : "border-pale"}`} />
        {galat && <p role="alert" className="mt-1.5 flex gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5" /> {galat}</p>}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={tutup} className="flex-1 rounded-xl border border-sky py-3 text-sm font-bold text-sky hover:bg-pale">Batal</button>
          <button type="button" onClick={kirim} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-md hover:bg-red-700">Tolak Bukti</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Verifikasi() {
  const { siap, items } = useSemuaTransaksi();
  const [draft, setDraft] = useState(AWAL);
  const [f, setF] = useState(AWAL);
  const [pilih, setPilih] = useState("");
  const [dialog, setDialog] = useState(false);

  const bayar = useMemo(() => items.filter((t) => t.pembayaran !== "tidak_ada" && !["ditolak"].includes(t.status)), [items]);
  const hasil = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return bayar
      .filter((t) => (f.status === "semua" || t.pembayaran === f.status) && (!f.bulan || t.tanggalMulai.startsWith(f.bulan)) && (!q || `${t.kode} ${penyewaTeks(t)} ${asetTeks(t)}`.toLowerCase().includes(q)))
      .sort((a, b) => (a.pembayaran === "menunggu_verifikasi" ? -1 : 0) - (b.pembayaran === "menunggu_verifikasi" ? -1 : 0) || b.dibuat - a.dibuat);
  }, [bayar, f]);

  if (!siap) return null;
  const terpilih = hasil.find((t) => t.kode === pilih) ?? hasil[0];
  const menunggu = bayar.filter((t) => t.pembayaran === "menunggu_verifikasi").length;
  const sel = "w-full appearance-none rounded-lg bg-pale/70 px-4 py-2.5 pr-9 text-sm font-medium text-navy outline-none focus:ring-2 focus:ring-sky/40";

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Verifikasi Pembayaran" sub="Pemeriksaan dan validasi bukti transfer pembayaran sewa fasilitas FMIPA UNNES." />
      <Kartu className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); setF(draft); }} className="flex flex-wrap items-center gap-3">
          <span className="relative min-w-60 flex-1"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky" /><input aria-label="Cari" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Cari nomor transaksi atau penyewa" className="w-full rounded-lg bg-pale/70 py-2.5 pl-10 pr-3 text-sm font-medium text-navy outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky/40" /></span>
          <span className="relative w-52"><select aria-label="Status pembayaran" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className={sel}><option value="semua">Semua Pembayaran</option><option value="menunggu_verifikasi">Menunggu Verifikasi</option><option value="belum_dibayar">Belum Dibayar</option><option value="lunas">Lunas</option><option value="bukti_ditolak">Bukti Ditolak</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky" /></span>
          <span className="relative w-52"><CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky" /><input aria-label="Bulan" type="month" value={draft.bulan} onChange={(e) => setDraft({ ...draft, bulan: e.target.value })} className="w-full rounded-lg bg-pale/70 py-2.5 pl-10 pr-3 text-sm font-medium text-navy outline-none focus:ring-2 focus:ring-sky/40" /></span>
          <button type="submit" className="rounded-lg bg-sun px-6 py-2.5 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5">Terapkan</button>
          <button type="button" onClick={() => { setDraft(AWAL); setF(AWAL); }} className="px-2 text-sm font-semibold text-sky hover:underline">Atur Ulang</button>
        </form>
      </Kartu>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Kartu className="p-6">
          <div className="flex items-start justify-between"><div><h2 className="font-bold text-navy">Daftar Antrean Pembayaran</h2><p className="mt-1 text-xs text-slate-500">{menunggu} menunggu verifikasi</p></div><span className="text-xs text-slate-500">Total: {hasil.length} transaksi</span></div>
          {hasil.length === 0 ? <p className="mt-6 rounded-xl bg-soft p-8 text-center text-sm text-slate-500">Tidak ada transaksi pembayaran yang sesuai.</p> : (
            <div className="relative mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr className="bg-pale/70 text-xs font-bold uppercase tracking-wide text-navy"><th className="rounded-l-lg px-3 py-3">No. Transaksi</th><th className="px-3 py-3">Penyewa</th><th className="px-3 py-3">Aset</th><th className="px-3 py-3">Total Tagihan</th><th className="rounded-r-lg px-3 py-3">Status</th></tr></thead>
                <tbody>
                  {hasil.map((t) => {
                    const on = terpilih?.kode === t.kode;
                    return (
                      <tr key={t.kode} onClick={() => setPilih(t.kode)} className={`cursor-pointer border-b border-pale/70 transition ${on ? "bg-pale/70 shadow-[inset_4px_0_0_var(--color-sun)]" : "hover:bg-soft/70"}`}>
                        <td className="px-3 py-4 font-bold text-navy"><button type="button" onClick={() => setPilih(t.kode)}>{t.kode}</button></td>
                        <td className="px-3 py-4"><span className="block font-semibold text-navy">{penyewaTeks(t)}</span><span className="text-xs text-slate-500">{TIPE_LABEL[t.penyewa?.tipe]}</span></td>
                        <td className="px-3 py-4 text-ink">{asetTeks(t)}</td>
                        <td className="px-3 py-4 font-bold text-navy">{rupiah(t.total)}</td>
                        <td className="px-3 py-4"><StatusBayar status={t.pembayaran} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">Menampilkan {hasil.length} transaksi pembayaran</p>
        </Kartu>
        {terpilih ? <motion.div key={terpilih.kode + terpilih.pembayaran} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}><Detail t={terpilih} aksiTolak={() => setDialog(true)} /></motion.div> : <Kartu className="p-8 text-center text-sm text-slate-500">Pilih transaksi untuk melihat rincian.</Kartu>}
      </div>
      <AnimatePresence>{dialog && terpilih && <DialogTolak t={terpilih} tutup={() => setDialog(false)} />}</AnimatePresence>
    </div>
  );
}
