import TransaksiList from "@/components/portal/TransaksiList";

export const metadata = { title: "Riwayat Penyewaan" };

export default function Page() {
  return <TransaksiList mode="riwayat" />;
}
