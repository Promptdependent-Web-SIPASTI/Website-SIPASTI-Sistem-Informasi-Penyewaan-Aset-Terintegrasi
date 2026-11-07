"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, ClipboardPlus, Info, Lock, ShieldCheck, AlarmClock, ListChecks, ClipboardList, Wrench, TriangleAlert, CircleCheck, CircleAlert, FileX2 } from "lucide-react";
import { Kartu, StatusTrx, StatusBayar } from "../ui";
import { useSemuaTransaksi, penyewaTeks, TIPE_LABEL, asetTeks, fmtWaktu, fmtJam, fmtTgl, batasKembaliMs, hitungDendaTelat, totalDenda, rumusBiaya } from "@/lib/transaksi";
import { catatSerahTerima, catatPengembalian } from "@/lib/aksi";
import { usePengaturan } from "@/lib/pengaturan";
import { useAsetList } from "@/lib/asetStore";
import { useSesi } from "@/lib/useClient";
import { rupiah } from "@/lib/data";
import { HARI_PANJANG, fromISO, sekarangLokalInput, dariLokalInput } from "@/lib/waktu";

const BASE = "/dashboard/petugas";
const lab = "mb-1.5 block text-sm font-semibold text-navy";
const fld = (bad, kunci) => `w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition ${kunci ? "cursor-not-allowed border-transparent bg-slate-100 text-slate-400" : bad ? "border-red-300 bg-red-50/50" : "border-transparent bg-pale/70 text-navy focus:border-sky focus:bg-white"}`;

function Baris({ k, v }) {
  return <div className="flex justify-between gap-6 border-b border-pale/70 py-3 text-sm last:border-0"><dt className="shrink-0 text-slate-500">{k}</dt><dd className="text-right font-bold text-navy">{v}</dd></div>;
}

