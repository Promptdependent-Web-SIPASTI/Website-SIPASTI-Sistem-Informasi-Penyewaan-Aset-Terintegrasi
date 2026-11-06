"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileText, CircleCheck, Trash2, CircleAlert } from "lucide-react";

const OK = ["application/pdf", "image/jpeg", "image/png"];
const MAKS = 5 * 1024 * 1024;
const ukuranTeks = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Hanya menyimpan metadata berkas (nama dan ukuran) — unggah sungguhan menyusul via Supabase Storage.
export default function UploadBox({ judul, keterangan, ikon: Ikon = CloudUpload, nilai, onChange, galat, id }) {
  const ref = useRef(null);
  const [seret, setSeret] = useState(false);
  const [lokal, setLokal] = useState("");

  function proses(file) {
    if (!file) return;
    if (!OK.includes(file.type)) return setLokal("Format berkas harus PDF, JPG, atau PNG.");
    if (file.size > MAKS) return setLokal("Ukuran berkas maksimal 5 MB.");
    setLokal("");
    onChange({ nama: file.name, ukuran: ukuranTeks(file.size) });
  }
  const pesan = lokal || galat;

  if (nilai) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-sky/40 bg-soft px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-sky"><FileText size={20} /></span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-bold text-navy"><span className="truncate">{nilai.nama}</span> <CircleCheck size={15} className="shrink-0 text-emerald-600" /></p>
            <p className="text-xs text-slate-500">{nilai.ukuran} · Terunggah</p>
          </div>
        </div>
        <button type="button" onClick={() => onChange(null)} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14} /> Hapus</button>
      </div>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
        onDragLeave={() => setSeret(false)}
        onDrop={(e) => { e.preventDefault(); setSeret(false); proses(e.dataTransfer.files?.[0]); }}
        className={`flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${pesan ? "border-red-300 bg-red-50/40" : seret ? "border-sky bg-pale" : "border-sky/40 bg-soft hover:border-sky hover:bg-pale/60"}`}
      >
        <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-white text-sky shadow-sm"><Ikon size={20} /></span>
        <span className="text-sm font-bold text-sky">{judul}</span>
        <span className="text-xs text-slate-500">{keterangan}</span>
      </button>
      <input ref={ref} id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => { proses(e.target.files?.[0]); e.target.value = ""; }} />
      {pesan && <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"><CircleAlert size={13} className="mt-0.5 shrink-0" /> {pesan}</p>}
    </div>
  );
}
