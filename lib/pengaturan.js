"use client";

import { supabase } from "./supabase";
import { PENGATURAN_AWAL, keadaan, muatKatalog, useVersi } from "./store";

// Parameter sistem disimpan di tabel `pengaturan` (satu baris). Aturan tetap di bawah ini ditegakkan di database.
export { PENGATURAN_AWAL };
export const PARAMETER_TETAP = { minPengajuanHari: 2, maksDurasiHari: 7, jamOperasional: "07.00–11.30 dan 12.30–18.00 (Senin–Sabtu)" };

export const ambilPengaturan = () => keadaan().pengaturan;

export async function simpanPengaturan(patch) {
  const k = {};
  if (patch.dendaPersen !== undefined) k.denda_persen = patch.dendaPersen;
  if (patch.toleransiMenit !== undefined) k.toleransi_menit = patch.toleransiMenit;
  if (patch.batasBayarJam !== undefined) k.batas_bayar_jam = patch.batasBayarJam;
  const { error } = await supabase.from("pengaturan").update(k).eq("id", 1);
  if (error) throw new Error(error.message);
  await muatKatalog();
}

export function usePengaturan() {
  useVersi();
  return keadaan().pengaturan;
}
