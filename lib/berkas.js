"use client";

// Unggah dan buka berkas privat di Supabase Storage. Path: {id_penyewa}/{id_penyewaan}/{nama_berkas}
import { supabase } from "./supabase";

const aman = (nama) => nama.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "_");

export async function unggahBerkas(bucket, idPenyewa, idPenyewaan, file, awalan = "") {
  const path = `${idPenyewa}/${idPenyewaan}/${awalan}${Date.now()}_${aman(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Gagal mengunggah ${file.name}: ${error.message}`);
  return path;
}

// Tautan sementara (5 menit) untuk membuka berkas privat.
export async function urlBerkas(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error) throw new Error(`Berkas tidak dapat dibuka: ${error.message}`);
  return data.signedUrl;
}

export async function bukaBerkas(bucket, path) {
  const w = window.open("", "_blank"); // dibuka dulu agar tidak diblokir peramban
  try {
    const url = await urlBerkas(bucket, path);
    if (w) w.location.href = url; else window.location.href = url;
  } catch (e) {
    w?.close();
    window.alert(e.message);
  }
}
