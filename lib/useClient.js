"use client";

import { useMemo, useSyncExternalStore } from "react";
import { mulaiHari, toISO } from "./waktu";

const KEY_SESI = "sipasti_demo_session";
const noop = () => () => {};

function langganan(cb) {
  window.addEventListener("storage", cb);
  window.addEventListener("sipasti-sesi", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("sipasti-sesi", cb);
  };
}

// Sesi demo dari localStorage (null di server dan sebelum hidrasi).
export function useSesi() {
  const raw = useSyncExternalStore(
    langganan,
    () => {
      try { return localStorage.getItem(KEY_SESI); } catch { return null; }
    },
    () => null
  );
  return useMemo(() => {
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, [raw]);
}

// Tanggal hari ini (ISO) di sisi klien; string kosong di server agar tidak terjadi ketidakcocokan hidrasi.
export function useHariIni() {
  return useSyncExternalStore(noop, () => toISO(mulaiHari()), () => "");
}
