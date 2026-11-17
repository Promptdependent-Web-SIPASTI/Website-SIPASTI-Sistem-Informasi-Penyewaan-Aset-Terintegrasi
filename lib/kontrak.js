"use client";

// Pembuatan dokumen kontrak sewa (.docx) di sisi peramban memakai library `docx`.
// Tidak memerlukan database: seluruh isi diambil dari data transaksi (dan salinan parameter pada t.kontrak).
import { getAset, rupiah } from "./data";
import { BULAN, HARI_PANJANG, fromISO } from "./waktu";
import { batasKembaliMs, fmtJam, rumusBiaya, pastikanKontrak, TIPE_LABEL } from "./transaksi";

export const PIHAK_PERTAMA = {
  nama: "Prof. Dr. Edy Cahyono, M.Si.",
  nip: "196412051990021001",
  jabatan: "Dekan Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Negeri Semarang",
  jabatanPendek: "Dekan FMIPA UNNES",
};
const REKENING = "Bank Mandiri 1370 0192 8472 001 a.n. FMIPA UNNES";

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
export function terbilang(n) {
  n = Math.floor(n);
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${terbilang(n - 10)} belas`;
  if (n < 100) return `${terbilang(Math.floor(n / 10))} puluh${n % 10 ? " " + terbilang(n % 10) : ""}`;
  if (n < 200) return `seratus${n - 100 ? " " + terbilang(n - 100) : ""}`;
  if (n < 1000) return `${terbilang(Math.floor(n / 100))} ratus${n % 100 ? " " + terbilang(n % 100) : ""}`;
  if (n < 2000) return `seribu${n - 1000 ? " " + terbilang(n - 1000) : ""}`;
  if (n < 1e6) return `${terbilang(Math.floor(n / 1000))} ribu${n % 1000 ? " " + terbilang(n % 1000) : ""}`;
  if (n < 1e9) return `${terbilang(Math.floor(n / 1e6))} juta${n % 1e6 ? " " + terbilang(n % 1e6) : ""}`;
  return `${terbilang(Math.floor(n / 1e9))} miliar${n % 1e9 ? " " + terbilang(n % 1e9) : ""}`;
}

const tglPanjang = (d) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
const hariTgl = (d) => `${HARI_PANJANG[d.getDay()]}, ${tglPanjang(d)}`;

function periode(t) {
  const a = fromISO(t.tanggalMulai);
  if (t.satuan === "jam") return `${hariTgl(a)}, pukul ${fmtJam(t.jamMulai)} sampai dengan ${fmtJam(t.jamSelesai)} WIB (${t.durasi} jam)`;
  if (t.tanggalSelesai && t.tanggalSelesai !== t.tanggalMulai) return `${hariTgl(a)} sampai dengan ${hariTgl(fromISO(t.tanggalSelesai))} (${t.durasi} hari)`;
  return `${hariTgl(a)} (1 ${t.satuan === "hari" ? "hari" : "kegiatan"})`;
}

export async function bangunKontrak(t) {
  const kontrak = pastikanKontrak(t);
  const aset = getAset(t.asetSlug);
  const L = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun, Footer, PageNumber } = L;

  const FONT = "Times New Roman";
  const SIZE = 23;
  const tebal = (x) => (typeof x === "string" ? { text: x } : x);
  const runs = (isi, ekstra = {}) => (Array.isArray(isi) ? isi : [isi]).map((x) => new TextRun({ font: FONT, size: SIZE, ...ekstra, ...(typeof x === "string" ? { text: x } : { text: x.t, bold: !!x.b, italics: !!x.i }) }));
  const par = (isi, o = {}) => new Paragraph({ children: runs(isi, o.run), alignment: o.align ?? AlignmentType.JUSTIFIED, spacing: { after: o.after ?? 100, before: o.before ?? 0, line: 276 }, indent: o.indent, keepNext: o.keepNext, border: o.border });
  const ayat = (no, isi) => par([`(${no})  `, ...(Array.isArray(isi) ? isi : [isi])], { indent: { left: 482, hanging: 482 } });
  const pasal = (no, judul) => [
    new Paragraph({ children: [new TextRun({ text: `Pasal ${no}`, bold: true, font: FONT, size: SIZE })], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 0 }, keepNext: true }),
    new Paragraph({ children: [new TextRun({ text: judul.toUpperCase(), bold: true, font: FONT, size: SIZE })], alignment: AlignmentType.CENTER, spacing: { after: 100 }, keepNext: true }),
  ];

  const tanpaGaris = { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } };
  const sel = (isi, lebar, o = {}) => new TableCell({ width: { size: lebar, type: WidthType.DXA }, borders: o.garis ?? tanpaGaris, margins: { top: 40, bottom: 40, left: 80, right: 80 }, shading: o.isi ? { fill: o.isi, type: "clear", color: "auto" } : undefined, children: Array.isArray(isi) && isi[0] instanceof Paragraph ? isi : [par(isi, { align: o.align ?? AlignmentType.LEFT, after: 0 })] });
  const identitas = (baris) => new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [2300, 300, 6426], borders: { ...tanpaGaris, insideHorizontal: tanpaGaris.top, insideVertical: tanpaGaris.top }, rows: baris.map(([k, v]) => new TableRow({ children: [sel(k, 2300), sel(":", 300), sel(v, 6426)] })) });
  const garis = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
  const kotak = { top: garis, bottom: garis, left: garis, right: garis };
  const tabelObjek = (baris) => new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [2800, 6226], rows: baris.map(([k, v]) => new TableRow({ children: [sel([{ t: k, b: true }], 2800, { garis: kotak, isi: "EAF5FF" }), sel(v, 6226, { garis: kotak })] })) });

  // logo
  let logo = null;
  try {
    const res = await fetch("/logo/logo-icon.png");
    if (res.ok) logo = await res.arrayBuffer();
  } catch {}
  const kop = new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [1300, 7726], borders: { ...tanpaGaris, insideHorizontal: tanpaGaris.top, insideVertical: tanpaGaris.top },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 1300, type: WidthType.DXA }, borders: tanpaGaris, children: [new Paragraph({ children: logo ? [new ImageRun({ type: "png", data: logo, transformation: { width: 66, height: 55 } })] : [] })] }),
      new TableCell({ width: { size: 7726, type: WidthType.DXA }, borders: tanpaGaris, children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "UNIVERSITAS NEGERI SEMARANG", bold: true, font: FONT, size: 26 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "FAKULTAS MATEMATIKA DAN ILMU PENGETAHUAN ALAM", bold: true, font: FONT, size: 24 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "Kampus Sekaran, Gunungpati, Semarang 50229", font: FONT, size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "Surel: sipasti@fmipa.unnes.ac.id · Telepon (024) 8508032", font: FONT, size: 20 })] }),
      ] }),
    ] })],
  });

  const tgl = new Date(kontrak.tanggal);
  const idnLabel = t.penyewa?.tipe === "mahasiswa" ? "NIM" : "NIP";
  const tipeLabel = TIPE_LABEL[t.penyewa?.tipe] ?? "Penyewa";
  const unit = t.penyewa?.unit ?? "";
  const statusPenyewa = unit ? (unit.toLowerCase().startsWith(tipeLabel.toLowerCase()) ? unit : `${tipeLabel} — ${unit}`) : tipeLabel;
  const lokasi = aset?.lokasi ?? "";
  const jumlahTeks = t.kategori === "ruangan" ? "1 (satu) ruangan/fasilitas" : `${t.jumlah} ${aset?.stokSatuan ?? "unit"}`;
  const batasKembali = new Date(batasKembaliMs(t));
  const batasTeks = `${hariTgl(batasKembali)}, pukul ${String(batasKembali.getHours()).padStart(2, "0")}.${String(batasKembali.getMinutes()).padStart(2, "0")} WIB`;
  const dendaPersen = kontrak.dendaPersen ?? 10;
  const toleransi = kontrak.toleransiMenit ?? 30;
  const satuanDenda = t.satuan === "jam" ? "jam" : "hari";
  const nominal = rupiah(t.total);

  const isi = [
    kop,
    new Paragraph({ border: { bottom: { color: "002C55", size: 18, style: BorderStyle.SINGLE, space: 1 } }, spacing: { after: 160 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "PERJANJIAN SEWA ASET", bold: true, font: FONT, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "FASILITAS DAN PERALATAN FMIPA UNNES", bold: true, font: FONT, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 }, children: [new TextRun({ text: `Nomor: ${kontrak.nomor}`, font: FONT, size: SIZE })] }),

    par(`Pada hari ini, ${hariTgl(tgl)}, bertempat di Kampus Sekaran, Gunungpati, Semarang, yang bertanda tangan di bawah ini:`),
    identitas([
      ["Nama", [{ t: PIHAK_PERTAMA.nama, b: true }]],
      ["NIP", PIHAK_PERTAMA.nip],
      ["Jabatan", PIHAK_PERTAMA.jabatan],
    ]),
    par("dalam hal ini bertindak untuk dan atas nama Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Negeri Semarang, selanjutnya disebut PIHAK PERTAMA; dan", { before: 80 }),
    identitas([
      ["Nama", [{ t: t.penyewa?.nama ?? t.email, b: true }]],
      [idnLabel, t.penyewa?.idn || "-"],
      ["Status", statusPenyewa],
      ["Surel", t.email],
    ]),
    par("dalam hal ini bertindak untuk diri sendiri/atas nama kegiatan yang diajukan, selanjutnya disebut PIHAK KEDUA.", { before: 80 }),
    par("PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut PARA PIHAK, dan sepakat mengikatkan diri dalam Perjanjian Sewa Aset dengan ketentuan sebagai berikut:"),

    ...pasal(1, "Objek Sewa"),
    par("PIHAK PERTAMA menyewakan kepada PIHAK KEDUA aset dengan rincian sebagai berikut:"),
    tabelObjek([
      ["Nomor transaksi", t.kode],
      ["Nama aset", `${aset?.nama2 ?? t.asetNama} (${t.kodeAset})`],
      ["Lokasi / pengelola", lokasi],
      ["Jumlah", jumlahTeks],
      ["Satuan sewa", `Per ${t.satuan === "unit" ? "unit" : t.satuan}`],
      ["Tujuan penggunaan", t.tujuan],
    ]),

    ...pasal(2, "Jangka Waktu"),
    ayat(1, `Jangka waktu sewa adalah ${periode(t)}.`),
    ayat(2, `Aset wajib dikembalikan paling lambat ${batasTeks}.`),
    ayat(3, "Penggunaan aset hanya dapat dilakukan pada hari Senin sampai Sabtu, pada pukul 07.00–11.30 WIB dan 12.30–18.00 WIB."),

    ...pasal(3, "Biaya dan Pembayaran"),
    ayat(1, [`Biaya sewa sebesar `, { t: `${nominal} (${terbilang(t.total)} rupiah)`, b: true }, ` dengan perhitungan ${rumusBiaya(t)}.`]),
    ayat(2, `PIHAK KEDUA telah melakukan pembayaran melalui rekening resmi Fakultas (${REKENING}), dan pembayaran tersebut telah diverifikasi serta dinyatakan lunas oleh PIHAK PERTAMA pada ${tglPanjang(tgl)}.`),
    ayat(3, "Tarif yang berlaku adalah tarif pada saat pengajuan dan tidak berubah meskipun terjadi perubahan tarif di kemudian hari."),

    ...pasal(4, "Hak dan Kewajiban PIHAK PERTAMA"),
    ayat(1, "Menyediakan aset sesuai jadwal dan kondisi yang telah disepakati, serta mencatat serah terima melalui petugas yang ditunjuk."),
    ayat(2, "Berhak menolak atau menghentikan penggunaan aset apabila PIHAK KEDUA melanggar ketentuan perjanjian ini atau peraturan yang berlaku di lingkungan universitas."),
    ayat(3, "Menerbitkan bukti pembayaran dan dokumen perjanjian ini setelah pembayaran dinyatakan lunas."),

    ...pasal(5, "Hak dan Kewajiban PIHAK KEDUA"),
    ayat(1, "Menggunakan aset hanya untuk tujuan sebagaimana tercantum dalam Pasal 1 dan tidak memindahtangankan penggunaannya kepada pihak lain."),
    ayat(2, "Menjaga kebersihan, keamanan, dan kondisi aset selama jangka waktu sewa, serta mematuhi arahan petugas."),
    ayat(3, "Mengembalikan aset tepat waktu dan dalam kondisi sebagaimana saat diterima."),
    ayat(4, "Menanggung kerusakan atau kehilangan aset yang terjadi selama jangka waktu sewa sesuai Pasal 8."),

    ...pasal(6, "Pembatalan dan Pengembalian Dana"),
    ayat(1, "Pembatalan sebelum pengajuan disetujui tidak dikenai biaya."),
    ayat(2, "Pembatalan setelah pengajuan disetujui dan dibayar mendapat pengembalian dana sebesar 100% apabila dibatalkan H-3 atau lebih awal, 50% apabila dibatalkan pada rentang H-2 sampai H-1, dan 0% apabila dibatalkan kurang dari H-1 atau PIHAK KEDUA tidak hadir."),
    ayat(3, "Apabila pembatalan dilakukan oleh PIHAK PERTAMA, PIHAK KEDUA berhak atas pengembalian dana sebesar 100%."),

    ...pasal(7, "Keterlambatan dan Denda"),
    ayat(1, `Keterlambatan pengembalian dikenai denda sebesar ${dendaPersen}% dari tarif satuan untuk setiap ${satuanDenda} keterlambatan, dengan toleransi ${toleransi} menit, dikalikan jumlah unit, dan paling banyak 100% dari total biaya sewa.`),
    ayat(2, "Denda dihitung dan dicatat oleh sistem berdasarkan waktu pengembalian aktual yang dicatat petugas."),

    ...pasal(8, "Kerusakan dan Kehilangan"),
    ayat(1, "Kerusakan atau kehilangan aset yang disebabkan oleh PIHAK KEDUA wajib diganti sebesar biaya perbaikan atau nilai penggantian aset."),
    ayat(2, "Besaran penggantian diusulkan petugas berdasarkan pemeriksaan saat pengembalian dan ditetapkan oleh PIHAK PERTAMA."),

    ...pasal(9, "Penyelesaian Perselisihan"),
    par("Apabila terjadi perselisihan dalam pelaksanaan perjanjian ini, PARA PIHAK akan menyelesaikannya secara musyawarah untuk mufakat. Apabila tidak tercapai kesepakatan, penyelesaian dilakukan sesuai peraturan perundang-undangan yang berlaku."),

    ...pasal(10, "Penutup"),
    ayat(1, "Perjanjian ini berlaku sejak tanggal ditetapkan dan berakhir setelah seluruh hak dan kewajiban PARA PIHAK terpenuhi."),
    ayat(2, "Perjanjian ini dibuat dalam rangkap 2 (dua), masing-masing bermaterai cukup apabila diperlukan dan mempunyai kekuatan hukum yang sama."),

    par("", { after: 120 }),
    new Table({
      width: { size: 9026, type: WidthType.DXA }, columnWidths: [4513, 4513], borders: { ...tanpaGaris, insideHorizontal: tanpaGaris.top, insideVertical: tanpaGaris.top },
      rows: [new TableRow({ cantSplit: true, children: [
        sel([
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "PIHAK PERTAMA", bold: true, font: FONT, size: SIZE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 }, children: [new TextRun({ text: PIHAK_PERTAMA.jabatanPendek, font: FONT, size: SIZE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: PIHAK_PERTAMA.nama, bold: true, underline: {}, font: FONT, size: SIZE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: `NIP ${PIHAK_PERTAMA.nip}`, font: FONT, size: SIZE })] }),
        ], 4513),
        sel([
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "PIHAK KEDUA", bold: true, font: FONT, size: SIZE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 }, children: [new TextRun({ text: "Penyewa", font: FONT, size: SIZE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: t.penyewa?.nama ?? t.email, bold: true, underline: {}, font: FONT, size: SIZE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: `${idnLabel} ${t.penyewa?.idn || "-"}`, font: FONT, size: SIZE })] }),
        ], 4513),
      ] })],
    }),
  ];

  const doc = new Document({
    creator: "SIPASTI FMIPA UNNES",
    title: `Perjanjian Sewa Aset ${kontrak.nomor}`,
    description: `Perjanjian sewa aset untuk transaksi ${t.kode}`,
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1440, right: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: `Dokumen dibuat otomatis oleh SIPASTI · ${t.kode} · ${kontrak.nomor} · Halaman `, font: FONT, size: 16, color: "666666" }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "666666" }),
        new TextRun({ text: " dari ", font: FONT, size: 16, color: "666666" }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: "666666" }),
      ] })] }) },
      children: isi,
    }],
  });
  const blob = await Packer.toBlob(doc);
  return { blob, nama: `Kontrak-Sewa-${t.kode}.docx`, nomor: kontrak.nomor };
}

export async function unduhKontrak(t) {
  const { blob, nama } = await bangunKontrak(t);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return nama;
}
