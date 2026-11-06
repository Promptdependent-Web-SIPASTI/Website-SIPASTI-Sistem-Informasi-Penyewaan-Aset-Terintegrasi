import FormPengajuan from "@/components/portal/FormPengajuan";

export const metadata = { title: "Ajukan Sewa" };

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const s = (k) => (typeof sp?.[k] === "string" ? sp[k] : undefined);
  const awal = { aset: s("aset"), tanggal: s("tanggal"), mulai: s("mulai"), selesaiJam: s("selesai"), hari: s("hari"), jumlah: s("jumlah") };
  return <FormPengajuan key={JSON.stringify(awal)} awal={awal} />;
}
