import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata = {
  title: {
    default: "SIPASTI FMIPA UNNES — Sistem Informasi Penyewaan Aset Terintegrasi",
    template: "%s | SIPASTI FMIPA UNNES",
  },
  description:
    "Temukan dan ajukan sewa ruang, laboratorium, dan peralatan FMIPA Universitas Negeri Semarang — proses jelas, tertib, dan transparan.",
  icons: { icon: "/logo/logo-icon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
