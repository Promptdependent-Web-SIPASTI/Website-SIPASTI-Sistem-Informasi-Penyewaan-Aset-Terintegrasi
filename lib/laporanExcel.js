"use client";

// Ekspor laporan tahunan ke Excel (.xlsx) di sisi peramban memakai `exceljs`.
// Total dibuat sebagai rumus Excel sehingga ikut berubah bila data pada sheet diedit.
import { TIPE_LABEL, STATUS_TRX, STATUS_BAYAR } from "./transaksi";

const NAVY = "FF002C55", PALE = "FFD4EAFE", SOFT = "FFEAF5FF", RUPIAH = '"Rp"#,##0;[Red]-"Rp"#,##0';

export async function bangunExcel(lap, { dibuatOleh = "Admin SIPASTI" } = {}) {
  const ExcelJS = (await import("exceljs")).default ?? (await import("exceljs"));
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIPASTI FMIPA UNNES";
  wb.created = new Date();

  const kepala = (ws, baris, labels) => {
    const r = ws.getRow(baris);
    labels.forEach((l, i) => { r.getCell(i + 1).value = l; });
    r.height = 30;
    r.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });
  };
  const garis = (row, n) => { for (let i = 1; i <= n; i++) row.getCell(i).border = { top: { style: "thin", color: { argb: "FFBBBBBB" } }, bottom: { style: "thin", color: { argb: "FFBBBBBB" } }, left: { style: "thin", color: { argb: "FFBBBBBB" } }, right: { style: "thin", color: { argb: "FFBBBBBB" } } }; };
  const judul = (ws, teks, sub, lebarKolom) => {
    ws.mergeCells(1, 1, 1, lebarKolom); ws.getCell(1, 1).value = teks; ws.getCell(1, 1).font = { bold: true, size: 15, color: { argb: NAVY } };
    ws.mergeCells(2, 1, 2, lebarKolom); ws.getCell(2, 1).value = sub; ws.getCell(2, 1).font = { italic: true, size: 10, color: { argb: "FF555555" } };
    ws.getRow(1).height = 24;
  };
  const rowTotal = (ws, baris, n) => { const r = ws.getRow(baris); r.font = { bold: true }; for (let i = 1; i <= n; i++) { const c = r.getCell(i); c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALE } }; c.border = { top: { style: "medium", color: { argb: NAVY } }, bottom: { style: "thin" } }; } };
  const sub = `Fakultas Matematika dan Ilmu Pengetahuan Alam UNNES · Tahun ${lap.tahun} · Dicetak ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} oleh ${dibuatOleh}`;

  /* ---- Sheet 2: Per Bulan (dibuat dulu agar sheet Ringkasan dapat merujuknya) ---- */
  const ringkasan = wb.addWorksheet("Ringkasan");
  const bln = wb.addWorksheet("Per Bulan");
  judul(bln, `Rekap Per Bulan — ${lap.tahun}`, sub, 8);
  kepala(bln, 4, ["Bulan", "Jumlah Transaksi", "Penyewa Unik", "Pendapatan Sewa (Rp)", "Refund (Rp)", "Denda Lunas (Rp)", "Pendapatan Bersih (Rp)", "Keterangan"]);
  lap.perBulan.forEach((b, i) => {
    const n = 5 + i; const r = bln.getRow(n);
    r.getCell(1).value = b.bulan; r.getCell(2).value = b.transaksi; r.getCell(3).value = b.penyewa; r.getCell(4).value = b.sewa; r.getCell(5).value = b.refund; r.getCell(6).value = b.denda;
    r.getCell(7).value = { formula: `D${n}-E${n}+F${n}`, result: b.bersih };
    r.getCell(8).value = b.transaksi === 0 ? "Tidak ada transaksi" : "";
    [4, 5, 6, 7].forEach((c) => { r.getCell(c).numFmt = RUPIAH; }); garis(r, 8);
    if (i % 2 === 1) for (let c = 1; c <= 8; c++) r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT } };
  });
  const tb = 5 + 12;
  bln.getRow(tb).getCell(1).value = "TOTAL";
  ["B", "C", "D", "E", "F", "G"].forEach((k, i) => { bln.getCell(`${k}${tb}`).value = { formula: `SUM(${k}5:${k}${tb - 1})`, result: [lap.total.transaksi, lap.perBulan.reduce((s, b) => s + b.penyewa, 0), lap.total.sewa, lap.total.refund, lap.total.denda, lap.total.bersih][i] }; if (i >= 2) bln.getCell(`${k}${tb}`).numFmt = RUPIAH; });
  rowTotal(bln, tb, 8);
  bln.getCell(`H${tb}`).value = "Penyewa unik per bulan dijumlahkan";
  bln.columns = [{ width: 16 }, { width: 14 }, { width: 14 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 24 }, { width: 34 }];
  bln.views = [{ state: "frozen", ySplit: 4 }];

  /* ---- Ringkasan ---- */
  judul(ringkasan, `Laporan Tahunan Penyewaan Aset — ${lap.tahun}`, sub, 3);
  const baris = [
    ["Jumlah transaksi dihitung", { formula: `'Per Bulan'!B${tb}`, result: lap.total.transaksi }, "Penyewaan terkonfirmasi (disetujui s.d. selesai) dan pembatalan yang sudah dibayar"],
    ["Penyewa unik (setahun)", lap.total.penyewa, "Jumlah orang berbeda yang menyewa pada tahun ini"],
    ["Pendapatan sewa", { formula: `'Per Bulan'!D${tb}`, result: lap.total.sewa }, "Pembayaran yang sudah berstatus lunas"],
    ["Refund ditransfer", { formula: `'Per Bulan'!E${tb}`, result: lap.total.refund }, "Pengembalian dana yang sudah diproses"],
    ["Denda lunas", { formula: `'Per Bulan'!F${tb}`, result: lap.total.denda }, "Denda keterlambatan dan kerusakan yang sudah dibayar"],
    ["Pendapatan bersih", { formula: `'Per Bulan'!G${tb}`, result: lap.total.bersih }, "Pendapatan sewa − refund + denda lunas"],
  ];
  kepala(ringkasan, 4, ["Indikator", "Nilai", "Keterangan"]);
  baris.forEach(([k, v, ket], i) => {
    const r = ringkasan.getRow(5 + i); r.getCell(1).value = k; r.getCell(2).value = v; r.getCell(3).value = ket;
    if (i >= 2) r.getCell(2).numFmt = RUPIAH; r.getCell(2).alignment = { horizontal: "right" }; garis(r, 3);
    if (i === 5) { r.font = { bold: true }; for (let c = 1; c <= 3; c++) r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALE } }; }
  });
  ringkasan.getCell("A12").value = "Catatan: periode ditentukan berdasarkan tanggal pemakaian aset. Total pada sheet ini dihitung dengan rumus dari sheet lainnya.";
  ringkasan.getCell("A12").font = { italic: true, size: 10, color: { argb: "FF555555" } };
  ringkasan.columns = [{ width: 30 }, { width: 24 }, { width: 70 }];

  /* ---- Penyewa ---- */
  const pw = wb.addWorksheet("Penyewa");
  judul(pw, `Daftar Penyewa — ${lap.tahun}`, sub, 10);
  kepala(pw, 4, ["No", "Nama Penyewa", "Tipe", "NIM / NIP", "Unit / Prodi", "Jumlah Transaksi", "Pendapatan Sewa (Rp)", "Refund (Rp)", "Denda Lunas (Rp)", "Pendapatan Bersih (Rp)"]);
  lap.penyewa.forEach((p, i) => {
    const n = 5 + i; const r = pw.getRow(n);
    r.getCell(1).value = i + 1; r.getCell(2).value = p.nama; r.getCell(3).value = p.tipe; r.getCell(4).value = String(p.idn); r.getCell(5).value = p.unit; r.getCell(6).value = p.transaksi;
    r.getCell(7).value = p.sewa; r.getCell(8).value = p.refund; r.getCell(9).value = p.denda; r.getCell(10).value = { formula: `G${n}-H${n}+I${n}`, result: p.bersih };
    [7, 8, 9, 10].forEach((c) => { r.getCell(c).numFmt = RUPIAH; }); r.getCell(4).numFmt = "@"; garis(r, 10);
  });
  const tp = 5 + lap.penyewa.length;
  pw.getCell(`A${tp}`).value = "TOTAL";
  ["F", "G", "H", "I", "J"].forEach((k, i) => { pw.getCell(`${k}${tp}`).value = { formula: `SUM(${k}5:${k}${Math.max(5, tp - 1)})`, result: [lap.total.transaksi, lap.total.sewa, lap.total.refund, lap.total.denda, lap.total.bersih][i] }; if (i >= 1) pw.getCell(`${k}${tp}`).numFmt = RUPIAH; });
  rowTotal(pw, tp, 10);
  pw.columns = [{ width: 6 }, { width: 24 }, { width: 12 }, { width: 22 }, { width: 28 }, { width: 14 }, { width: 22 }, { width: 16 }, { width: 18 }, { width: 24 }];
  pw.views = [{ state: "frozen", ySplit: 4 }];
  if (lap.penyewa.length) pw.autoFilter = { from: "A4", to: "J4" };

  /* ---- Per Aset ---- */
  const pa = wb.addWorksheet("Per Aset");
  judul(pa, `Rekap Per Aset — ${lap.tahun}`, sub, 8);
  kepala(pa, 4, ["No", "Kode", "Nama Aset", "Kategori", "Jumlah Transaksi", "Pendapatan Sewa (Rp)", "Refund + Denda (Rp)", "Pendapatan Bersih (Rp)"]);
  lap.perAset.forEach((a, i) => {
    const n = 5 + i; const r = pa.getRow(n);
    r.getCell(1).value = i + 1; r.getCell(2).value = a.kode; r.getCell(3).value = a.nama; r.getCell(4).value = a.kategori; r.getCell(5).value = a.transaksi; r.getCell(6).value = a.sewa;
    r.getCell(7).value = a.denda - a.refund; r.getCell(8).value = { formula: `F${n}+G${n}`, result: a.bersih };
    [6, 7, 8].forEach((c) => { r.getCell(c).numFmt = RUPIAH; }); garis(r, 8);
  });
  const ta = 5 + lap.perAset.length;
  pa.getCell(`A${ta}`).value = "TOTAL";
  ["E", "F", "G", "H"].forEach((k, i) => { pa.getCell(`${k}${ta}`).value = { formula: `SUM(${k}5:${k}${Math.max(5, ta - 1)})`, result: [lap.total.transaksi, lap.total.sewa, lap.total.denda - lap.total.refund, lap.total.bersih][i] }; if (i >= 1) pa.getCell(`${k}${ta}`).numFmt = RUPIAH; });
  rowTotal(pa, ta, 8);
  pa.columns = [{ width: 6 }, { width: 10 }, { width: 34 }, { width: 28 }, { width: 14 }, { width: 22 }, { width: 20 }, { width: 24 }];
  pa.views = [{ state: "frozen", ySplit: 4 }];

  /* ---- Detail Transaksi ---- */
  const dt = wb.addWorksheet("Detail Transaksi");
  judul(dt, `Detail Transaksi — ${lap.tahun}`, sub, 15);
  kepala(dt, 4, ["No", "No. Transaksi", "Tanggal Pakai", "Penyewa", "Tipe", "NIM / NIP", "Aset", "Kategori", "Jumlah", "Status", "Status Bayar", "Dibayar (Rp)", "Refund (Rp)", "Denda Lunas (Rp)", "Pendapatan Bersih (Rp)"]);
  lap.baris.forEach((x, i) => {
    const n = 5 + i; const r = dt.getRow(n); const t = x.t;
    r.getCell(1).value = i + 1; r.getCell(2).value = t.kode; r.getCell(3).value = new Date(t.tanggalMulai + "T00:00:00"); r.getCell(3).numFmt = "dd mmm yyyy";
    r.getCell(4).value = t.penyewa?.nama ?? t.email; r.getCell(5).value = TIPE_LABEL[t.penyewa?.tipe] ?? ""; r.getCell(6).value = String(t.penyewa?.idn ?? ""); r.getCell(6).numFmt = "@";
    r.getCell(7).value = t.asetNama; r.getCell(8).value = t.kategori === "ruangan" ? "Fasilitas dan Ruangan" : "Peralatan dan Perlengkapan"; r.getCell(9).value = t.kategori === "ruangan" ? 1 : t.jumlah;
    r.getCell(10).value = STATUS_TRX[t.status]?.label ?? t.status; r.getCell(11).value = STATUS_BAYAR[t.pembayaran]?.label ?? t.pembayaran;
    r.getCell(12).value = x.sewa; r.getCell(13).value = x.refund; r.getCell(14).value = x.denda; r.getCell(15).value = { formula: `L${n}-M${n}+N${n}`, result: x.bersih };
    [12, 13, 14, 15].forEach((c) => { r.getCell(c).numFmt = RUPIAH; }); garis(r, 15);
  });
  const td = 5 + lap.baris.length;
  dt.getCell(`A${td}`).value = "TOTAL";
  ["L", "M", "N", "O"].forEach((k, i) => { dt.getCell(`${k}${td}`).value = { formula: `SUM(${k}5:${k}${Math.max(5, td - 1)})`, result: [lap.total.sewa, lap.total.refund, lap.total.denda, lap.total.bersih][i] }; dt.getCell(`${k}${td}`).numFmt = RUPIAH; });
  rowTotal(dt, td, 15);
  dt.columns = [{ width: 6 }, { width: 14 }, { width: 14 }, { width: 22 }, { width: 12 }, { width: 22 }, { width: 32 }, { width: 28 }, { width: 9 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 14 }, { width: 18 }, { width: 22 }];
  dt.views = [{ state: "frozen", ySplit: 4, xSplit: 2 }];
  if (lap.baris.length) dt.autoFilter = { from: "A4", to: "O4" };

  wb.eachSheet((ws) => { ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 }; });
  const buf = await wb.xlsx.writeBuffer();
  return { blob: new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nama: `Laporan-SIPASTI-${lap.tahun}.xlsx` };
}

export async function unduhExcel(lap, opsi) {
  const { blob, nama } = await bangunExcel(lap, opsi);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return nama;
}
