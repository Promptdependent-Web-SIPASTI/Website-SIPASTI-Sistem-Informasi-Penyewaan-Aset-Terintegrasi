"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, CircleCheck, CircleAlert, ArrowRight, Send, Receipt, Info, IdCard, FileText, ClipboardList, LoaderCircle, MapPin, Users, Boxes } from "lucide-react";
import { Kartu, Remah } from "./ui";
import UploadBox from "./UploadBox";
import AsetImage from "@/components/AsetImage";
import { ASET, getAset, rupiah, satuanLabel } from "@/lib/data";
import { SEMUA_JAM, durasiJam, fromISO, sesiMulai, sesiSelesai, statusHari, tambahHari, toISO, minTanggalSewa } from "@/lib/waktu";
import { useHariIni, useSesi } from "@/lib/useClient";
import { cariTanggalAwal, fmtTgl, tambahTransaksi } from "@/lib/transaksi";

const BASE = "/dashboard/penyewa";
const JAM_MULAI = SEMUA_JAM.slice(0, -1).filter((t) => t !== "11:30");
const JAM_SELESAI = SEMUA_JAM.slice(1).filter((t) => t !== "12:30");
const MAKS_HARI = 7;
const hariAntara = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000) + 1;

function periodeNarasi(t1, t2) {
  if (!t1) return "";
  return t1 === t2 ? fmtTgl(t1) : `${fromISO(t1).getDate()}–${fmtTgl(t2)}`;
}

function cekJadwal({ aset, t1, t2, jm, js, minD }) {
  if (!aset) return { ok: false, pesan: "" };
  if (aset.status === "Tidak tersedia") return { ok: false, pesan: "Aset sedang tidak tersedia untuk reservasi." };
  if (!t1) return { ok: false, pesan: "Pilih tanggal pemakaian." };
  const a = fromISO(t1), b = fromISO(t2);
  if (b < a) return { ok: false, pesan: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
  const n = hariAntara(t1, t2);
  if (n > MAKS_HARI) return { ok: false, pesan: `Durasi sewa maksimal ${MAKS_HARI} hari.` };
  if (minD && a < minD) return { ok: false, pesan: "Pengajuan paling lambat H-2 sebelum pemakaian." };
  for (let i = 0; i < n; i++) {
    const d = tambahHari(a, i);
    if (d.getDay() === 0) return { ok: false, pesan: "Rentang tanggal mencakup hari Minggu (layanan hanya Senin–Sabtu)." };
    if (statusHari(aset, d) === "terisi") return { ok: false, pesan: `Tanggal ${fmtTgl(toISO(d))} sudah terisi pada jadwal aset ini.` };
  }
  if (aset.satuan === "jam") {
    if (durasiJam(jm, js) <= 0) return { ok: false, pesan: "Jam selesai harus setelah jam mulai." };
    if (sesiMulai(jm) !== sesiSelesai(js)) return { ok: false, pesan: "Rentang jam tidak boleh melewati waktu istirahat (11.30–12.30)." };
  }
  return { ok: true, pesan: `Jadwal tersedia pada ${periodeNarasi(t1, t2)}.` };
}

function Langkah({ n, judul }) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-pale pb-4">
      <h2 className="flex items-center gap-3 text-lg font-bold text-navy"><span className="flex size-7 items-center justify-center rounded-md bg-pale text-sm text-sky">{n}</span> {judul}</h2>
      <span className="text-xs text-slate-400">Langkah {n} dari 3</span>
    </div>
  );
}

