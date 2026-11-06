"use client";

import { useState } from "react";
import { Building2, FlaskConical, Presentation, Mic2, Armchair, Users } from "lucide-react";

const ICONS = {
  Aula: Presentation,
  Laboratorium: FlaskConical,
  "Ruang Rapat": Users,
  "Audio Visual": Mic2,
  "Perlengkapan Acara": Armchair,
};

// Memakai foto di /public/images/aset/<slug>.jpg bila ada; jika tidak, tampil placeholder bergradasi.
export default function AsetImage({ aset, className = "", iconSize = 56, label = true }) {
  const [gagal, setGagal] = useState(false);
  const Icon = ICONS[aset.subkategori] ?? Building2;
  if (!gagal && aset.foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={aset.foto}
        alt={aset.nama}
        ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setGagal(true); }}
        onError={() => setGagal(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-pale via-soft to-white ${className}`}>
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-sky/15" />
      <div className="absolute -bottom-12 -left-8 size-36 rounded-full bg-sun/25" />
      <div className="relative flex flex-col items-center gap-2 text-sky">
        <Icon size={iconSize} strokeWidth={1.5} />
        {label && <span className="text-[11px] font-semibold uppercase tracking-widest text-navy/50">{aset.subkategori}</span>}
      </div>
    </div>
  );
}
