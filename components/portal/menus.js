import {
  LayoutGrid, SquarePlus, ReceiptText, Wallet, History, UserRound, Archive, Shapes, BadgeDollarSign, Users, CircleCheckBig, ShieldCheck,
  CircleX, Gavel, ChartNoAxesColumn, Settings, CalendarDays, ClipboardCheck, ClipboardPlus, Wrench,
} from "lucide-react";

export const MENUS = {
  penyewa: {
    base: "/dashboard/penyewa", judul: "Portal Penyewa", kepala: "MENU UTAMA", peranLabel: "Penyewa Aktif",
    grup: [{ judul: null, items: [
      { href: "/dashboard/penyewa", label: "Dashboard", icon: LayoutGrid, exact: true, judul: "Dashboard Penyewa" },
      { href: "/dashboard/penyewa/ajukan", label: "Ajukan Sewa", icon: SquarePlus, judul: "Ajukan Sewa" },
      { href: "/dashboard/penyewa/transaksi", label: "Transaksi Saya", icon: ReceiptText, judul: "Transaksi Saya" },
      { href: "/dashboard/penyewa/pembayaran", label: "Pembayaran", icon: Wallet, judul: "Pembayaran" },
      { href: "/dashboard/penyewa/riwayat", label: "Riwayat Penyewaan", icon: History, judul: "Riwayat Penyewaan" },
      { href: "/dashboard/penyewa/profil", label: "Profil", icon: UserRound, judul: "Profil Saya" },
    ] }],
  },
  petugas: {
    base: "/dashboard/petugas", judul: "Portal Petugas", kepala: "MENU PETUGAS", peranLabel: "Petugas · FMIPA UNNES",
    grup: [{ judul: null, items: [
      { href: "/dashboard/petugas", label: "Dashboard", icon: LayoutGrid, exact: true, judul: "Dashboard Petugas" },
      { href: "/dashboard/petugas/jadwal", label: "Jadwal Penyewaan", icon: CalendarDays, judul: "Jadwal Penyewaan" },
      { href: "/dashboard/petugas/serah-terima", label: "Serah Terima Aset", icon: ClipboardCheck, judul: "Serah Terima Aset" },
      { href: "/dashboard/petugas/pengembalian", label: "Pengembalian Aset", icon: ClipboardPlus, judul: "Pengembalian Aset" },
      { href: "/dashboard/petugas/kondisi", label: "Kondisi dan Kerusakan Aset", icon: Wrench, judul: "Kondisi dan Kerusakan Aset" },
    ] }],
  },
  admin: {
    base: "/dashboard/admin", judul: "Portal Admin", kepala: null, peranLabel: "Administrator Unit",
    grup: [
      { judul: null, items: [{ href: "/dashboard/admin", label: "Dashboard", icon: LayoutGrid, exact: true, judul: "Dashboard Admin" }] },
      { judul: "Data Master", items: [
        { href: "/dashboard/admin/aset", label: "Manajemen Aset", icon: Archive, judul: "Manajemen Aset" },
        { href: "/dashboard/admin/kategori", label: "Kategori", icon: Shapes, judul: "Kategori Aset" },
        { href: "/dashboard/admin/tarif", label: "Tarif", icon: BadgeDollarSign, judul: "Tarif" },
        { href: "/dashboard/admin/pengguna", label: "Pengguna", icon: Users, judul: "Pengguna" },
      ] },
      { judul: "Transaksi", items: [
        { href: "/dashboard/admin/persetujuan", label: "Persetujuan Pengajuan", icon: CircleCheckBig, judul: "Persetujuan Pengajuan", badge: "persetujuan" },
        { href: "/dashboard/admin/verifikasi", label: "Verifikasi Pembayaran", icon: ShieldCheck, judul: "Verifikasi Pembayaran", badge: "verifikasi" },
        { href: "/dashboard/admin/refund", label: "Pembatalan dan Refund", icon: CircleX, judul: "Pembatalan dan Refund" },
        { href: "/dashboard/admin/denda", label: "Konfirmasi Denda", icon: Gavel, judul: "Konfirmasi Denda" },
      ] },
      { judul: "Laporan", items: [{ href: "/dashboard/admin/rekap", label: "Rekap Transaksi", icon: ChartNoAxesColumn, judul: "Rekap Transaksi" }] },
      { judul: "Sistem", items: [{ href: "/dashboard/admin/pengaturan", label: "Pengaturan Sistem", icon: Settings, judul: "Pengaturan Sistem" }] },
    ],
  },
};
