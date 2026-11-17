"use client";

import { useState } from "react";
import { FileDown, LoaderCircle, CircleAlert } from "lucide-react";
import { unduhKontrak } from "@/lib/kontrak";

// Tombol unduh kontrak sewa (.docx). varian: "utama" (kuning), "garis" (outline), "kecil".
export default function TombolKontrak({ t, varian = "utama", label = "Unduh Kontrak Sewa (.docx)" }) {
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState("");
  const gaya = { utama: "w-full bg-sun py-3.5 text-sm text-navy shadow-md hover:-translate-y-0.5", garis: "border border-sky px-4 py-2 text-xs text-sky hover:bg-sky hover:text-white", kecil: "bg-sun px-4 py-2 text-xs text-navy shadow-sm hover:-translate-y-0.5" }[varian];

  async function klik() {
    setProses(true);
    setGalat("");
    try {
      await unduhKontrak(t);
    } catch (e) {
      console.error(e);
      setGalat("Gagal membuat dokumen. Coba lagi.");
    } finally {
      setProses(false);
    }
  }
  return (
    <span className={varian === "utama" ? "block" : "inline-block"}>
      <button type="button" onClick={klik} disabled={proses} className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:opacity-70 ${gaya}`}>
        {proses ? <LoaderCircle size={15} className="animate-spin" /> : <FileDown size={varian === "utama" ? 17 : 14} />} {proses ? "Menyusun dokumen…" : label}
      </button>
      {galat && <span role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><CircleAlert size={12} /> {galat}</span>}
    </span>
  );
}
