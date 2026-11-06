import PortalShell from "@/components/portal/PortalShell";

export const metadata = { title: { default: "Portal Penyewa", template: "%s | Portal Penyewa SIPASTI" } };

export default function PenyewaLayout({ children }) {
  return <PortalShell>{children}</PortalShell>;
}
