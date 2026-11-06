"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { STATUS_TRX, STATUS_BAYAR } from "@/lib/transaksi";
import { useDetak } from "@/lib/useClient";

export function StatusTrx({ status, className = "" }) {
  const m = STATUS_TRX[status] ?? STATUS_TRX.diajukan;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${m.warna} ${className}`}>
      <span className={`size-1.5 rounded-full ${m.titik}`} /> {m.label}
    </span>
  );
}

export function StatusBayar({ status, className = "" }) {
  const m = STATUS_BAYAR[status] ?? STATUS_BAYAR.tidak_ada;
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${m.warna} ${className}`}>{m.label}</span>;
}

export function Kartu({ children, className = "", as: As = "section", ...rest }) {
  return (
    <As className={`min-w-0 rounded-2xl border border-pale/70 bg-white shadow-card ${className}`} {...rest}>
      {children}
    </As>
  );
}

export function JudulHalaman({ judul, sub, aksi }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy md:text-4xl">{judul}</h1>
        <span className="mt-3 block h-1 w-12 rounded-full bg-sun" />
        {sub && <p className="mt-3 max-w-2xl text-sm text-ink">{sub}</p>}
      </div>
      {aksi}
    </div>
  );
}

export function Remah({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
      {items.map((it, i) => (
        <span key={i}>
          {it.href ? <Link href={it.href} className="hover:text-sky">{it.label}</Link> : <b className="text-navy">{it.label}</b>}
          {i < items.length - 1 && <span className="mx-1.5">/</span>}
        </span>
      ))}
    </nav>
  );
}

// Hitung mundur menuju batas bayar (ms epoch). Memperbarui tiap 30 detik.
export function useSisaWaktu(batas) {
  const tick = useDetak();
  if (!batas) return null;
  const ms = batas - tick * 30000;
  if (ms <= 0) return { lewat: true, teks: "waktu habis", jam: 0, menit: 0 };
  const total = Math.floor(ms / 60000);
  return { lewat: false, jam: Math.floor(total / 60), menit: total % 60, teks: `${Math.floor(total / 60)} jam ${total % 60} menit` };
}

export function Sisa({ batas }) {
  const s = useSisaWaktu(batas);
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.lewat ? "text-red-600" : "text-orange-600"}`}>
      <Clock3 size={13} /> {s.lewat ? "Batas waktu terlewat" : `Sisa ${s.teks}`}
    </span>
  );
}
