"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera, MapPin, Users, ShieldCheck, Hash, Boxes, CircleCheck, CircleAlert, ChevronLeft, ChevronRight, ArrowRight,
  CalendarDays, MessageSquare, Info, Ban, Clock3, CalendarCheck2, ChevronDown, Archive,
} from "lucide-react";
import AsetImage from "@/components/AsetImage";
import { rupiah, satuanLabel } from "@/lib/data";
import { useHariIni, useSesi } from "@/lib/useClient";
import {
  BULAN, HARI, SESI, SEMUA_JAM, minTanggalSewa, mulaiHari, toISO, fromISO, formatTanggal,
  statusHari, statusSlot, sesiMulai, sesiSelesai, durasiJam, tambahHari,
} from "@/lib/waktu";

function cariTanggalTersedia(aset, hariIni) {
  let d = tambahHari(fromISO(hariIni), 2);
  for (let i = 0; i < 60; i++) {
    if (statusHari(aset, d) === "tersedia") return toISO(d);
    d = tambahHari(d, 1);
  }
  return "";
}

const TABS = [["deskripsi", "Deskripsi"], ["spesifikasi", "Spesifikasi"], ["aturan", "Aturan Pemakaian"]];

function Galeri({ aset }) {
  const [aktif, setAktif] = useState(0);
  const varian = [aset, ...[1, 2, 3, 4].slice(0, 3).map((i) => ({ ...aset, foto: `/images/aset/${aset.slug}-${i}.jpg` }))];
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-pale shadow-card">
        <AnimatePresence mode="wait">
          <motion.div key={aktif} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
            <AsetImage aset={varian[aktif]} iconSize={84} />
          </motion.div>
        </AnimatePresence>
        <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-navy/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          <Camera size={14} /> {aktif === 0 ? `Foto utama: ${aset.nama}` : `Foto ${aktif + 1}: ${aset.nama}`}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {varian.concat([{ ...aset, foto: `/images/aset/${aset.slug}-4.jpg` }]).slice(0, 4).map((v, i) => (
          <button key={i} type="button" onClick={() => setAktif(i)} aria-label={`Lihat foto ${i + 1}`} className={`aspect-[16/10] overflow-hidden rounded-xl border-2 transition ${aktif === i ? "border-sky shadow-md" : "border-transparent opacity-80 hover:opacity-100"}`}>
            <AsetImage aset={v} label={false} iconSize={28} />
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelSewa({ aset, tanggal, setTanggal }) {
  const isRuangan = aset.kategori === "ruangan";
  const [mulai, setMulai] = useState("12:30");
  const [selesai, setSelesai] = useState("15:30");
  const [hari, setHari] = useState(1);
  const [jumlah, setJumlah] = useState(1);
  const hariIni = useHariIni();
  const minD = hariIni ? tambahHari(fromISO(hariIni), 2) : null;
  const user = useSesi();

  const nonaktif = aset.status === "Tidak tersedia";
  const d = tanggal ? fromISO(tanggal) : null;

  const galat = useMemo(() => {
    if (nonaktif) return "Aset sedang tidak tersedia untuk reservasi.";
    if (!d) return "Pilih tanggal sewa terlebih dahulu.";
    if (minD && d < minD) return "Pengajuan paling lambat H-2 sebelum pemakaian.";
    if (d.getDay() === 0) return "Layanan hanya Senin–Sabtu.";
    if (statusHari(aset, d) === "terisi") return "Tanggal ini sudah terisi penuh.";
    if (aset.satuan === "jam") {
      if (durasiJam(mulai, selesai) <= 0) return "Jam selesai harus setelah jam mulai.";
      if (sesiMulai(mulai) !== sesiSelesai(selesai)) return "Rentang jam tidak boleh melewati waktu istirahat (11.30–12.30).";
    }
    if (!isRuangan && (jumlah < 1 || jumlah > aset.stok)) return `Jumlah harus 1–${aset.stok} ${aset.stokSatuan ?? "unit"}.`;
    return "";
  }, [aset, d, minD, mulai, selesai, jumlah, nonaktif, isRuangan]);

  const durasi = aset.satuan === "jam" ? Math.max(1, Math.ceil(durasiJam(mulai, selesai))) : aset.satuan === "hari" ? hari : 1;
  const estimasi = aset.tarif * durasi * (isRuangan ? 1 : jumlah);
  const durasiTeks = aset.satuan === "jam" ? `Durasi ${durasi} jam` : aset.satuan === "hari" ? `${durasi} hari` : "Per kegiatan";

  const tujuan = `/aset/${aset.slug}`;
  const query = new URLSearchParams({ aset: aset.slug, tanggal, ...(aset.satuan === "jam" ? { mulai, selesai } : {}), ...(aset.satuan === "hari" ? { hari: String(hari) } : {}), ...(!isRuangan ? { jumlah: String(jumlah) } : {}) });
  const href = user ? `/dashboard/penyewa/ajukan?${query}` : `/masuk?next=${encodeURIComponent(tujuan)}`;

  const field = "w-full rounded-xl bg-pale px-4 py-3 text-sm font-medium text-navy outline-none ring-sky/40 focus:ring-2";

  return (
    <aside className="self-start rounded-2xl bg-white p-7 shadow-pop lg:sticky lg:top-28">
      <p className="text-4xl font-extrabold tracking-tight text-sky">
        {rupiah(aset.tarif)} <span className="text-base font-medium text-slate-500">/{aset.satuan === "unit" ? "unit" : satuanLabel(aset.satuan)}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">Tarif sama untuk seluruh penyewa terdaftar</p>
      <p className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${nonaktif ? "text-red-600" : aset.status === "Terisi" ? "text-orange-500" : "text-sky"}`}>
        {nonaktif ? <Ban size={16} /> : <CircleCheck size={16} />}
        {nonaktif ? "Tidak tersedia (perawatan)" : aset.status === "Terisi" ? "Terisi pada sebagian jadwal" : "Tersedia untuk reservasi"}
      </p>

      <div className="mt-5 space-y-4 border-t border-pale pt-5">
        <div>
          <div className="mb-1.5 flex justify-between text-sm font-bold text-navy"><label htmlFor="tgl-sewa">Tanggal Sewa</label><span className="text-xs font-medium text-slate-400">H-2 Min.</span></div>
          <input id="tgl-sewa" type="date" value={tanggal} min={minD ? toISO(minD) : undefined} onChange={(e) => setTanggal(e.target.value)} className={field} />
        </div>

        {aset.satuan === "jam" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold text-navy">Jam Mulai
              <select value={mulai} onChange={(e) => setMulai(e.target.value)} className={`${field} mt-1.5`}>
                {SEMUA_JAM.slice(0, -1).filter((t) => t !== "11:30").map((t) => <option key={t} value={t}>{t.replace(":", ".")} WIB</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-navy">Jam Selesai
              <select value={selesai} onChange={(e) => setSelesai(e.target.value)} className={`${field} mt-1.5`}>
                {SEMUA_JAM.slice(1).filter((t) => t !== "12:30").map((t) => <option key={t} value={t}>{t.replace(":", ".")} WIB</option>)}
              </select>
            </label>
          </div>
        )}
        {aset.satuan === "hari" && (
          <label className="block text-sm font-bold text-navy">Durasi (hari)
            <input type="number" min={1} max={7} value={hari} onChange={(e) => setHari(Math.min(7, Math.max(1, Number(e.target.value) || 1)))} className={`${field} mt-1.5`} />
          </label>
        )}
        {!isRuangan && (
          <label className="block text-sm font-bold text-navy">Jumlah ({aset.stokSatuan ?? "unit"}) — tersedia {aset.stok}
            <input type="number" min={1} max={aset.stok} value={jumlah} onChange={(e) => setJumlah(Number(e.target.value) || 1)} className={`${field} mt-1.5`} />
          </label>
        )}

        <div className="rounded-xl bg-pale/70 p-4">
          <p className="text-xs text-slate-500">Estimasi Biaya Retribusi:</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-2xl font-extrabold text-navy">{rupiah(galat ? 0 : estimasi)}</p>
            <p className="text-xs font-medium text-slate-500">{durasiTeks}</p>
          </div>
        </div>
        {galat && <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"><CircleAlert size={14} className="mt-0.5 shrink-0" /> {galat}</p>}
      </div>

      {galat ? (
        <button type="button" disabled className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-sun/50 py-3.5 font-bold text-navy/60">Ajukan Sewa <ArrowRight size={16} /></button>
      ) : (
        <Link href={href} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sun py-3.5 font-bold text-navy shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">Ajukan Sewa <ArrowRight size={16} /></Link>
      )}
      <a href={`mailto:sipasti@fmipa.unnes.ac.id?subject=${encodeURIComponent(`Pertanyaan tentang ${aset.nama} (${aset.kode})`)}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sky py-2.5 text-sm font-semibold text-sky transition hover:bg-sky hover:text-white">
        <MessageSquare size={15} /> {isRuangan ? "Tanya Pengelola" : "Tanya Petugas"}
      </a>
      <p className="mt-4 flex gap-2 border-t border-pale pt-4 text-xs leading-relaxed text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0" />
        Pengajuan permohonan paling lambat H-2 sebelum hari pemakaian. Operasional hanya Senin–Sabtu.
      </p>
    </aside>
  );
}

function Kalender({ aset, tanggal, setTanggal }) {
  const hariIni = useHariIni();
  const [pilihBulan, setPilihBulan] = useState(null); // {y, m} bila pengguna berpindah bulan
  const acuan = tanggal ? fromISO(tanggal) : hariIni ? fromISO(hariIni) : null;
  const bulan = pilihBulan ?? (acuan ? { y: acuan.getFullYear(), m: acuan.getMonth() } : null);

  if (!bulan) return <div className="h-96 animate-pulse rounded-xl bg-soft" />;

  const pertama = new Date(bulan.y, bulan.m, 1);
  const offset = (pertama.getDay() + 6) % 7; // Senin = 0
  const jumlahHari = new Date(bulan.y, bulan.m + 1, 0).getDate();
  const sel = [];
  for (let i = 0; i < 42; i++) {
    const n = i - offset + 1;
    sel.push(n >= 1 && n <= jumlahHari ? new Date(bulan.y, bulan.m, n) : new Date(bulan.y, bulan.m, n));
  }
  const geser = (n) => { const d = new Date(bulan.y, bulan.m + n, 1); setPilihBulan({ y: d.getFullYear(), m: d.getMonth() }); };
  const dipilih = tanggal ? fromISO(tanggal) : null;
  const tampilDipilih = dipilih && statusHari(aset, dipilih) !== "tidak" ? dipilih : dipilih;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy">{BULAN[bulan.m]} {bulan.y}</h3>
          <div className="flex gap-3 text-navy">
            <button type="button" onClick={() => geser(-1)} aria-label="Bulan sebelumnya" className="rounded-md p-1 hover:bg-pale"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => geser(1)} aria-label="Bulan berikutnya" className="rounded-md p-1 hover:bg-pale"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold">
          {HARI.map((h, i) => <span key={h} className={`py-2 ${i === 6 ? "text-red-600" : "text-slate-500"}`}>{h}</span>)}
          {sel.map((d, i) => {
            const luar = d.getMonth() !== bulan.m;
            const st = statusHari(aset, d);
            const pilih = dipilih && toISO(d) === toISO(dipilih);
            const base = "aspect-square rounded-lg text-sm font-semibold transition";
            if (luar) return <span key={i} className={`${base} flex items-center justify-center text-slate-300`}>{d.getDate()}</span>;
            const kelas = pilih
              ? "bg-navy text-white shadow-md"
              : st === "tidak" ? "bg-soft text-slate-300"
              : st === "terisi" ? "bg-red-100 text-red-600"
              : "bg-pale text-navy hover:bg-sky hover:text-white";
            return (
              <button key={i} type="button" disabled={st === "tidak"} onClick={() => setTanggal(toISO(d))} aria-label={`${d.getDate()} ${BULAN[d.getMonth()]}, ${st}`} aria-pressed={pilih} className={`${base} ${kelas} disabled:cursor-not-allowed`}>
                {d.getDate()}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-xs text-slate-600">
          <span className="flex items-center gap-2"><i className="size-3.5 rounded bg-pale" /> Tersedia</span>
          <span className="flex items-center gap-2"><i className="size-3.5 rounded bg-red-100" /> Terisi</span>
          <span className="flex items-center gap-2"><i className="size-3.5 rounded bg-soft ring-1 ring-slate-200" /> Tidak tersedia</span>
        </div>
      </div>

      <div className="rounded-xl bg-soft p-5">
        {!tampilDipilih ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-sm text-slate-500">
            <CalendarDays size={32} className="mb-3 text-sky" /> Pilih tanggal pada kalender untuk melihat jam yang tersedia.
          </div>
        ) : (
          <>
            <p className="flex items-center gap-2 border-b border-pale pb-3 font-bold text-navy"><CalendarDays size={16} className="text-sky" /> {formatTanggal(tampilDipilih)}</p>
            {aset.satuan !== "jam" ? (
              <div className="mt-4 rounded-lg bg-white p-4 text-sm">
                <p className="font-semibold text-navy">Sepanjang hari · 07.00–18.00 WIB</p>
                <p className={`mt-2 flex items-center gap-1.5 font-semibold ${statusHari(aset, tampilDipilih) === "tersedia" ? "text-sky" : "text-red-600"}`}>
                  {statusHari(aset, tampilDipilih) === "tersedia" ? <><CircleCheck size={15} /> Tersedia</> : <><Clock3 size={15} /> Tidak tersedia</>}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {SESI.map((s, si) => (
                  <div key={s.id}>
                    <p className="mb-2 mt-3 text-[11px] font-bold tracking-wide text-sky">{s.nama}</p>
                    <div className="space-y-2">
                      {s.slot.map(([a, b], idx) => {
                        const info = statusHari(aset, tampilDipilih) === "tidak" ? { terisi: true, ket: "Tidak tersedia" } : statusSlot(aset, tampilDipilih, s.id, idx);
                        return (
                          <div key={a} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3.5 py-2.5 text-sm font-medium text-navy shadow-sm">
                            <span>{a} – {b} WIB</span>
                            {info.terisi
                              ? <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><Clock3 size={13} /> Terisi{info.ket ? ` (${info.ket})` : ""}</span>
                              : <span className="flex items-center gap-1 text-xs font-semibold text-sky"><CircleCheck size={13} /> Tersedia</span>}
                          </div>
                        );
                      })}
                    </div>
                    {si === 0 && (
                      <p className="mt-3 flex items-center gap-2 rounded-lg bg-pale px-3.5 py-2.5 text-xs text-slate-600"><Ban size={13} /> 11.30 – 12.30 WIB (Istirahat{aset.subkategori === "Laboratorium" ? " & Pemeliharaan Lab" : ""})</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DetailClient({ aset }) {
  const [tab, setTab] = useState("spesifikasi");
  const [tanggalPilih, setTanggal] = useState("");
  const hariIni = useHariIni();
  const tanggal = tanggalPilih || (hariIni ? cariTanggalTersedia(aset, hariIni) : "");
  const isRuangan = aset.kategori === "ruangan";

  const kartu = [
    { ikon: isRuangan ? MapPin : Archive, label: isRuangan ? "Lokasi" : "Pengelola", nilai: isRuangan ? aset.lokasi : aset.pengelola ?? aset.lokasi },
    { ikon: isRuangan ? Users : Boxes, label: isRuangan ? "Kapasitas Maksimal" : "Stok Tersedia", nilai: isRuangan ? `${aset.kapasitas} ${aset.kapasitasSatuan ?? "orang"}` : `${aset.stok} dari ${aset.stokTotal} ${aset.stokSatuan ?? "unit"}` },
    { ikon: ShieldCheck, label: isRuangan ? "Kondisi Fasilitas" : "Kondisi", nilai: aset.kondisiDetail ?? aset.kondisi },
    { ikon: Hash, label: "Kode Register Aset", nilai: aset.kode },
  ];

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-8">
        <Galeri aset={aset} />

        <section className="rounded-2xl bg-white p-7 shadow-card">
          <div role="tablist" className="flex gap-7 border-b border-pale text-sm font-semibold">
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`-mb-px border-b-2 pb-3 transition ${tab === id ? "border-sun font-bold text-navy" : "border-transparent text-slate-500 hover:text-navy"}`}>
                {label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pt-6">
              {tab === "deskripsi" && (
                <div className="space-y-3 text-sm leading-7 text-ink">
                  <p className="font-semibold text-navy">{aset.ringkas}</p>
                  <p>{aset.deskripsi}</p>
                </div>
              )}
              {tab === "spesifikasi" && (
                <>
                  <p className="text-sm leading-7 text-ink">{aset.deskripsi}</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {kartu.map(({ ikon: Icon, label, nilai }) => (
                      <div key={label} className="flex items-start gap-3 rounded-xl bg-soft px-5 py-4">
                        <Icon size={18} className="mt-0.5 text-sky" />
                        <div><p className="text-xs text-slate-500">{label}</p><p className="mt-0.5 font-bold text-navy">{nilai}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-soft px-5 py-4 text-sm">
                    <p className="flex items-center gap-2 font-bold text-navy"><Archive size={15} className="text-sky" /> Fasilitas Tambahan Terintegrasi:</p>
                    <p className="mt-1.5 pl-6 text-ink">{aset.fasilitas}</p>
                  </div>
                </>
              )}
              {tab === "aturan" && (
                <ul className="space-y-3 text-sm leading-6 text-ink">
                  {aset.aturan.map((a) => <li key={a} className="flex gap-3"><CircleCheck size={16} className="mt-1 shrink-0 text-sky" /> {a}</li>)}
                  {aset.dokumenKhusus && <li className="flex gap-3 font-semibold text-navy"><CircleCheck size={16} className="mt-1 shrink-0 text-sun" /> {aset.dokumenKhusus}</li>}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="rounded-2xl bg-white p-7 shadow-card" aria-labelledby="kal">
          <h2 id="kal" className="text-2xl font-bold text-navy">Kalender Ketersediaan</h2>
          <span className="mt-2 block h-1 w-12 rounded-full bg-sun" />
          <p className="mb-7 mt-3 text-sm text-ink">Pilih tanggal untuk melihat ketersediaan jam operasional {isRuangan ? "ruangan" : "aset"}.</p>
          <Kalender aset={aset} tanggal={tanggal} setTanggal={setTanggal} />
        </section>
      </div>
      <PanelSewa aset={aset} tanggal={tanggal} setTanggal={setTanggal} />
    </div>
  );
}
