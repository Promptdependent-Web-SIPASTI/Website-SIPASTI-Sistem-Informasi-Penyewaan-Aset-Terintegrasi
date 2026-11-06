import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Daftar Akun" };

const POIN = [
  
];

export default function DaftarPage() {
  return (
    <AuthShell poin={POIN} lebar="max-w-3xl">
      <RegisterForm />
      <p className="mt-6 text-center text-xs text-slate-500">Setiap akun akan diverifikasi melalui basis data kepegawaian &amp; kemahasiswaan FMIPA UNNES</p>
      <p className="mt-10 text-center text-xs text-slate-400">© 2026 FMIPA Universitas Negeri Semarang · Proyek Akhir Web (UAS)</p>
    </AuthShell>
  );
}