function SerahTerima({ t, petugas }) {
  const lunas = t.pembayaran === "lunas";
  const kunci = t.status === "disetujui" && !lunas;
  const selesai = t.status !== "disetujui";
  const [jumlah, setJumlah] = useState(String(t.kategori === "peralatan" ? t.jumlah : 1));
  const [kondisi, setKondisi] = useState("Baik");
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState("");
  const hari = HARI_PANJANG[fromISO(t.tanggalMulai).getDay()];
  const target = t.kategori === "peralatan" ? t.jumlah : 1;

  function simpan(e) {
    e.preventDefault();
    if (Number(jumlah) !== target) return setGalat(`Jumlah diserahkan harus sesuai transaksi (${target}).`);
    catatSerahTerima(t, { jumlah: Number(jumlah), kondisi, catatan }, petugas);
  }

  return (
    <div className="space-y-6">
      {!selesai && (
        <p className={`flex gap-3 rounded-xl border-l-4 bg-white px-5 py-4 text-sm shadow-card ${lunas ? "border-emerald-500 text-emerald-800" : "border-orange-400 text-ink"}`}>
          {lunas ? <CircleCheck size={18} className="mt-0.5 shrink-0" /> : <Info size={18} className="mt-0.5 shrink-0 text-orange-500" />}
          {lunas ? "Pembayaran telah Lunas. Serah terima dapat dicatat." : "Serah terima hanya dapat dicatat untuk transaksi yang disetujui dan berstatus pembayaran Lunas."}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Kartu className="p-6 md:p-7">
          <h2 className="border-b border-pale pb-4 text-xl font-bold text-navy">Pencatatan Serah Terima</h2>
          <dl className="mt-2">
            <Baris k="Penyewa" v={`${penyewaTeks(t)}, ${TIPE_LABEL[t.penyewa?.tipe] ?? ""}`} />
            <Baris k="Aset" v={t.kategori === "ruangan" ? `${t.asetNama} (${t.kodeAset})` : `${t.asetNama} (${t.kodeAset})`} />
            <Baris k="Jadwal" v={`${hari}, ${fmtTgl(t.tanggalMulai)}${t.satuan === "jam" ? `, ${fmtJam(t.jamMulai)}–${fmtJam(t.jamSelesai)}` : ""}`} />
            <Baris k="Total Tarif" v={`${rupiah(t.total)} (${t.satuan === "jam" ? `${t.durasi} jam` : t.satuan === "hari" ? `${t.durasi} hari` : "1 kegiatan"})`} />
            {t.batasBayar && !lunas && <Baris k="Batas Pembayaran" v={<span className="text-orange-600">{fmtWaktu(t.batasBayar)} WIB</span>} />}
          </dl>

          {selesai && t.serahTerima ? (
            <div className="mt-5 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900">
              <p className="flex items-center gap-2 font-bold"><CircleCheck size={17} /> Serah terima telah dicatat</p>
              <p className="mt-2">Dicatat {fmtWaktu(t.serahTerima.waktu)} oleh {t.serahTerima.petugas}. Jumlah diserahkan: {t.serahTerima.jumlah}. Kondisi: {t.serahTerima.kondisi}.{t.serahTerima.catatan ? ` Catatan: ${t.serahTerima.catatan}` : ""}</p>
            </div>
          ) : selesai ? <p className="mt-5 rounded-xl bg-soft p-5 text-sm text-slate-500">Serah terima tidak dapat dicatat untuk transaksi berstatus {t.status}.</p> : (
            <form onSubmit={simpan} noValidate className="mt-5 border-t border-pale pt-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold text-navy">{kunci ? <Lock size={15} className="text-sky" /> : <ClipboardCheck size={15} className="text-sky" />} Formulir Penyerahan Lapangan</p>
              <div className="space-y-4">
                <div><label className={lab}>Waktu Serah Terima</label><input readOnly value="Otomatis saat disimpan" className={fld(false, true)} /></div>
                <div><label htmlFor="jml-st" className={lab}>Jumlah Diserahkan</label><input id="jml-st" inputMode="numeric" disabled={kunci} value={kunci ? (t.kategori === "ruangan" ? "1 Ruangan Lengkap" : jumlah) : jumlah} onChange={(e) => { setJumlah(e.target.value.replace(/\D/g, "")); setGalat(""); }} className={fld(galat, kunci)} />{galat && <p role="alert" className="mt-1.5 flex gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5" /> {galat}</p>}</div>
                <div><label htmlFor="kd-st" className={lab}>Kondisi Aset</label><select id="kd-st" disabled={kunci} value={kondisi} onChange={(e) => setKondisi(e.target.value)} className={fld(false, kunci)}><option>Baik</option><option>Rusak Ringan (dicatat sebelum dipakai)</option></select></div>
                <div><label htmlFor="ct-st" className={lab}>Catatan Serah Terima</label><textarea id="ct-st" rows={3} disabled={kunci} value={kunci ? "" : catatan} placeholder={kunci ? "Form terkunci hingga pembayaran divalidasi…" : "Catatan kelengkapan sarana, kunci, atau perlengkapan."} onChange={(e) => setCatatan(e.target.value)} className={`${fld(false, kunci)} resize-none`} /></div>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={kunci} className="rounded-xl bg-sun px-7 py-3 text-sm font-bold text-navy shadow-md transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">Simpan Serah Terima</button>
                <Link href={BASE} className="rounded-xl border border-sky px-6 py-3 text-sm font-bold text-sky transition hover:bg-pale">Kembali</Link>
              </div>
            </form>
          )}
        </Kartu>

        <div className="space-y-6">
          <Kartu className="p-6">
            <h2 className="text-lg font-bold leading-snug text-navy">Ketentuan Operasional Serah Terima</h2>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-ink">
              {[[ShieldCheck, "Validasi Pembayaran:", "Admin harus menandai bukti pembayaran Lunas sebelum serah terima kunci/fasilitas dilakukan."], [AlarmClock, "Waktu Pelaksanaan:", "Serah terima dicatat maksimal 15–30 menit sebelum jadwal pemakaian dimulai."], [ListChecks, "Pemeriksaan Fisik:", "Petugas dan penyewa memeriksa kelengkapan sarana bersama di lokasi."]].map(([Ik, j, tk]) => <li key={j} className="flex gap-3"><Ik size={18} className="mt-0.5 shrink-0 text-sky" /><span><b className="text-navy">{j}</b> {tk}</span></li>)}
            </ul>
          </Kartu>
          <Kartu className="p-6">
            <h2 className="text-lg font-bold text-navy">Status Pembayaran Pemohon</h2>
            <p className="mt-3 flex gap-2.5 text-sm text-ink">{lunas ? <><CircleCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" /> Lunas.</> : <><ClipboardList size={18} className="mt-0.5 shrink-0 text-orange-500" /> {t.pembayaran === "menunggu_verifikasi" ? "Bukti diunggah, menunggu verifikasi admin." : `Belum Dibayar - Menunggu unggah bukti dari penyewa ${penyewaTeks(t)}.`}</>}</p>
            <div className="mt-4 rounded-xl bg-pale/60 p-4"><p className="text-xs text-slate-500">Nominal Tagihan</p><p className="text-2xl font-extrabold text-navy">{rupiah(t.total)}</p></div>
            {t.batasBayar && !lunas && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><AlarmClock size={14} className="text-sky" /> Penyewa memiliki waktu hingga {fmtWaktu(t.batasBayar)} WIB.</p>}
          </Kartu>
        </div>
      </div>
    </div>
  );
}

const KONDISI = [["baik", "Baik"], ["rusak_ringan", "Rusak Ringan"], ["rusak_berat", "Rusak Berat"]];

function Pengembalian({ t, petugas }) {
  const set = usePengaturan();
  const asetList = useAsetList();
  const aset = asetList.find((a) => a.slug === t.asetSlug);
  const bisa = t.status === "sedang_disewa";
  const [waktu, setWaktu] = useState(() => sekarangLokalInput());
  const [jumlah, setJumlah] = useState(String(t.kategori === "peralatan" ? t.jumlah : 1));
  const [kondisi, setKondisi] = useState("baik");
  const [rusak, setRusak] = useState("1");
  const [catatan, setCatatan] = useState("");
  const [denda, setDenda] = useState("");
  const [g, setG] = useState({});

  const target = t.kategori === "peralatan" ? t.jumlah : 1;
  const waktuMs = dariLokalInput(waktu) || 0;
  const telat = hitungDendaTelat(t, waktuMs, set);
  const kerusakan = kondisi === "baik" ? 0 : Math.max(0, Number(denda) || 0);
  const total = telat.nominal + kerusakan;
  const batas = batasKembaliMs(t);
  const stokTotal = aset?.stokTotal ?? aset?.stok ?? 1;
  const stokSekarang = aset?.stok ?? stokTotal;
  const nRusak = kondisi === "baik" ? 0 : Math.min(Number(rusak) || 0, target);

  function simpan(e) {
    e.preventDefault();
    const x = {};
    if (!waktuMs) x.waktu = "Waktu pengembalian wajib diisi.";
    if (Number(jumlah) < 1 || Number(jumlah) > target) x.jumlah = `Jumlah dikembalikan harus 1–${target}.`;
    if (kondisi !== "baik") {
      if (t.kategori === "peralatan" && !(Number(rusak) >= 1 && Number(rusak) <= target)) x.rusak = `Jumlah unit rusak harus 1–${target}.`;
      if (catatan.trim().length < 5) x.catatan = "Catatan kerusakan wajib diisi (minimal 5 karakter).";
    }
    setG(x);
    if (Object.keys(x).length) return;
    catatPengembalian(t, aset, { waktu: waktuMs, jumlah: Number(jumlah), kondisi, jumlahRusak: t.kategori === "peralatan" ? Number(rusak) : 1, catatan, dendaKerusakan: denda }, petugas);
  }
  const er = (k) => (g[k] ? <p role="alert" className="mt-1.5 flex gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5 shrink-0" /> {g[k]}</p> : null);

  if (t.status === "disetujui" || ["diajukan", "ditolak", "dibatalkan"].includes(t.status))
    return <Kartu className="flex flex-col items-center px-6 py-14 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-pale text-sky"><FileX2 size={28} /></span><p className="mt-4 font-bold text-navy">Pengembalian belum dapat dicatat</p><p className="mt-1 max-w-md text-sm text-ink">Transaksi berstatus {t.status}. Pengembalian hanya dapat dicatat setelah serah terima dilakukan.</p></Kartu>;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Kartu className="p-6 md:p-7">
        <h2 className="border-b border-pale pb-4 text-xl font-bold text-navy">Pencatatan Pengembalian</h2>
        <dl className="mt-2">
          <Baris k="Penyewa" v={`${penyewaTeks(t)}, ${TIPE_LABEL[t.penyewa?.tipe] ?? ""}`} />
          <Baris k="Aset" v={`${t.asetNama} (${t.kodeAset})`} />
          <Baris k="Jumlah Disewa" v={t.kategori === "ruangan" ? "1 ruangan" : `${t.jumlah} ${aset?.stokSatuan ?? "unit"}`} />
          <Baris k="Batas Pengembalian" v={`${fmtWaktu(batas)} WIB`} />
          {t.serahTerima && <Baris k="Serah Terima" v={<span className="font-normal text-ink">Dicatat {fmtWaktu(t.serahTerima.waktu)} oleh {t.serahTerima.petugas}, kondisi {t.serahTerima.kondisi}</span>} />}
        </dl>

        {bisa ? (
          <form onSubmit={simpan} noValidate className="mt-5 space-y-4 border-t border-pale pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="wk" className={lab}>Waktu Pengembalian Aktual</label><input id="wk" type="datetime-local" value={waktu} onChange={(e) => { setWaktu(e.target.value); setG({ ...g, waktu: "" }); }} className={fld(g.waktu)} />{er("waktu")}</div>
              <div><label htmlFor="jm" className={lab}>Jumlah Dikembalikan</label><input id="jm" inputMode="numeric" value={jumlah} onChange={(e) => { setJumlah(e.target.value.replace(/\D/g, "")); setG({ ...g, jumlah: "" }); }} className={fld(g.jumlah)} />{er("jumlah")}</div>
            </div>
            <div>
              <span className={lab}>Kondisi Aset</span>
              <div role="radiogroup" aria-label="Kondisi aset" className="grid grid-cols-3 gap-1 rounded-xl bg-pale/70 p-1">
                {KONDISI.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={kondisi === v} onClick={() => setKondisi(v)} className={`rounded-lg py-2.5 text-sm font-bold transition ${kondisi === v ? "bg-navy text-white shadow" : "text-navy/70 hover:bg-white/60"}`}>{l}</button>)}
              </div>
            </div>
            {kondisi !== "baik" && (
              <>
                {t.kategori === "peralatan" && <div><label htmlFor="rs" className={lab}>Jumlah Unit Rusak</label><input id="rs" inputMode="numeric" value={rusak} onChange={(e) => { setRusak(e.target.value.replace(/\D/g, "")); setG({ ...g, rusak: "" }); }} className={fld(g.rusak)} />{er("rusak")}</div>}
                <div><label htmlFor="ck" className={lab}>Catatan Kerusakan</label><textarea id="ck" rows={3} value={catatan} onChange={(e) => { setCatatan(e.target.value); setG({ ...g, catatan: "" }); }} placeholder="mis. 1 set: kabel HDMI putus." className={`${fld(g.catatan)} resize-none`} />{er("catatan")}</div>
                <div><label htmlFor="dk" className={lab}>Denda Kerusakan (usulan petugas)</label><span className={`flex items-center rounded-xl bg-pale/70 pl-4 text-sm font-medium text-slate-500`}>Rp<input id="dk" inputMode="numeric" value={denda} onChange={(e) => setDenda(e.target.value.replace(/\D/g, ""))} className="w-full bg-transparent px-2 py-3 font-bold text-navy outline-none" /></span><p className="mt-1.5 text-xs text-slate-500">Dikonfirmasi oleh admin.</p></div>
              </>
            )}
            <div className="mt-2 flex gap-3 border-t border-pale pt-5">
              <button type="submit" className="rounded-xl bg-sun px-7 py-3 text-sm font-bold text-navy shadow-md transition hover:-translate-y-0.5">Simpan Pengembalian</button>
              <Link href={BASE} className="rounded-xl border border-sky px-6 py-3 text-sm font-bold text-sky transition hover:bg-pale">Batal</Link>
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900">
            <p className="flex items-center gap-2 font-bold"><CircleCheck size={17} /> Pengembalian telah dicatat</p>
            {t.pengembalian && <p className="mt-2">Dicatat {fmtWaktu(t.pengembalian.waktu)} oleh {t.pengembalian.petugas}. Jumlah dikembalikan: {t.pengembalian.jumlah}. Kondisi: {t.pengembalian.kondisi.replace("_", " ")}.{t.pengembalian.catatan ? ` Catatan: ${t.pengembalian.catatan}` : ""}</p>}
            <p className="mt-2 font-semibold">{t.denda ? `Total denda: ${rupiah(totalDenda(t))}${t.denda.konfirmasi === "menunggu" ? " (denda kerusakan menunggu konfirmasi admin)" : ""}.` : "Tidak ada denda."}</p>
          </div>
        )}
      </Kartu>

      <div className="space-y-6">
        <Kartu className="p-6">
          <h2 className="text-lg font-bold text-navy">Perhitungan Denda</h2>
          {bisa ? (
            <dl className="mt-3 text-sm">
              <Baris k="Keterlambatan" v={telat.telatMenit > 0 ? `Terlambat ${telat.telatMenit} menit` : "Tepat waktu"} />
              <Baris k="Toleransi" v={`${set.toleransiMenit} menit`} />
              {telat.unit > 0 && <Baris k="Penetapan Unit Waktu" v={<span>Dibulatkan {telat.unit} {telat.satuanUnit}<span className="block text-xs font-normal text-slate-500">(sewa per {telat.satuanUnit})</span></span>} />}
              <div className="border-b border-pale/70 py-3"><dt className="text-slate-500">Formula Keterlambatan</dt><dd className="mt-1 font-bold text-navy">{telat.rumus}</dd></div>
              <Baris k="Denda Kerusakan" v={<span>{rupiah(kerusakan)}<span className="block text-xs font-normal italic text-slate-500">{kerusakan > 0 ? "Menunggu konfirmasi admin" : "—"}</span></span>} />
              <div className="flex items-center justify-between pt-4"><dt className="font-bold text-navy">Total Denda</dt><dd className="text-2xl font-extrabold text-navy">{rupiah(total)}</dd></div>
            </dl>
          ) : <p className="mt-3 text-sm text-ink">{t.denda ? <>Total denda <b className="text-navy">{rupiah(totalDenda(t))}</b>.<span className="mt-1 block text-xs text-slate-500">{t.denda.ketTelat}</span></> : "Tidak ada denda pada transaksi ini."}</p>}
        </Kartu>
        <Kartu className="p-6">
          <h2 className="text-lg font-bold text-navy">Dampak ke Ketersediaan</h2>
          <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-ink">
            <li className="flex gap-3"><Wrench size={17} className="mt-0.5 shrink-0 text-sky" /><span>{t.kategori === "peralatan" ? <>Unit Rusak Ringan tidak dihitung sebagai stok tersedia: <b className="text-navy">{Math.max(0, stokSekarang - (kondisi === "baik" ? 0 : nRusak))} dari {stokTotal} unit tersedia</b>.</> : "Aset ruangan yang rusak ringan tetap dapat disewa dengan catatan kondisi."}</span></li>
            <li className="flex gap-3"><TriangleAlert size={17} className="mt-0.5 shrink-0 text-red-500" /><span>Kondisi Rusak Berat: aset tidak dapat disewa sampai diperbaiki.</span></li>
          </ul>
        </Kartu>
      </div>
    </div>
  );
}

export default function DetailPetugas({ kode, tab }) {
  const { siap, items } = useSemuaTransaksi();
  const sesi = useSesi();
  if (!siap) return null;
  const t = items.find((x) => x.kode === kode);
  if (!t)
    return <Kartu className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-pale text-sky"><FileX2 size={30} /></span><h1 className="mt-5 text-xl font-bold text-navy">Transaksi tidak ditemukan</h1><Link href={BASE} className="mt-6 rounded-xl bg-sun px-6 py-3 text-sm font-bold text-navy shadow-md">Kembali ke Dashboard</Link></Kartu>;
  const aktif = tab === "pengembalian" ? "pengembalian" : "serah-terima";
  const petugas = sesi?.nama ?? "Petugas";

  return (
    <div className="space-y-6">
      <Link href={BASE} className="inline-flex items-center gap-2 text-sm font-semibold text-sky hover:underline"><ArrowLeft size={16} /> Kembali ke Dashboard</Link>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div><h1 className="text-3xl font-extrabold tracking-tight text-navy md:text-4xl">{t.kode}</h1><span className="mt-3 block h-1 w-12 rounded-full bg-sun" /><p className="mt-3 text-sm text-ink">{asetTeks(t)} · {rumusBiaya(t)}</p></div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"><span className="flex items-center gap-2 text-slate-500">Status Transaksi: <StatusTrx status={t.status} /></span><span className="flex items-center gap-2 text-slate-500">Status Pembayaran: <StatusBayar status={t.pembayaran} /></span></div>
      </div>
      <div role="tablist" className="flex gap-7 border-b border-pale text-sm font-semibold">
        {[["serah-terima", "Serah Terima", ClipboardCheck], ["pengembalian", "Pengembalian", ClipboardPlus]].map(([v, l, Ik]) => (
          <Link key={v} role="tab" aria-selected={aktif === v} href={`${BASE}/transaksi/${t.kode}?tab=${v}`} replace scroll={false} className={`-mb-px flex items-center gap-2 border-b-2 pb-3 transition ${aktif === v ? "border-sun font-bold text-navy" : "border-transparent text-slate-500 hover:text-navy"}`}><Ik size={16} className={aktif === v ? "text-sky" : ""} /> {l}</Link>
        ))}
      </div>
      {aktif === "serah-terima" ? <SerahTerima key={t.status + t.pembayaran} t={t} petugas={petugas} /> : <Pengembalian key={t.status} t={t} petugas={petugas} />}
    </div>
  );
}
