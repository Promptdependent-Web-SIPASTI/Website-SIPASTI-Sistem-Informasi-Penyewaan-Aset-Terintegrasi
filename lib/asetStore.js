"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ASET, SUBKATEGORI } from "./data";

// Perubahan data aset oleh admin/petugas (simulasi, localStorage). Katalog publik tetap memakai data tetap
// sampai backend terhubung. Pada backend ini menjadi tabel `aset`.
const KEY = "sipasti_demo_aset";
const subscribe = (cb) => {
  window.addEventListener("sipasti-data", cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener("sipasti-data", cb); window.removeEventListener("storage", cb); };
};
const getRaw = () => {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
};
const baca = () => { try { return JSON.parse(getRaw() || "{}"); } catch { return {}; } };

export function ubahAset(slug, patch) {
  const peta = baca();
  peta[slug] = { ...(peta[slug] ?? {}), ...patch };
  localStorage.setItem(KEY, JSON.stringify(peta));
  window.dispatchEvent(new Event("sipasti-data"));
}
export function tambahAsetBaru(aset) {
  const peta = baca();
  peta.__baru = [...(peta.__baru ?? []), aset];
  localStorage.setItem(KEY, JSON.stringify(peta));
  window.dispatchEvent(new Event("sipasti-data"));
}
export function setelUlangAset() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("sipasti-data"));
}

export function useAsetList() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => "");
  return useMemo(() => {
    let peta = {};
    try { peta = JSON.parse(raw || "{}"); } catch {}
    const dasar = ASET.map((a) => ({ ...a, ...(peta[a.slug] ?? {}) }));
    return [...dasar, ...(peta.__baru ?? [])];
  }, [raw]);
}

export function tambahSubkategori(nama) {
  const peta = baca();
  peta.__sub = [...new Set([...(peta.__sub ?? []), nama])];
  localStorage.setItem(KEY, JSON.stringify(peta));
  window.dispatchEvent(new Event("sipasti-data"));
}
export function useSubkategori() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => "");
  return useMemo(() => {
    let peta = {};
    try { peta = JSON.parse(raw || "{}"); } catch {}
    return [...new Set([...SUBKATEGORI, ...(peta.__sub ?? [])])];
  }, [raw]);
}
