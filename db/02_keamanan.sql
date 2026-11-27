-- =====================================================================
-- SIPASTI — 02_keamanan.sql
-- Row Level Security, view publik, bucket Supabase Storage, dan hak eksekusi fungsi.
-- Jalankan KEDUA, setelah 01_skema.sql berhasil.
-- =====================================================================

-- ---------- aktifkan RLS di semua tabel ----------
alter table profil_pengguna   enable row level security;
alter table kategori_aset     enable row level security;
alter table aset              enable row level security;
alter table foto_aset         enable row level security;
alter table tarif_aset        enable row level security;
alter table blokir_jadwal     enable row level security;
alter table pengaturan        enable row level security;
alter table penyewaan         enable row level security;
alter table dokumen_penyewaan enable row level security;
alter table pembayaran        enable row level security;
alter table serah_terima      enable row level security;
alter table pengembalian      enable row level security;
alter table denda             enable row level security;
alter table riwayat_penyewaan enable row level security;

-- ---------- profil ----------
create policy profil_baca on profil_pengguna for select to authenticated
  using (id = auth.uid() or adalah_staf());
create policy profil_ubah_sendiri on profil_pengguna for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());           -- peran/aktif dijaga trigger jaga_profil
create policy profil_admin_ubah on profil_pengguna for update to authenticated
  using (adalah_admin()) with check (adalah_admin());

-- ---------- katalog: publik boleh baca, hanya admin boleh ubah (BR-12) ----------
create policy kategori_baca  on kategori_aset for select to anon, authenticated using (true);
create policy kategori_admin on kategori_aset for all    to authenticated using (adalah_admin()) with check (adalah_admin());
create policy aset_baca      on aset          for select to anon, authenticated using (true);
create policy aset_admin     on aset          for all    to authenticated using (adalah_admin()) with check (adalah_admin());
create policy foto_baca      on foto_aset     for select to anon, authenticated using (true);
create policy foto_admin     on foto_aset     for all    to authenticated using (adalah_admin()) with check (adalah_admin());
create policy tarif_baca     on tarif_aset    for select to anon, authenticated using (true);
create policy tarif_admin    on tarif_aset    for all    to authenticated using (adalah_admin()) with check (adalah_admin());
create policy blokir_baca    on blokir_jadwal for select to anon, authenticated using (true);
create policy blokir_admin   on blokir_jadwal for all    to authenticated using (adalah_admin()) with check (adalah_admin());
create policy pengaturan_baca  on pengaturan  for select to anon, authenticated using (true);
create policy pengaturan_admin on pengaturan  for update to authenticated using (adalah_admin()) with check (adalah_admin());

-- ---------- transaksi (BR-11): penyewa hanya miliknya; staf sesuai kewenangan ----------
create policy penyewaan_baca on penyewaan for select to authenticated
  using (penyewa_id = auth.uid() or adalah_staf());
-- Penyewa hanya boleh membuat pengajuan atas namanya sendiri. Perubahan status HANYA lewat fungsi (RPC).
create policy penyewaan_ajukan on penyewaan for insert to authenticated
  with check (penyewa_id = auth.uid() and peran_saya() = 'penyewa');

create policy dokumen_baca on dokumen_penyewaan for select to authenticated
  using (adalah_staf() or exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid()));
create policy dokumen_tambah on dokumen_penyewaan for insert to authenticated
  with check (exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid() and p.status = 'diajukan'));
create policy dokumen_hapus on dokumen_penyewaan for delete to authenticated
  using (exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid() and p.status = 'diajukan'));

create policy pembayaran_baca on pembayaran for select to authenticated
  using (adalah_staf() or exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid()));
create policy serah_baca on serah_terima for select to authenticated
  using (adalah_staf() or exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid()));
create policy kembali_baca on pengembalian for select to authenticated
  using (adalah_staf() or exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid()));
create policy denda_baca on denda for select to authenticated
  using (adalah_staf() or exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid()));
create policy riwayat_baca on riwayat_penyewaan for select to authenticated
  using (adalah_staf() or exists (select 1 from penyewaan p where p.id = penyewaan_id and p.penyewa_id = auth.uid()));

-- ---------- hak tabel: tulis langsung dibatasi; perubahan status hanya lewat fungsi (RPC) ----------
revoke insert, update, delete on pembayaran, serah_terima, pengembalian, denda, riwayat_penyewaan from anon, authenticated;
revoke update, delete on penyewaan from anon, authenticated;
revoke all on all tables in schema public from anon;
grant select on kategori_aset, aset, foto_aset, tarif_aset, blokir_jadwal, pengaturan to anon;

grant usage, select on sequence seq_nomor_penyewaan to authenticated;   -- nomor transaksi otomatis saat pengajuan

-- ---------- kalender ketersediaan publik (FR-07): hanya jam terisi, tanpa nama penyewa ----------
-- View ini sengaja berjalan dengan hak pemiliknya agar pengunjung dapat melihat jadwal terisi tanpa membuka tabel penyewaan.
create view jadwal_terisi as
  select aset_id, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, jumlah
    from penyewaan
   where status in ('disetujui', 'sedang_disewa');
grant select on jadwal_terisi to anon, authenticated;

-- ---------- hak eksekusi fungsi alur ----------
revoke execute on all functions in schema public from public, anon;
grant execute on function
  setujui_penyewaan(uuid, text), tolak_penyewaan(uuid, text), kirim_bukti_bayar(uuid, text, text, text),
  verifikasi_pembayaran(uuid, boolean, text), catat_serah_terima(uuid, int, kondisi_aset, text),
  catat_pengembalian(uuid, timestamptz, int, kondisi_aset, text, int, numeric, text),
  konfirmasi_denda(uuid, numeric), lunasi_denda(uuid), selesaikan_penyewaan(uuid),
  batalkan_penyewaan(uuid, text), ubah_kondisi_aset(uuid, kondisi_aset, int),
  cek_ketersediaan(uuid, tsrange, int, uuid)
  to authenticated;
-- fungsi pembantu RLS harus bisa dipanggil oleh pengguna saat policy dievaluasi
grant execute on function peran_saya(), adalah_admin(), adalah_staf() to anon, authenticated;
-- dipakai kolom 'periode' (generated column) saat penyewa menyimpan pengajuan
grant execute on function periode_penyewaan(date, date, time, time) to anon, authenticated;
-- batalkan_kedaluwarsa() sengaja TIDAK diberikan ke anon/authenticated (hanya pemilik / service_role / pg_cron)

-- =====================================================================
-- SUPABASE STORAGE — hanya bucket PRIVAT untuk dokumen dan bukti bayar.
-- (Foto katalog yang publik disimpan di Cloudflare R2 pada tahap berikutnya.)
-- Konvensi path berkas:  {id_penyewa}/{id_penyewaan}/{nama_berkas}
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('dokumen',     'dokumen',     false, 5242880, array['application/pdf', 'image/jpeg', 'image/png']),
  ('bukti-bayar', 'bukti-bayar', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

create policy "berkas_penyewa_unggah" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('dokumen', 'bukti-bayar')
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.penyewaan p
                 where p.id::text = (storage.foldername(name))[2] and p.penyewa_id = auth.uid())
  );
create policy "berkas_pemilik_dan_staf_baca" on storage.objects for select to authenticated
  using (
    bucket_id in ('dokumen', 'bukti-bayar')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.adalah_staf())
  );
create policy "berkas_pemilik_hapus" on storage.objects for delete to authenticated
  using (
    bucket_id in ('dokumen', 'bukti-bayar')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.adalah_admin())
  );
