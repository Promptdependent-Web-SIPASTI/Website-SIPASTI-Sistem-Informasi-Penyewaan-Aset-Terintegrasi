import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <AuthShell>
      <LoginForm next={typeof sp?.next === "string" ? sp.next : ""} baruDaftar={sp?.baru === "1"} />
      <p className="mt-6 text-center text-xs text-slate-500">Butuh bantuan verifikasi akun? Hubungi Subbag Akademik FMIPA UNNES</p>
      <p className="mt-10 text-center text-xs text-slate-400">© 2026 FMIPA Universitas Negeri Semarang</p>
    </AuthShell>
  );
}
