import Persetujuan from "@/components/portal/admin/Persetujuan";

export const metadata = { title: "Persetujuan Pengajuan" };

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  return <Persetujuan kodeAwal={typeof sp?.kode === "string" ? sp.kode : undefined} />;
}
