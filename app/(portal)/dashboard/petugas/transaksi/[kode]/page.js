import DetailPetugas from "@/components/portal/petugas/Detail";

export const metadata = { title: "Serah Terima dan Pengembalian" };

export default async function Page({ params, searchParams }) {
  const { kode } = await params;
  const sp = await searchParams;
  return <DetailPetugas kode={decodeURIComponent(kode)} tab={typeof sp?.tab === "string" ? sp.tab : "serah-terima"} />;
}
