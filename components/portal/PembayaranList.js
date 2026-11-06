"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, CircleCheck, Hourglass, FileX2 } from "lucide-react";
import { Kartu, JudulHalaman, StatusBayar, Sisa } from "./ui";
import { useSesi } from "@/lib/useClient";
import { useTransaksi, asetTeks } from "@/lib/transaksi";
import { rupiah } from "@/lib/data";

const BASE = "/dashboard/penyewa";
const TAB = [
  ["perlu", "Perlu Dibayar", (t) => ["belum_dibayar", "bukti_ditolak"].includes(t.pembayaran) && t.status === "disetujui"],
  ["verifikasi", "Menunggu Verifikasi", (t) => t.pembayaran === "menunggu_verifikasi"],
  ["lunas", "Lunas", (t) => t.pembayaran === "lunas"],
  ["semua", "Semua", (t) => t.pembayaran !== "tidak_ada"],
];

export default function PembayaranList() {
  const sesi = useSesi();
  const { siap, items } = useTransaksi(sesi?.email);
  const [tab, setTab] = useState("perlu");
  const aktif = TAB.find((x) => x[0] === tab);
  const hasil = useMemo(() => items.filter(aktif[2]), [items, aktif]);
  if (!siap) return null;

  const totalPerlu = items.filter(TAB[0][2]).reduce((s, t) => s + t.total, 0);
  const ringkas = [
    { ikon: Wallet, label: "Total belum dibayar", nilai: rupiah(totalPerlu) },
    { ikon: Hourglass, label: "Menunggu verifikasi", nilai: `${items.filter(TAB[1][2]).length} transaksi` },
    { ikon: CircleCheck, label: "Pembayaran lunas", nilai: `${items.filter(TAB[2][2]).length} transaksi` },
  ];

  return (
    <div className="space-y-6">
      <JudulHalaman judul="Pembayaran" sub="Pembayaran dilakukan setelah pengajuan disetujui admin. Unggah bukti transfer pada halaman detail transaksi." />
      <div className="grid gap-4 sm:grid-cols-3">
        {ringkas.map(({ ikon: Icon, label, nilai }) => (
          <Kartu key={label} className="flex items-center gap-4 p-5">
            <span className="flex size-12 items-center justify-center rounded-xl bg-navy text-sun"><Icon size={22} /></span>
            <span><span className="block text-xs text-slate-500">{label}</span><span className="block text-xl font-extrabold text-navy">{nilai}</span></span>
          </Kartu>
        ))}
      </div>
      <Kartu className="p-5 md:p-6">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TAB.map(([id, label, fn]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${tab === id ? "bg-navy text-white" : "bg-soft text-navy hover:bg-pale"}`}>
              {label} <span className="ml-1 opacity-70">{items.filter(fn).length}</span>
            </button>
          ))}
        </div>
        {hasil.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-pale text-sky"><FileX2 size={28} /></span>
            <p className="mt-4 font-bold text-navy">Tidak ada tagihan pada kategori ini</p>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-pale/80">
            {hasil.map((t) => (
              <li key={t.kode} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-navy">{t.kode} · {asetTeks(t)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink">
                    <span className="font-semibold text-navy">{rupiah(t.total)}</span>
                    <StatusBayar status={t.pembayaran} />
                    {t.status === "disetujui" && ["belum_dibayar", "bukti_ditolak"].includes(t.pembayaran) && <Sisa batas={t.batasBayar} />}
                  </p>
                </div>
                <Link href={`${BASE}/transaksi/${t.kode}`} className={`inline-flex w-fit items-center rounded-xl px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${["belum_dibayar", "bukti_ditolak"].includes(t.pembayaran) ? "bg-sun text-navy shadow-md" : "border border-sky text-sky hover:bg-sky hover:text-white"}`}>
                  {["belum_dibayar", "bukti_ditolak"].includes(t.pembayaran) ? "Bayar Sekarang" : "Lihat Detail"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
