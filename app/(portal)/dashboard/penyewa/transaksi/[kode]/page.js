import DetailTransaksi from "@/components/portal/DetailTransaksi";

export const metadata = { title: "Detail Transaksi" };

export default async function Page({ params, searchParams }) {
  const { kode } = await params;
  const sp = await searchParams;
  return <DetailTransaksi kode={decodeURIComponent(kode)} baru={sp?.baru === "1"} />;
}
