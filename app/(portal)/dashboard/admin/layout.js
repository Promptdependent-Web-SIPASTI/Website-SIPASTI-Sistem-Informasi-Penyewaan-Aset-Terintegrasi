import PortalShell from "@/components/portal/PortalShell";

export const metadata = { title: { default: "Portal Admin", template: "%s | Portal Admin SIPASTI" } };

export default function Layout({ children }) {
  return <PortalShell peran="admin">{children}</PortalShell>;
}
