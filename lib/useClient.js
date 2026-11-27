"use client";

import { useSyncExternalStore } from "react";
import { mulaiHari, toISO } from "./waktu";
import { keadaan, useVersi } from "./store";

const noop = () => () => {};

// Sesi pengguna dari Supabase Auth (null di server, sebelum sesi dimuat, dan saat belum login).
export function useSesi() {
  useVersi();
  return keadaan().sesi;
}
// true setelah pemeriksaan sesi awal selesai (agar halaman dashboard tidak mengalihkan terlalu dini).
export function useSesiSiap() {
  useVersi();
  return keadaan().authSiap;
}

// Tanggal hari ini (ISO) di sisi klien; string kosong di server agar tidak terjadi ketidakcocokan hidrasi.
export function useHariIni() {
  return useSyncExternalStore(noop, () => toISO(mulaiHari()), () => "");
}

// true setelah hidrasi di klien (false saat render server).
export function useKlienSiap() {
  return useSyncExternalStore(noop, () => true, () => false);
}

// Penanda waktu yang berdetak tiap 30 detik (untuk hitung mundur).
export function useDetak() {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, 30000);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / 30000),
    () => 0
  );
}
