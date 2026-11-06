import Link from "next/link";
import Image from "next/image";

export function LogoBadge({ size = 48, className = "" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <Image src="/logo/logo-icon.png" alt="" width={size} height={size} className="h-full w-full object-contain" priority />
    </span>
  );
}

export function Brand({ href = "/", size = 48, tagline = true, light = true, className = "" }) {
  return (
    <Link href={href} className={`flex items-center gap-3.5 ${className}`} aria-label="SIPASTI — beranda">
      <LogoBadge size={size} />
      <span className="flex flex-col leading-none">
        <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}>SIPASTI</span>
        {tagline && (
          <span className={`mt-1 text-xs tracking-wide ${light ? "text-sky-100/80" : "text-mute"}`}>
            Sistem Informasi Penyewaan Aset Terintegrasi
          </span>
        )}
      </span>
    </Link>
  );
}
