// Ekspor CSV sederhana di sisi peramban (fitur ekspor rekap).
export function unduhCsv(namaFile, baris) {
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const isi = "\ufeff" + baris.map((r) => r.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  a.click();
  URL.revokeObjectURL(url);
}
