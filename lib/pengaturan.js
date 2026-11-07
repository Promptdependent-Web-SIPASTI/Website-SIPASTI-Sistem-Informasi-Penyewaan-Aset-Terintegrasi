"use client";

import { useMemo, useSyncExternalStore } from "react";

// Parameter sistem (simulasi, disimpan di localStorage). Pada backend akan menjadi tabel `pengaturan`.
const KEY = "sipasti_demo_pengaturan";
export const PENGATURAN_AWAL = { dendaPersen: 10, toleransiMenit: 30, batasBayarJam: 24 };
export const PARAMETER_TETAP = { minPengajuanHari: 2, maksDurasiHari: 7, jamOperasional: "07.00–11.30 dan 12.30–18.00 (Senin–Sabtu)" };

const subscribe = (cb) => {
  window.addEventListener("sipasti-data", cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener("sipasti-data", cb); window.removeEventListener("storage", cb); };
};
const getRaw = () => {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
};

export const ambilPengaturan = () => {
  try { return { ...PENGATURAN_AWAL, ...JSON.parse(getRaw() || "{}") }; } catch { return { ...PENGATURAN_AWAL }; }
};
export function simpanPengaturan(patch) {
  localStorage.setItem(KEY, JSON.stringify({ ...ambilPengaturan(), ...patch }));
  window.dispatchEvent(new Event("sipasti-data"));
}
export function usePengaturan() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => "");
  return useMemo(() => {
    try { return { ...PENGATURAN_AWAL, ...JSON.parse(raw || "{}") }; } catch { return { ...PENGATURAN_AWAL }; }
  }, [raw]);
}