export default function FormPengajuan({ awal }) {
  const router = useRouter();
  const sesi = useSesi();
  const hariIni = useHariIni();
  const minD = hariIni ? minTanggalSewa() : null;

  const [slug, setSlug] = useState(getAset(awal.aset)?.slug ?? "");
  const [tgl1, setTgl1] = useState(awal.tanggal ?? "");
  const [tgl2, setTgl2] = useState("");
  const [jm, setJm] = useState(JAM_MULAI.includes(awal.mulai) ? awal.mulai : "12:30");
  const [js, setJs] = useState(JAM_SELESAI.includes(awal.selesaiJam) ? awal.selesaiJam : "15:30");
  const [jumlah, setJumlah] = useState(Math.max(1, Number(awal.jumlah) || 1));
  const [tujuan, setTujuan] = useState("");
  const [dok, setDok] = useState({ surat: null, identitas: null, rincian: null });
  const [galat, setGalat] = useState({});
  const [proses, setProses] = useState(false);

  const bersihkan = (k) => setGalat((g) => { if (!g[k]) return g; const baru = { ...g }; delete baru[k]; return baru; });

  const aset = getAset(slug);
  const isRuangan = aset?.kategori === "ruangan";
  const butuhRincian = !!aset && (aset.subkategori === "Aula" || aset.slug === "ruang-rapat-besar-gedung-ukm");

  const t1 = tgl1 || (aset && hariIni ? cariTanggalAwal(aset, hariIni) : "");
  const t2 = aset?.satuan === "hari" ? tgl2 || (t1 ? toISO(tambahHari(fromISO(t1), Math.max(0, (Number(awal.hari) || 1) - 1))) : "") : t1;
  const jadwal = useMemo(() => cekJadwal({ aset, t1, t2, jm, js, minD }), [aset, t1, t2, jm, js, minD]);

  const durasi = !aset ? 0 : aset.satuan === "jam" ? Math.max(1, Math.ceil(durasiJam(jm, js))) : aset.satuan === "hari" ? Math.max(1, t1 && t2 ? hariAntara(t1, t2) : 1) : 1;
  const total = aset ? aset.tarif * durasi * (isRuangan ? 1 : jumlah) : 0;
  const durasiTeks = !aset ? "—" : aset.satuan === "jam" ? `${durasi} jam` : aset.satuan === "hari" ? `${durasi} hari` : "1 kegiatan";
  const jumlahTeks = !aset ? "—" : isRuangan ? `1 unit ${aset.subkategori === "Aula" ? "aula" : "ruangan"}` : `${jumlah} ${aset.stokSatuan ?? "unit"}`;
  const refForm = `#SIPASTI-REQ-${hariIni ? hariIni.slice(0, 4) + hariIni.slice(5, 7) : "000000"}`;

  function kirim(e) {
    e.preventDefault();
    const g = {};
    if (!aset) g.aset = "Pilih aset yang akan disewa.";
    else if (!jadwal.ok) g.jadwal = jadwal.pesan;
    if (aset && !isRuangan && (jumlah < 1 || jumlah > aset.stok)) g.jumlah = `Jumlah harus 1–${aset.stok} ${aset.stokSatuan ?? "unit"} sesuai stok tersedia.`;
    if (tujuan.trim().length < 10) g.tujuan = "Jelaskan tujuan kegiatan minimal 10 karakter.";
    if (!dok.surat) g.surat = "Surat permohonan/perizinan wajib diunggah.";
    if (!dok.identitas) g.identitas = "Identitas pemohon / KTM wajib diunggah.";
    if (butuhRincian && !dok.rincian) g.rincian = "Rincian kegiatan wajib untuk penyewaan aula dan ruang rapat besar.";
    setGalat(g);
    if (Object.keys(g).length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setProses(true);
    setTimeout(() => {
      const kode = tambahTransaksi({
        email: sesi.email, asetSlug: aset.slug, asetNama: aset.nama, kodeAset: aset.kode, kategori: aset.kategori, satuan: aset.satuan, tarif: aset.tarif,
        jumlah: isRuangan ? 1 : jumlah, durasi, tanggalMulai: t1, tanggalSelesai: t2,
        ...(aset.satuan === "jam" ? { jamMulai: jm, jamSelesai: js } : {}),
        tujuan: tujuan.trim(), total,
        dokumen: [
          { jenis: "Surat Permohonan / Perizinan", ...dok.surat },
          { jenis: "Identitas / Kartu Tanda Mahasiswa (KTM)", ...dok.identitas },
          ...(dok.rincian ? [{ jenis: "Rincian Kegiatan", ...dok.rincian }] : []),
        ],
      });
      router.push(`${BASE}/transaksi/${kode}?baru=1`);
    }, 600);
  }

  const inp = (bad) => `w-full rounded-xl border bg-pale/60 px-4 py-3 text-sm font-medium text-navy outline-none transition focus:bg-white ${bad ? "border-red-300 bg-red-50/50" : "border-transparent focus:border-sky"}`;
  const lab = "mb-1.5 block text-sm font-bold text-navy";
  const err = (k) => (galat[k] ? <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5 shrink-0" /> {galat[k]}</p> : null);
  const ringkasanGalat = Object.keys(galat).length > 0;

  return (
    <form onSubmit={kirim} noValidate>
      <Remah items={[{ label: "Dashboard", href: BASE }, { label: "Ajukan Sewa" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight text-navy md:text-4xl">Form Pengajuan Sewa</h1>
      <span className="mt-3 block h-1 w-12 rounded-full bg-sun" />
      <p className="mt-3 max-w-2xl text-sm text-ink">Lengkapi formulir permohonan penyewaan fasilitas dan peralatan FMIPA UNNES secara terpadu dan transparan.</p>

      {ringkasanGalat && (
        <p role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <CircleAlert size={18} className="mt-0.5 shrink-0" /> Periksa kembali isian Anda. Beberapa data belum lengkap atau belum sesuai ketentuan.
        </p>
      )}

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Kartu className="p-6 md:p-7">
            <Langkah n={1} judul="Aset dan Jadwal" />
            {aset ? (
              <div className="flex flex-col gap-4 rounded-xl bg-pale/60 p-4 sm:flex-row sm:items-center">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg"><AsetImage aset={aset} label={false} iconSize={28} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-navy">{aset.nama}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink">
                    <span>{aset.kode}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-sky" /> {aset.lokasi}</span>
                    <span className="flex items-center gap-1">{isRuangan ? <Users size={12} className="text-sky" /> : <Boxes size={12} className="text-sky" />} {isRuangan ? `Kapasitas ${aset.kapasitas} ${aset.kapasitasSatuan ?? "orang"}` : `Tersedia ${aset.stok} ${aset.stokSatuan ?? "unit"}`}</span>
                  </p>
                </div>
                <button type="button" onClick={() => setSlug("")} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-sky hover:underline">Ganti Aset <ArrowRight size={14} /></button>
              </div>
            ) : (
              <div>
                <label htmlFor="pilih-aset" className={lab}>Pilih Aset</label>
                <select id="pilih-aset" value={slug} onChange={(e) => { setSlug(e.target.value); setTgl1(""); setTgl2(""); setGalat({}); }} className={inp(galat.aset)}>
                  <option value="">— Pilih aset —</option>
                  {["ruangan", "peralatan"].map((k) => (
                    <optgroup key={k} label={k === "ruangan" ? "Fasilitas dan Ruangan" : "Peralatan dan Perlengkapan"}>
                      {ASET.filter((a) => a.kategori === k && a.status !== "Tidak tersedia").map((a) => <option key={a.slug} value={a.slug}>{a.kode} · {a.nama}</option>)}
                    </optgroup>
                  ))}
                </select>
                {err("aset")}
                <p className="mt-2 text-xs text-slate-500">Atau <Link href="/aset" className="font-semibold text-sky hover:underline">jelajahi katalog</Link> untuk melihat detail dan kalender ketersediaan.</p>
              </div>
            )}

            {aset && (
              <div className="mt-6 space-y-5">
                <div>
                  <span className={lab}>Satuan Sewa</span>
                  <div className="flex items-center justify-between rounded-xl bg-pale/60 px-4 py-3 text-sm font-medium text-navy">
                    <span>Per {satuanLabel(aset.satuan)} ({rupiah(aset.tarif)})</span><Lock size={15} className="text-slate-400" />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">Tarif terstandarisasi untuk kegiatan internal akademik &amp; mahasiswa.</p>
                </div>

                {aset.satuan === "hari" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="t1" className={lab}>Tanggal Mulai</label>
                      <input id="t1" type="date" value={t1} min={minD ? toISO(minD) : undefined} onChange={(e) => setTgl1(e.target.value)} className={inp(galat.jadwal)} />
                      {t1 && <p className="mt-1.5 text-xs text-sky">Mulai pemakaian: {fmtTgl(t1)}</p>}
                    </div>
                    <div>
                      <label htmlFor="t2" className={lab}>Tanggal Selesai</label>
                      <input id="t2" type="date" value={t2} min={t1 || undefined} onChange={(e) => setTgl2(e.target.value)} className={inp(galat.jadwal)} />
                      {t2 && <p className="mt-1.5 text-xs text-sky">Selesai pemakaian: {fmtTgl(t2)}</p>}
                    </div>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${aset.satuan === "jam" ? "sm:grid-cols-3" : ""}`}>
                    <div>
                      <label htmlFor="t1" className={lab}>{aset.satuan === "jam" ? "Tanggal Sewa" : "Tanggal Pelaksanaan"}</label>
                      <input id="t1" type="date" value={t1} min={minD ? toISO(minD) : undefined} onChange={(e) => setTgl1(e.target.value)} className={inp(galat.jadwal)} />
                      {t1 && <p className="mt-1.5 text-xs text-sky">{fmtTgl(t1)}</p>}
                    </div>
                    {aset.satuan === "jam" && (
                      <>
                        <div><label htmlFor="jm" className={lab}>Jam Mulai</label><select id="jm" value={jm} onChange={(e) => setJm(e.target.value)} className={inp(galat.jadwal)}>{JAM_MULAI.map((t) => <option key={t} value={t}>{t.replace(":", ".")} WIB</option>)}</select></div>
                        <div><label htmlFor="js" className={lab}>Jam Selesai</label><select id="js" value={js} onChange={(e) => setJs(e.target.value)} className={inp(galat.jadwal)}>{JAM_SELESAI.map((t) => <option key={t} value={t}>{t.replace(":", ".")} WIB</option>)}</select></div>
                      </>
                    )}
                  </div>
                )}

                {!isRuangan && (
                  <div>
                    <label htmlFor="jml" className={lab}>Jumlah ({aset.stokSatuan ?? "unit"})</label>
                    <input id="jml" type="number" min={1} max={aset.stok} value={jumlah} onChange={(e) => { setJumlah(Number(e.target.value) || 1); bersihkan("jumlah"); }} className={inp(galat.jumlah)} />
                    <p className="mt-1.5 text-xs text-slate-500">Stok tersedia: {aset.stok} {aset.stokSatuan ?? "unit"}.</p>
                    {err("jumlah")}
                  </div>
                )}

                <p className="text-xs leading-relaxed text-slate-600">Penyewaan Senin–Sabtu pada sesi 07.00–11.30 dan 12.30–18.00. Pengajuan paling lambat H-2 sebelum pemakaian.</p>
                {jadwal.pesan && (
                  <p role="status" className={`flex items-start gap-2 text-sm font-semibold ${jadwal.ok ? "text-sky" : "text-red-600"}`}>
                    {jadwal.ok ? <CircleCheck size={18} className="mt-0.5 shrink-0" /> : <CircleAlert size={18} className="mt-0.5 shrink-0" />} {jadwal.pesan}
                  </p>
                )}
              </div>
            )}
          </Kartu>

          <Kartu className="p-6 md:p-7">
            <Langkah n={2} judul="Tujuan Kegiatan" />
            <label htmlFor="tujuan" className={lab}>Tujuan dan Deskripsi Kegiatan</label>
            <textarea id="tujuan" rows={4} value={tujuan} onChange={(e) => { setTujuan(e.target.value); bersihkan("tujuan"); }} placeholder="mis. Seminar nasional mahasiswa Fisika." className={`${inp(galat.tujuan)} resize-y`} />
            <div className="mt-1.5 flex justify-between text-xs text-slate-500"><span>Jelaskan susunan acara, estimasi jumlah peserta, serta penanggung jawab operasional kegiatan.</span><span>{tujuan.length}</span></div>
            {err("tujuan")}
          </Kartu>

          <Kartu className="p-6 md:p-7">
            <Langkah n={3} judul="Dokumen Pendukung" />
            <p className="mb-5 text-xs text-sky">Format berkas: PDF, JPG, atau PNG, maksimal 5 MB per berkas.</p>
            <div className="space-y-5">
              <div>
                <p className={lab}>Surat Permohonan / Perizinan <span className="font-normal text-slate-500">(ditandatangani dekan atau dosen pembina)</span></p>
                <UploadBox id="up-surat" ikon={FileText} judul="Klik untuk unggah atau seret berkas ke sini" keterangan="Surat permohonan atau izin yang telah ditandatangani" nilai={dok.surat} onChange={(v) => { setDok((d) => ({ ...d, surat: v })); bersihkan("surat"); }} galat={galat.surat} />
              </div>
              <div>
                <p className={lab}>Identitas Pemohon / KTM</p>
                <UploadBox id="up-identitas" ikon={IdCard} judul="Klik untuk unggah atau seret berkas ke sini" keterangan="KTM pemohon atau kartu identitas instansi resmi" nilai={dok.identitas} onChange={(v) => { setDok((d) => ({ ...d, identitas: v })); bersihkan("identitas"); }} galat={galat.identitas} />
              </div>
              <div>
                <p className={lab}>Rincian Kegiatan <span className="font-normal text-slate-500">({butuhRincian ? "wajib untuk aula dan ruang rapat besar" : "khusus penyewaan aula dan ruang rapat besar"})</span></p>
                <UploadBox id="up-rincian" ikon={ClipboardList} judul="Klik untuk unggah atau seret berkas ke sini" keterangan="Proposal kegiatan atau rundown acara terlampir" nilai={dok.rincian} onChange={(v) => { setDok((d) => ({ ...d, rincian: v })); bersihkan("rincian"); }} galat={galat.rincian} />
              </div>
            </div>
          </Kartu>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Kartu className="p-6">
            <div className="flex items-center justify-between border-b border-pale pb-4"><h2 className="text-lg font-bold text-navy">Ringkasan Biaya</h2><Receipt size={18} className="text-sky" /></div>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Aset Terpilih", aset?.nama ?? "—"],
                ["Tarif Sewa", aset ? `${rupiah(aset.tarif)} / ${satuanLabel(aset.satuan)}` : "—"],
                ["Durasi Pemakaian", durasiTeks],
                ["Jumlah Unit", jumlahTeks],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-bold text-navy">{v}</dd></div>)}
            </dl>
            <div className="mt-4 border-t border-pale pt-4">
              <p className="text-xs text-slate-500">Total Estimasi</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-navy">{rupiah(aset && jadwal.ok ? total : 0)}</p>
            </div>
            <p className="mt-4 flex gap-2.5 rounded-xl bg-pale/60 p-3.5 text-xs leading-relaxed text-sky"><Info size={15} className="mt-0.5 shrink-0" /> Pembayaran dilakukan setelah berkas permohonan disetujui oleh admin FMIPA UNNES.</p>
            <button type="submit" disabled={proses} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sun py-3.5 text-sm font-bold text-navy shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:opacity-80">
              {proses ? <><LoaderCircle size={17} className="animate-spin" /> Mengirim…</> : <><Send size={16} /> Kirim Pengajuan</>}
            </button>
            <Link href={BASE} className="mt-3 block w-full rounded-xl border border-sky py-2.5 text-center text-sm font-bold text-sky transition hover:bg-sky hover:text-white">Batal</Link>
            <p className="mt-4 text-center text-[11px] text-slate-400">ID Referensi Formulir: {refForm}</p>
          </Kartu>
        </aside>
      </div>
    </form>
  );
}
