import Link from "next/link";
import { MapPin, Users, Boxes, CircleCheck, Wrench, CircleX, Clock3, Archive, ShieldCheck } from "lucide-react";
import AsetImage from "./AsetImage";
import { rupiah, satuanLabel } from "@/lib/data";

export function StatusBadge({ aset }) {
  if (aset.status === "Tersedia")
    return <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600"><CircleCheck size={15} /> Tersedia</span>;
  if (aset.status === "Terisi")
    return <span className="flex items-center gap-1 text-[13px] font-semibold text-orange-500"><Clock3 size={15} /> Terisi</span>;
  return (
    <span className="flex items-start gap-1 text-right text-[13px] font-semibold leading-tight text-red-600">
      <CircleX size={15} className="mt-0.5 shrink-0" />
      <span>Tidak tersedia{aset.statusKet ? ` (${aset.statusKet})` : ""}</span>
    </span>
  );
}

export default function AsetCard({ aset, variant = "katalog" }) {
  const isRuangan = aset.kategori === "ruangan";
  const nonaktif = aset.status === "Tidak tersedia";
  const rusak = aset.kondisi.toLowerCase().includes("pemeliharaan");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-pale bg-white shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-pop">
      <div className="h-56 overflow-hidden bg-slate-100">
        <div className="h-full w-full transition duration-700 group-hover:scale-105">
          <AsetImage aset={aset} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        {variant === "katalog" && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <span className="whitespace-nowrap text-xs font-bold tracking-wider text-slate-500">{aset.kode}</span>
            <StatusBadge aset={aset} />
          </div>
        )}
        <h3 className="text-xl font-bold leading-7 text-navy">{aset.nama}</h3>
        <ul className="mt-3.5 space-y-2 text-sm text-ink">
          <li className="flex items-center gap-2.5">
            {isRuangan ? <MapPin size={16} className="shrink-0 text-sky" /> : variant === "katalog" ? <Archive size={16} className="shrink-0 text-sky" /> : <ShieldCheck size={16} className="shrink-0 text-sky" />}
            <span>{aset.lokasi}</span>
          </li>
          <li className="flex items-center gap-2.5">
            {isRuangan ? <Users size={16} className="shrink-0 text-sky" /> : <Boxes size={16} className="shrink-0 text-sky" />}
            <span>{isRuangan ? `Kapasitas ${aset.kapasitas} ${aset.kapasitasSatuan ?? "orang"}` : `Tersedia ${aset.stok} ${aset.stokSatuan ?? "unit"}`}</span>
          </li>
          {variant === "katalog" && (
            <li className={`flex items-center gap-2.5 font-semibold ${rusak ? "text-red-600" : "text-sky"}`}>
              {rusak ? <Wrench size={16} className="shrink-0" /> : <CircleCheck size={16} className="shrink-0" />}
              <span>Kondisi: {aset.kondisi}</span>
            </li>
          )}
        </ul>
        <div className="mt-auto pt-6">
          <div className="border-t border-pale pt-5">
            {variant === "katalog" && <p className="text-xs text-slate-500">Tarif</p>}
            <p className="mb-4 text-lg font-bold text-sky">
              <span className={variant === "katalog" ? "text-2xl text-navy" : ""}>{rupiah(aset.tarif)}</span>
              <span className={variant === "katalog" ? "text-sm font-medium text-slate-500" : ""}> / {satuanLabel(aset.satuan)}</span>
            </p>
            {nonaktif ? (
              <span className="block w-full cursor-not-allowed rounded-xl bg-pale py-2.5 text-center text-sm font-bold text-white/90">Lihat Detail</span>
            ) : (
              <Link
                href={`/aset/${aset.slug}`}
                className="block w-full rounded-xl border-2 border-sky py-2.5 text-center text-sm font-bold text-sky transition hover:bg-sky hover:text-white"
              >
                Lihat Detail
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
