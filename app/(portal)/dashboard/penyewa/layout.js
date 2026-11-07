import PortalShell from "@/components/portal/PortalShell";

export const metadata = { title: { default: "Portal Penyewa", template: "%s | Portal Penyewa SIPASTI" } };

export default function Layout({ children }) {
  return <PortalShell peran="penyewa">{children}</PortalShell>;
}
