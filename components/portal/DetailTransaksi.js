"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Check, Circle, Dot, FlaskConical, Boxes, Wallet, Timer, Copy, Send, ShieldAlert, XCircle, FolderOpen, Eye, FileText, IdCard,
  Info, Calculator, CircleCheck, CircleAlert, FileX2, X, History, KeyRound, PackageCheck, BadgeCheck, Clock3, Gavel,
} from "lucide-react";
import { Kartu, StatusTrx, StatusBayar, Remah, useSisaWaktu } from "./ui";
import UploadBox from "./UploadBox";
import AsetImage from "@/components/AsetImage";
import { getAset, rupiah } from "@/lib/data";
import { HARI_PANJANG, fromISO } from "@/lib/waktu";
import { useSesi } from "@/lib/useClient";
import { useTransaksi, ubahTransaksi, hitungRefund, totalDenda, rumusBiaya, satuanTeks, fmtJam, fmtTgl, fmtWaktu, LANGKAH_ALUR, STATUS_TRX } from "@/lib/transaksi";

const BASE = "/dashboard/penyewa";
const REKENING = { nomor: "1370 0192 8472 001", bank: "Bank Mandiri a.n. FMIPA UNNES" };
const IKON_LANGKAH = { diajukan: Send, disetujui: BadgeCheck, sedang_disewa: KeyRound, dikembalikan: PackageCheck, selesai: CircleCheck };

function Stepper({ t }) {
  const gagal = ["ditolak", "dibatalkan"].includes(t.status);
  const langkah = gagal
    ? t.riwayat.map((r) => ({ k: r.s, l: STATUS_TRX[r.s].label, w: r.w }))
    : LANGKAH_ALUR.map(([k, l]) => ({ k, l, w: t.riwayat.find((r) => r.s === k)?.w }));
  const idx = langkah.findIndex((x) => x.k === t.status);
  return (
    <Kartu className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><History size={18} className="text-sky" /> Alur Proses Peminjaman</h2>
        <span className="text-xs text-slate-500">{gagal ? STATUS_TRX[t.status].label : `Tahap ${idx + 1} dari ${langkah.length}`}</span>
      </div>
      <ol className="mt-7 grid" style={{ gridTemplateColumns: `repeat(${langkah.length}, minmax(0, 1fr))` }}>
        {langkah.map((s, i) => {
          const selesai = i < idx || (i === idx && ["selesai", "ditolak", "dibatalkan"].includes(t.status));
          const sekarang = i === idx && !selesai;
          const Icon = IKON_LANGKAH[s.k] ?? Circle;
          const buruk = gagal && i === idx;
          return (
            <li key={s.k} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={`absolute right-1/2 top-[18px] h-0.5 w-full ${i <= idx ? (buruk ? "bg-red-300" : "bg-emerald-500") : "bg-pale"}`} aria-hidden />}
              <span className={`relative z-10 flex size-9 items-center justify-center rounded-full ${buruk ? "bg-red-500 text-white" : selesai ? "bg-emerald-500 text-white" : sekarang ? "bg-sun text-navy ring-4 ring-sun/30" : "bg-pale text-sky"}`}>
                {buruk ? <X size={18} /> : selesai ? <Check size={18} /> : sekarang ? <Dot size={34} strokeWidth={6} /> : <Icon size={16} />}
              </span>
              <span className={`mt-2.5 text-xs font-bold sm:text-sm ${selesai || sekarang ? "text-navy" : "text-slate-400"}`}>{s.l}</span>
              <span className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">{s.w ? fmtWaktu(s.w) : "Mendatang"}</span>
            </li>
          );
        })}
      </ol>
    </Kartu>
  );
}

