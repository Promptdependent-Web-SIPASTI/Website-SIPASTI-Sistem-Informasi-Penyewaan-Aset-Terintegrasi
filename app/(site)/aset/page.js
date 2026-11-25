
import Link from "next/link";
import KatalogClient from "@/components/KatalogClient";
import { Reveal } from "@/components/motion";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Katalog Aset",
};

export default async function KatalogPage({ searchParams }) {
  const sp = await searchParams;

  // Mengambil data dari tiga tabel Supabase
  const [asetResult, kategoriResult, tarifResult] =
    await Promise.all([
      supabase
        .from("aset")
        .select("*")
        .eq("aktif", true),

      supabase
        .from("kategori_aset")
        .select("*")
        .eq("aktif", true),

      supabase
        .from("tarif_aset")
        .select("*")
        .order("nominal", { ascending: true }),
    ]);

  // Memeriksa jika terjadi kesalahan pengambilan data
  const error =
    asetResult.error ||
    kategoriResult.error ||
    tarifResult.error;

  if (error) {
    console.error("Gagal mengambil data Supabase:", {
      aset: asetResult.error,
      kategori: kategoriResult.error,
      tarif: tarifResult.error,
    });
  }

  const asetData = asetResult.data ?? [];
  const kategoriData = kategoriResult.data ?? [];
  const tarifData = tarifResult.data ?? [];

  // Membuat pemetaan kategori berdasarkan ID
  const kategoriMap = new Map(
    kategoriData.map((kategori) => [
      kategori.id,
      kategori,
    ])
  );

  // Mengelompokkan tarif berdasarkan ID aset
  const tarifMap = new Map();

  tarifData.forEach((tarif) => {
    const daftar =
      tarifMap.get(tarif.aset_id) ?? [];

    daftar.push(tarif);
    tarifMap.set(tarif.aset_id, daftar);
  });

  // Mengubah data Supabase menjadi format yang digunakan kartu aset
  const daftarAset = asetData.map((aset) => {
    const kategori = kategoriMap.get(aset.kategori_id);

    const daftarTarif =
      tarifMap.get(aset.id) ?? [];

    // Menggunakan tarif nominal terendah sebagai tarif awal
    const tarif = daftarTarif[0];

    const subkategori =
      kategori?.nama ?? "Lainnya";

    const kondisiAsli = String(
      aset.kondisi ?? "baik"
    );

    const kondisi =
      kondisiAsli.charAt(0).toUpperCase() +
      kondisiAsli.slice(1).replaceAll("_", " ");

    const kondisiLower = kondisiAsli.toLowerCase();

    const dalamPerbaikan =
      kondisiLower.includes("rusak") ||
      kondisiLower.includes("pemeliharaan") ||
      kondisiLower.includes("perbaikan");

    // Menentukan ketersediaan berdasarkan kondisi database
    let status = "Tersedia";
    let statusKet = "";

    if (!aset.aktif) {
      status = "Tidak tersedia";
      statusKet = "tidak aktif";
    } else if (dalamPerbaikan) {
      status = "Tidak tersedia";
      statusKet = "sedang dalam perbaikan";
    } else if (
      aset.jenis === "peralatan" &&
      Number(aset.stok_tersedia ?? 0) <= 0
    ) {
      status = "Tidak tersedia";
      statusKet = "stok habis";
    }

    return {
      id: aset.id,
      kode: aset.kode,
      slug: aset.slug,
      nama: aset.nama,

      kategori: aset.jenis,
      subkategori,

      lokasi: aset.lokasi ?? "-",

      kapasitas: aset.kapasitas,
      kapasitasSatuan:
        aset.kapasitas_satuan ?? "orang",

      stok: Number(aset.stok_tersedia ?? 0),
      stokSatuan: aset.stok_satuan ?? "unit",

      kondisi,
      status,
      statusKet,

      tarif: Number(tarif?.nominal ?? 0),
      satuan: tarif?.satuan ?? "unit",

      ringkas: aset.ringkas ?? "",
      deskripsi: aset.deskripsi ?? "",
      fasilitas: aset.fasilitas ?? "",
      dokumenKhusus: aset.dokumen_khusus ?? "",
      aturan: aset.aturan ?? [],

      foto: `/images/aset/${aset.slug}.jpg`,
    };
  });

  // Mengambil daftar subkategori yang benar-benar digunakan aset
  const subkategoriList = [
    ...new Set(
      daftarAset.map((aset) => aset.subkategori)
    ),
  ].sort((a, b) => a.localeCompare(b, "id"));

  // Mempertahankan filter dari URL
  const awal = {
    q:
      typeof sp?.q === "string"
        ? sp.q
        : "",

    kategori: [
      "ruangan",
      "peralatan",
    ].includes(sp?.kategori)
      ? sp.kategori
      : "semua",

    tanggal:
      typeof sp?.tanggal === "string"
        ? sp.tanggal
        : "",
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 md:px-10">
      <nav
        aria-label="Breadcrumb"
        className="text-sm text-slate-500"
      >
        <Link
          href="/"
          className="hover:text-sky"
        >
          Beranda
        </Link>

        <span className="mx-2">/</span>

        <b className="text-navy">Aset</b>
      </nav>

      <Reveal>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-navy md:text-5xl">
          Katalog Aset
        </h1>

        <span className="mt-3 block h-1 w-14 rounded-full bg-sun" />

        <p className="mt-4 text-ink">
          Pilih fasilitas dan peralatan yang Anda
          butuhkan untuk kegiatan akademik, seminar,
          atau penelitian
        </p>
      </Reveal>

      {error ? (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Data katalog gagal dimuat dari database.
          Silakan periksa konfigurasi Supabase dan
          kebijakan akses tabel.
        </div>
      ) : (
        <KatalogClient
          key={JSON.stringify(awal)}
          awal={awal}
          asetList={daftarAset}
          subkategoriList={subkategoriList}
        />
      )}
    </div>
  );
}
