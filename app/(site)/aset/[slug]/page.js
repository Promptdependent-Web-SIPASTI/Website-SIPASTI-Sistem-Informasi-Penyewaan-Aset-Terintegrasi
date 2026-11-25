
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import DetailClient from "@/components/DetailClient";
import { supabase } from "@/lib/supabase";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const { data: aset } = await supabase
    .from("aset")
    .select("nama, nama_lengkap")
    .eq("slug", slug)
    .eq("aktif", true)
    .maybeSingle();

  return {
    title: aset
      ? aset.nama_lengkap ?? aset.nama
      : "Aset tidak ditemukan",
  };
}

export default async function DetailAsetPage({ params }) {
  const { slug } = await params;

  // 1. Mengambil data aset
  const { data: asetData, error: asetError } =
    await supabase
      .from("aset")
      .select("*")
      .eq("slug", slug)
      .eq("aktif", true)
      .maybeSingle();

  if (asetError) {
    console.error("Gagal mengambil detail aset:", asetError);
    throw new Error("Gagal memuat detail aset");
  }

  if (!asetData) notFound();

  // 2. Mengambil kategori aset
  const { data: kategori, error: kategoriError } =
    await supabase
      .from("kategori_aset")
      .select("*")
      .eq("id", asetData.kategori_id)
      .maybeSingle();

  if (kategoriError) {
    console.error("Gagal mengambil kategori:", kategoriError);
  }

  // 3. Mengambil tarif aset
  const { data: tarifData, error: tarifError } =
    await supabase
      .from("tarif_aset")
      .select("*")
      .eq("aset_id", asetData.id)
      .order("nominal", { ascending: true });

  if (tarifError) {
    console.error("Gagal mengambil tarif:", tarifError);
  }

  const tarif = tarifData?.[0];

  // 4. Mengolah kondisi aset
  const kondisiAsli = String(asetData.kondisi ?? "baik");

  const kondisi =
    kondisiAsli.charAt(0).toUpperCase() +
    kondisiAsli.slice(1).replaceAll("_", " ");

  const kondisiLower = kondisiAsli.toLowerCase();

  const dalamPerbaikan =
    kondisiLower.includes("rusak") ||
    kondisiLower.includes("pemeliharaan") ||
    kondisiLower.includes("perbaikan");

  // 5. Menentukan status ketersediaan
  let status = "Tersedia";

  if (!asetData.aktif || dalamPerbaikan) {
    status = "Tidak tersedia";
  } else if (
    asetData.jenis === "peralatan" &&
    Number(asetData.stok_tersedia ?? 0) <= 0
  ) {
    status = "Tidak tersedia";
  }

  // 6. Menyesuaikan data Supabase dengan DetailClient
  const aset = {
    id: asetData.id,
    kode: asetData.kode,
    slug: asetData.slug,

    nama: asetData.nama,
    nama2: asetData.nama_lengkap ?? asetData.nama,

    kategori: asetData.jenis,
    subkategori: kategori?.nama ?? "Lainnya",

    lokasi: asetData.lokasi ?? "-",
    pengelola: asetData.pengelola ?? "-",

    kapasitas: asetData.kapasitas,
    kapasitasSatuan: asetData.kapasitas_satuan ?? "orang",

    stok: Number(asetData.stok_tersedia ?? 0),
    stokTotal: Number(asetData.stok_total ?? 0),
    stokSatuan: asetData.stok_satuan ?? "unit",

    kondisi,
    kondisiDetail: asetData.kondisi_detail ?? "",
    status,

    tarif: Number(tarif?.nominal ?? 0),
    satuan: tarif?.satuan ?? "unit",

    ringkas: asetData.ringkas ?? "",
    deskripsi: asetData.deskripsi ?? "",
    fasilitas: asetData.fasilitas ?? "",
    dokumenKhusus: asetData.dokumen_khusus ?? "",
    aturan: asetData.aturan ?? [],

    foto: `/images/aset/${asetData.slug}.jpg`,
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-10">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-slate-500"
      >
        <Link href="/" className="hover:text-sky">
          Beranda
        </Link>

        <ChevronRight size={13} />

        <Link href="/aset" className="hover:text-sky">
          Aset
        </Link>

        <ChevronRight size={13} />

        <b className="text-navy">{aset.nama2}</b>
      </nav>

      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy md:text-4xl">
            {aset.nama2}
          </h1>

          <span className="mt-3 block h-1 w-14 rounded-full bg-sun" />

          <p className="mt-4 text-sm text-ink">
            {aset.ringkas}
          </p>
        </div>

        <p className="text-sm font-bold text-sky">
          Kode Aset: {aset.kode}
        </p>
      </div>

      <DetailClient aset={aset} />
    </div>
  );
}