function PanelBayar({ t }) {
  const [bukti, setBukti] = useState(null);
  const [tersalin, setTersalin] = useState(false);
  const sisa = useSisaWaktu(t.batasBayar);

  const salin = async () => {
    try { await navigator.clipboard.writeText(REKENING.nomor.replaceAll(" ", "")); } catch {}
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2000);
  };
  const kirim = () => ubahTransaksi(t.kode, { pembayaran: "menunggu_verifikasi", buktiBayar: { ...bukti, waktu: Date.now() }, alasanBukti: null });

  const kepala = (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Wallet size={18} className="text-sky" /> Pembayaran</h2>
      <StatusBayar status={t.pembayaran} />
    </div>
  );

  if (t.status === "diajukan")
    return <Kartu className="p-6">{kepala}<p className="mt-4 flex gap-2.5 rounded-xl bg-soft p-4 text-sm leading-relaxed text-ink"><Clock3 size={17} className="mt-0.5 shrink-0 text-orange-500" /> Pengajuan Anda sedang ditinjau admin. Pembayaran dilakukan setelah pengajuan disetujui.</p><p className="mt-4 text-xs text-slate-500">Estimasi tagihan</p><p className="text-3xl font-extrabold text-navy">{rupiah(t.total)}</p></Kartu>;

  if (t.status === "ditolak")
    return <Kartu className="p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Wallet size={18} className="text-sky" /> Pembayaran</h2><p className="mt-4 flex gap-2.5 rounded-xl bg-red-50 p-4 text-sm text-red-700"><FileX2 size={17} className="mt-0.5 shrink-0" /> Pengajuan ditolak sehingga tidak ada tagihan yang perlu dibayar.</p></Kartu>;

  if (t.status === "dibatalkan")
    return (
      <Kartu className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Wallet size={18} className="text-sky" /> Pembayaran</h2>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-ink">
          <p className="font-semibold text-navy">Transaksi dibatalkan</p>
          {t.refund ? <p className="mt-1.5">Refund <b>{t.refund.persen}%</b> ({rupiah(t.refund.nominal)}) akan diproses admin. {t.refund.ket}</p> : <p className="mt-1.5">{t.catatanAdmin ?? "Tidak ada dana yang perlu dikembalikan."}</p>}
        </div>
      </Kartu>
    );

  if (t.pembayaran === "lunas")
    return (
      <Kartu className="p-6">
        {kepala}
        <p className="mt-4 text-xs text-slate-500">Total dibayar</p><p className="text-3xl font-extrabold text-navy">{rupiah(t.total)}</p>
        <p className="mt-4 flex gap-2.5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CircleCheck size={17} className="mt-0.5 shrink-0" /> Pembayaran telah diverifikasi admin.</p>
        {t.buktiBayar && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><FileText size={14} /> {t.buktiBayar.nama}</p>}
      </Kartu>
    );

  if (t.pembayaran === "menunggu_verifikasi")
    return (
      <Kartu className="p-6">
        {kepala}
        <p className="mt-4 text-xs text-slate-500">Total tagihan</p><p className="text-3xl font-extrabold text-navy">{rupiah(t.total)}</p>
        <p className="mt-4 flex gap-2.5 rounded-xl bg-pale/70 p-4 text-sm leading-relaxed text-sky"><Clock3 size={17} className="mt-0.5 shrink-0" /> Bukti pembayaran telah dikirim dan sedang diverifikasi admin. Anda akan melihat perubahan status di halaman ini.</p>
        {t.buktiBayar && <div className="mt-4 flex items-center gap-3 rounded-xl bg-soft px-4 py-3"><FileText size={18} className="text-sky" /><div><p className="text-sm font-bold text-navy">{t.buktiBayar.nama}</p><p className="text-xs text-slate-500">{t.buktiBayar.ukuran} · dikirim {fmtWaktu(t.buktiBayar.waktu)}</p></div></div>}
      </Kartu>
    );

  // belum_dibayar / bukti_ditolak
  return (
    <Kartu className="p-6">
      {kepala}
      <p className="mt-5 text-xs text-slate-500">Total Tagihan Yang Harus Dibayar</p>
      <p className="text-4xl font-extrabold tracking-tight text-navy">{rupiah(t.total)}</p>
      {t.pembayaran === "bukti_ditolak" && <p role="alert" className="mt-4 flex gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs leading-relaxed text-red-700"><CircleAlert size={15} className="mt-0.5 shrink-0" /> Bukti sebelumnya ditolak: {t.alasanBukti ?? "bukti tidak valid"}. Silakan unggah ulang.</p>}
      <div className="mt-4 flex gap-3 rounded-xl border-l-4 border-sun bg-orange-50/60 p-4">
        <Timer size={20} className="mt-0.5 shrink-0 text-orange-500" />
        <div className="text-xs leading-relaxed text-ink">
          <p className="text-sm font-bold text-navy">Batas Waktu Pembayaran</p>
          {t.batasBayar && <p className="mt-1">Bayar sebelum <b>{new Date(t.batasBayar).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} WIB</b>. {sisa && (sisa.lewat ? <b className="text-red-600">Waktu pembayaran telah habis.</b> : <>Sisa waktu <b className="text-orange-600">{sisa.teks}</b>.</>)}</p>}
          <p className="mt-1 text-slate-500">Transaksi dibatalkan otomatis bila batas waktu terlewat.</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-soft p-4">
        <p className="text-xs text-slate-500">Rekening Pembayaran Resmi Fakultas</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div><p className="text-xl font-extrabold tracking-wide text-navy">{REKENING.nomor}</p><p className="text-xs text-ink">{REKENING.bank}</p></div>
          <button type="button" onClick={salin} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-pale px-3 py-2 text-xs font-bold text-navy transition hover:bg-sky hover:text-white">{tersalin ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin</>}</button>
        </div>
      </div>
      <p className="mb-2 mt-5 text-sm font-bold text-navy">Bukti Transfer Pembayaran</p>
      <UploadBox id="up-bukti" ikon={Wallet} judul="Unggah Bukti Pembayaran" keterangan="Tarik dan lepas berkas ke sini atau klik untuk memilih. Format: JPG, PNG, atau PDF (maks. 5 MB)" nilai={bukti} onChange={setBukti} />
      <button type="button" disabled={!bukti || (sisa?.lewat ?? false)} onClick={kirim} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sun py-3.5 text-sm font-bold text-navy shadow-md transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
        <Send size={16} /> Kirim Bukti Pembayaran
      </button>
    </Kartu>
  );
}

