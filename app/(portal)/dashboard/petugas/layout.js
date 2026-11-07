import PortalShell from "@/components/portal/PortalShell";

export const metadata = { title: { default: "Portal Petugas", template: "%s | Portal Petugas SIPASTI" } };

export default function Layout({ children }) {
  return <PortalShell peran="petugas">{children}</PortalShell>;
}