function ModalBatal({ t, tutup }) {
  const [alasan, setAlasan] = useState("");
  const [rf] = useState(() => hitungRefund(t));
  useEffect(() => {
    const k = (e) => e.key === "Escape" && tutup();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [tutup]);
  const yakin = () => {
    ubahTransaksi(t.kode, { refund: rf, alasanBatal: alasan.trim() || null, catatanAdmin: "Dibatalkan oleh penyewa." }, "dibatalkan");
    tutup();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/60 p-4" onClick={tutup}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="judul-batal" initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-pop">
        <span className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600"><ShieldAlert size={26} /></span>
        <h2 id="judul-batal" className="mt-4 text-xl font-extrabold text-navy">Konfirmasi Pembatalan</h2>
        <p className="mt-2 text-sm text-ink">Anda akan membatalkan transaksi <b>{t.kode}</b>. Tindakan ini tidak dapat diurungkan.</p>
        <div className="mt-4 rounded-xl bg-soft p-4 text-sm">
          <p className="font-bold text-navy">Perkiraan pengembalian dana</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{rupiah(rf.nominal)} <span className="text-sm font-semibold text-slate-500">({rf.persen}%)</span></p>
          <p className="mt-1 text-xs text-slate-600">{rf.ket}</p>
        </div>
        <label htmlFor="alasan" className="mb-1.5 mt-4 block text-sm font-bold text-navy">Alasan pembatalan <span className="font-normal text-slate-500">(opsional)</span></label>
        <textarea id="alasan" rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)} className="w-full resize-none rounded-xl border border-pale bg-field px-4 py-3 text-sm outline-none focus:border-sky" />
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={tutup} className="flex-1 rounded-xl border border-sky py-3 text-sm font-bold text-sky transition hover:bg-pale">Kembali</button>
          <button type="button" onClick={yakin} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700">Ya, Batalkan</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KartuDenda({ t }) {
  const d = t.denda;
  if (!d) return null;
  const total = totalDenda(t);
  return (
    <Kartu className="p-6">
      <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Gavel size={18} className="text-sky" /> Denda</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${d.statusBayar === "lunas" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-600"}`}>{d.statusBayar === "lunas" ? "Lunas" : "Belum Dibayar"}</span></div>
      <dl className="mt-4 space-y-3 text-sm">
        {d.keterlambatan > 0 && <div><dt className="flex justify-between"><span className="text-slate-500">Keterlambatan</span><b className="text-navy">{rupiah(d.keterlambatan)}</b></dt><dd className="mt-0.5 text-xs text-slate-500">{d.ketTelat}</dd></div>}
        {d.kerusakan > 0 && <div><dt className="flex justify-between"><span className="text-slate-500">Kerusakan / kehilangan</span><b className="text-navy">{d.konfirmasi === "menunggu" ? "Menunggu konfirmasi" : rupiah(d.kerusakan)}</b></dt>{d.kerusakanKet && <dd className="mt-0.5 text-xs text-slate-500">{d.kerusakanKet}</dd>}</div>}
        <div className="flex items-center justify-between border-t border-pale pt-3"><dt className="font-bold text-navy">Total Denda</dt><dd className="text-xl font-extrabold text-navy">{rupiah(total)}</dd></div>
      </dl>
      {d.statusBayar !== "lunas" && <p className="mt-3 flex gap-2 rounded-xl bg-soft p-3 text-xs leading-relaxed text-slate-600"><Info size={14} className="mt-0.5 shrink-0 text-sky" /> Pelunasan denda dicatat oleh admin FMIPA. Hubungi admin setelah melakukan pembayaran.</p>}
    </Kartu>
  );
}

export default function DetailTransaksi({ kode, baru }) {
  const sesi = useSesi();
  const { siap, items } = useTransaksi(sesi?.email);
  const [batal, setBatal] = useState(false);
  const [lihat, setLihat] = useState(null);
  if (!siap) return null;

  const t = items.find((x) => x.kode === kode);
  if (!t)
    return (
      <Kartu className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-pale text-sky"><FileX2 size={30} /></span>
        <h1 className="mt-5 text-xl font-bold text-navy">Transaksi tidak ditemukan</h1>
        <p className="mt-2 text-sm text-ink">Transaksi {kode} tidak ada atau bukan milik akun Anda.</p>
        <Link href={`${BASE}/transaksi`} className="mt-6 rounded-xl bg-sun px-6 py-3 text-sm font-bold text-navy shadow-md">Kembali ke Transaksi Saya</Link>
      </Kartu>
    );

  const aset = getAset(t.asetSlug);
  const d = fromISO(t.tanggalMulai);
  const tglTeks = `${HARI_PANJANG[d.getDay()]}, ${fmtTgl(t.tanggalMulai)}`;
  const jamTeks = t.satuan === "jam" ? `${fmtJam(t.jamMulai)} – ${fmtJam(t.jamSelesai)} WIB (${t.durasi} Jam)` : t.tanggalSelesai !== t.tanggalMulai ? `s.d. ${fmtTgl(t.tanggalSelesai)} (${t.durasi} hari)` : null;
  const boleh = ["diajukan", "disetujui"].includes(t.status);
  const Ikon = t.kategori === "ruangan" ? FlaskConical : Boxes;

  return (
    <div className="space-y-6">
      <Remah items={[{ label: "Transaksi Saya", href: `${BASE}/transaksi` }, { label: "Detail Transaksi" }]} />
      <Link href={`${BASE}/transaksi`} className="inline-flex items-center gap-2 text-sm font-semibold text-sky hover:underline"><ArrowLeft size={16} /> Kembali ke Transaksi Saya</Link>

      {baru && t.status === "diajukan" && <p role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CircleCheck size={18} className="mt-0.5 shrink-0" /> Pengajuan berhasil dikirim. Admin akan meninjau dokumen dan ketersediaan jadwal Anda.</p>}
      {t.status === "dibatalkan" && <p role="status" className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"><XCircle size={18} className="mt-0.5 shrink-0" /> Transaksi ini telah dibatalkan. {t.catatanAdmin}</p>}
      {t.status === "ditolak" && <p role="status" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><XCircle size={18} className="mt-0.5 shrink-0" /> Pengajuan ditolak. {t.catatanAdmin}</p>}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy md:text-4xl">{t.kode}</h1>
          <span className="mt-3 block h-1 w-12 rounded-full bg-sun" />
          <p className="mt-3 text-sm text-ink">{aset?.nama2 ?? t.asetNama} {aset ? "FMIPA UNNES" : ""}</p>
        </div>
        <Kartu className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-xs text-slate-500">
          <span className="flex items-center gap-2">Status Transaksi: <StatusTrx status={t.status} /></span>
          <span className="flex items-center gap-2">Status Pembayaran: <StatusBayar status={t.pembayaran} /></span>
        </Kartu>
      </div>

      <Stepper t={t} />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Kartu className="p-6">
            <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Ikon size={18} className="text-sky" /> Informasi Sewa</h2><span className="text-xs text-slate-500">ID Aset: {t.kodeAset}</span></div>
            {aset && (
              <div className="relative mt-4 h-44 overflow-hidden rounded-xl">
                <AsetImage aset={aset} iconSize={56} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-4 text-white"><p className="font-bold">{aset.nama2 ?? aset.nama}</p><p className="text-xs text-white/80">Fakultas Matematika dan Ilmu Pengetahuan Alam UNNES</p></div>
              </div>
            )}
            <dl className="mt-5 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Nama Aset</dt><dd className="font-bold text-navy">{aset?.nama2 ?? t.asetNama}, {t.kodeAset}</dd></div>
              <div><dt className="text-xs text-slate-500">Periode Penggunaan</dt><dd className="font-bold text-navy">{tglTeks}</dd>{jamTeks && <dd className="text-xs text-slate-500">{jamTeks}</dd>}</div>
              <div><dt className="text-xs text-slate-500">Satuan Sewa</dt><dd className="font-bold text-navy">{satuanTeks(t)}</dd></div>
              <div><dt className="text-xs text-slate-500">Jumlah Unit</dt><dd className="font-bold text-navy">{t.kategori === "ruangan" ? "1 Ruangan Lengkap" : `${t.jumlah} ${aset?.stokSatuan ?? "unit"}`}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Tujuan Kegiatan</dt><dd className="mt-0.5 text-ink">{t.tujuan}</dd></div>
            </dl>
            {t.catatanAdmin && t.status !== "dibatalkan" && t.status !== "ditolak" && (
              <p className="mt-5 flex gap-3 rounded-xl bg-pale/60 p-4 text-sm leading-relaxed text-ink"><Info size={17} className="mt-0.5 shrink-0 text-sky" /> <span><b className="text-navy">Catatan Pengelola / Admin:</b><br />{t.catatanAdmin}</span></p>
            )}
          </Kartu>

          <Kartu className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><Calculator size={18} className="text-sky" /> Rincian Biaya</h2>
            <div className="mt-4 rounded-xl bg-soft p-5">
              <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-slate-600">Perhitungan Satuan:</span><b className="text-navy">{rumusBiaya(t)}</b></div>
              <div className="mt-4 flex items-center justify-between border-t border-pale pt-4"><span className="font-bold text-navy">Total Biaya</span><span className="text-2xl font-extrabold text-navy">Total {rupiah(t.total)}</span></div>
            </div>
            <p className="mt-3 flex gap-2 text-xs text-slate-500"><Info size={13} className="mt-0.5 shrink-0" /> Tarif mengikuti saat pengajuan dan tidak berubah bila tarif diperbarui oleh universitas.</p>
          </Kartu>

          <Kartu className="p-6">
            <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-navy"><FolderOpen size={18} className="text-sky" /> Dokumen Pendukung</h2><span className="text-xs text-slate-500">{t.dokumen.length} Berkas Terverifikasi</span></div>
            <ul className="mt-4 space-y-3">
              {t.dokumen.map((dk) => (
                <li key={dk.jenis} className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky">{dk.jenis.startsWith("Identitas") ? <IdCard size={18} /> : <FileText size={18} />}</span><div className="min-w-0"><p className="text-sm font-bold text-navy">{dk.jenis}</p><p className="truncate text-xs text-slate-500">{dk.nama} · {dk.ukuran}</p></div></div>
                  <button type="button" onClick={() => setLihat(dk)} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-sky hover:underline"><Eye size={15} /> Lihat</button>
                </li>
              ))}
            </ul>
          </Kartu>
        </div>

        <div className="space-y-6">
          <PanelBayar key={`${t.pembayaran}-${t.status}`} t={t} />
          <KartuDenda t={t} />
          {boleh && (
            <Kartu className="p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-navy"><ShieldAlert size={18} className="text-sky" /> Ketentuan Pembatalan</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink">Ketentuan pengembalian dana setelah pembayaran: <b>100%</b> bila dibatalkan H-3 atau lebih awal, <b>50%</b> pada rentang H-2 sampai H-1, dan <b>0%</b> bila kurang dari H-1 atau peminjam tidak hadir.</p>
              <button type="button" onClick={() => setBatal(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"><XCircle size={16} /> Batalkan Pengajuan</button>
            </Kartu>
          )}
        </div>
      </div>

      <AnimatePresence>{batal && <ModalBatal t={t} tutup={() => setBatal(false)} />}</AnimatePresence>
      <AnimatePresence>
        {lihat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/60 p-4" onClick={() => setLihat(null)}>
            <motion.div role="dialog" aria-modal="true" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-pop">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-pale text-sky"><FileText size={26} /></span>
              <p className="mt-4 font-bold text-navy">{lihat.jenis}</p>
              <p className="mt-1 break-all text-sm text-ink">{lihat.nama}</p>
              <p className="mt-3 text-xs text-slate-500">Pratinjau berkas akan tersedia setelah terhubung ke Supabase Storage.</p>
              <button type="button" onClick={() => setLihat(null)} className="mt-5 w-full rounded-xl bg-sun py-2.5 text-sm font-bold text-navy">Tutup</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
