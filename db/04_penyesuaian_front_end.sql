-- =====================================================================
-- SIPASTI — 04_penyesuaian_front_end.sql
-- Menambah kolom dan fungsi yang dibutuhkan tampilan (kontrak sewa, status refund,
-- jumlah rusak) agar front end dapat memakai database apa adanya.
-- Jalankan KEEMPAT, setelah 01, 02, dan 03 berhasil. Aman dijalankan sekali.
-- =====================================================================

-- ---------- kolom baru ----------
alter table pembayaran
  add column nomor_kontrak          text,
  add column kontrak_pada           timestamptz,
  add column kontrak_denda_persen   numeric(5,2),
  add column kontrak_toleransi_menit int,
  add column refund_ket             text,
  add column refund_diproses        boolean not null default false;

alter table pengembalian add column jumlah_rusak int not null default 0 check (jumlah_rusak >= 0);

-- ---------- nomor kontrak: 001/PKS/SIPASTI-FMIPA/XI/2026 ----------
create or replace function format_nomor_kontrak(seq int, waktu timestamptz) returns text
language sql immutable as $$
  select lpad(seq::text, 3, '0') || '/PKS/SIPASTI-FMIPA/'
         || (array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'])[extract(month from waktu at time zone 'Asia/Jakarta')::int]
         || '/' || extract(year from waktu at time zone 'Asia/Jakarta')::int
$$;

-- isi kontrak untuk pembayaran lunas yang sudah ada (urut menurut waktu verifikasi)
with urut as (
  select b.id, coalesce(b.diverifikasi_pada, b.dibuat) as w,
         row_number() over (partition by extract(year from coalesce(b.diverifikasi_pada, b.dibuat) at time zone 'Asia/Jakarta')
                            order by coalesce(b.diverifikasi_pada, b.dibuat), b.id) as n
    from pembayaran b where b.status = 'lunas'
)
update pembayaran b set nomor_kontrak = format_nomor_kontrak(u.n::int, u.w), kontrak_pada = u.w,
       kontrak_denda_persen = (select denda_persen from pengaturan where id = 1),
       kontrak_toleransi_menit = (select toleransi_menit from pengaturan where id = 1)
  from urut u where u.id = b.id;

-- ---------- verifikasi pembayaran: terbitkan kontrak saat lunas ----------
create or replace function verifikasi_pembayaran(p_id uuid, p_setuju boolean, p_catatan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare b pembayaran%rowtype; cfg pengaturan%rowtype; seq int; sekarang timestamptz := now();
begin
  if not adalah_admin() then raise exception 'Hanya admin yang dapat memverifikasi pembayaran.' using errcode = '42501'; end if;
  select * into b from pembayaran where penyewaan_id = p_id for update;
  if not found then raise exception 'Data pembayaran tidak ditemukan.'; end if;
  if b.status <> 'menunggu_verifikasi' then raise exception 'Pembayaran ini tidak sedang menunggu verifikasi.'; end if;
  if not p_setuju and (p_catatan is null or length(trim(p_catatan)) < 3) then
    raise exception 'Alasan penolakan bukti wajib diisi.'; end if;

  if p_setuju then
    select * into cfg from pengaturan where id = 1;
    perform pg_advisory_xact_lock(7001);                                   -- nomor kontrak berurutan tanpa ganda
    select coalesce(max(split_part(nomor_kontrak, '/', 1)::int), 0) + 1 into seq from pembayaran
     where nomor_kontrak is not null
       and extract(year from kontrak_pada at time zone 'Asia/Jakarta') = extract(year from sekarang at time zone 'Asia/Jakarta');
    update pembayaran set status = 'lunas', diverifikasi_oleh = auth.uid(), diverifikasi_pada = sekarang, catatan_verifikasi = null,
           nomor_kontrak = coalesce(nomor_kontrak, format_nomor_kontrak(seq, sekarang)),
           kontrak_pada = coalesce(kontrak_pada, sekarang),
           kontrak_denda_persen = coalesce(kontrak_denda_persen, cfg.denda_persen),
           kontrak_toleransi_menit = coalesce(kontrak_toleransi_menit, cfg.toleransi_menit)
     where penyewaan_id = p_id;
  else
    update pembayaran set status = 'bukti_ditolak', diverifikasi_oleh = auth.uid(), diverifikasi_pada = sekarang, catatan_verifikasi = p_catatan
     where penyewaan_id = p_id;
  end if;
end $$;

-- ---------- pembatalan: simpan keterangan refund ----------
create or replace function batalkan_penyewaan(p_id uuid, p_alasan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p penyewaan%rowtype; b pembayaran%rowtype; uid uuid := wajib_login(); oleh_kampus boolean := adalah_admin();
        selisih int; persen int := 0; ket text; hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
begin
  select * into p from penyewaan where id = p_id for update;
  if not found or (p.penyewa_id <> uid and not oleh_kampus) then raise exception 'Transaksi tidak ditemukan.'; end if;
  if p.status not in ('diajukan', 'disetujui') then raise exception 'Transaksi dengan status ini tidak dapat dibatalkan.'; end if;
  if oleh_kampus and p.penyewa_id <> uid and (p_alasan is null or length(trim(p_alasan)) < 3) then
    raise exception 'Alasan pembatalan wajib diisi.'; end if;

  select * into b from pembayaran where penyewaan_id = p_id for update;
  if found and b.status in ('lunas', 'menunggu_verifikasi') then
    if oleh_kampus and p.penyewa_id <> uid then
      persen := 100; ket := 'Dibatalkan oleh pihak kampus.';
    else
      selisih := p.tanggal_mulai - hari_ini;
      persen := case when selisih >= 3 then 100 when selisih >= 1 then 50 else 0 end;
      ket := case persen when 100 then 'Dibatalkan H-3 atau lebih awal.' when 50 then 'Dibatalkan pada rentang H-2 sampai H-1.'
                         else 'Dibatalkan kurang dari H-1.' end;
    end if;
    update pembayaran set refund_persen = persen, refund_nominal = round(p.total_biaya * persen / 100.0),
           refund_pada = now(), alasan_batal = p_alasan, refund_ket = ket, refund_diproses = (persen = 0)
     where penyewaan_id = p_id;
  end if;
  update penyewaan set status = 'dibatalkan',
         catatan_admin = case when oleh_kampus and p.penyewa_id <> uid then 'Dibatalkan oleh pihak kampus: ' || p_alasan
                              else 'Dibatalkan oleh penyewa.' end
   where id = p_id;
  if not (oleh_kampus and p.penyewa_id <> uid) then
    update pembayaran set alasan_batal = nullif(trim(p_alasan), '') where penyewaan_id = p_id;
  end if;
end $$;

create or replace function tandai_refund(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not adalah_admin() then raise exception 'Hanya admin yang dapat memproses refund.' using errcode = '42501'; end if;
  update pembayaran set refund_diproses = true where penyewaan_id = p_id and refund_nominal > 0;
  if not found then raise exception 'Tidak ada refund yang perlu diproses.'; end if;
end $$;

-- ---------- pengembalian: simpan jumlah rusak ----------
create or replace function catat_pengembalian(
  p_id uuid, p_waktu timestamptz, p_jumlah_kembali int, p_kondisi kondisi_aset default 'baik',
  p_catatan text default null, p_jumlah_rusak int default 0,
  p_denda_kerusakan numeric default 0, p_catatan_kerusakan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p penyewaan%rowtype; a aset%rowtype; nominal_telat numeric; hilang int;
begin
  if not adalah_staf() then raise exception 'Hanya petugas atau admin yang dapat mencatat pengembalian.' using errcode = '42501'; end if;
  select * into p from penyewaan where id = p_id for update;
  if not found then raise exception 'Transaksi tidak ditemukan.'; end if;
  if p.status <> 'sedang_disewa' then raise exception 'Pengembalian hanya untuk transaksi berstatus Sedang Disewa.'; end if;
  if p_jumlah_kembali < 0 or p_jumlah_kembali > p.jumlah then raise exception 'Jumlah kembali tidak valid.'; end if;
  if p_jumlah_rusak < 0 or p_jumlah_rusak > p_jumlah_kembali then raise exception 'Jumlah rusak tidak valid.'; end if;

  insert into pengembalian (penyewaan_id, petugas_id, waktu_aktual, jumlah_kembali, kondisi, catatan, jumlah_rusak)
  values (p_id, auth.uid(), p_waktu, p_jumlah_kembali, p_kondisi, p_catatan, p_jumlah_rusak);

  nominal_telat := hitung_denda_terlambat(p_id, p_waktu);
  if nominal_telat > 0 then
    insert into denda (penyewaan_id, jenis, nominal, dikonfirmasi, catatan)
    values (p_id, 'terlambat', nominal_telat, true, 'Dihitung otomatis menurut aturan keterlambatan.');
  end if;
  if coalesce(p_denda_kerusakan, 0) > 0 then
    insert into denda (penyewaan_id, jenis, nominal, dikonfirmasi, catatan)
    values (p_id, 'kerusakan', p_denda_kerusakan, false, p_catatan_kerusakan);
  end if;

  select * into a from aset where id = p.aset_id for update;
  if a.jenis = 'ruangan' then
    update aset set kondisi = p_kondisi, kondisi_detail = null where id = a.id;
  else
    hilang := p.jumlah - p_jumlah_kembali;
    update aset set stok_total = stok_total - hilang, stok_rusak = least(stok_rusak + p_jumlah_rusak, stok_total - hilang),
           kondisi = case when p_kondisi = 'baik' then kondisi else p_kondisi end, kondisi_detail = null where id = a.id;
  end if;
  update penyewaan set status = 'dikembalikan' where id = p_id;
end $$;

-- ---------- ubah kondisi aset: detail teks lama dibersihkan ----------
create or replace function ubah_kondisi_aset(p_aset uuid, p_kondisi kondisi_aset, p_stok_rusak int default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not adalah_staf() then raise exception 'Tidak berwenang.' using errcode = '42501'; end if;
  update aset set kondisi = p_kondisi, stok_rusak = least(coalesce(p_stok_rusak, stok_rusak), coalesce(stok_total, 0)), kondisi_detail = null
   where id = p_aset;
  if not found then raise exception 'Aset tidak ditemukan.'; end if;
end $$;

-- ---------- hak eksekusi ----------
revoke execute on function tandai_refund(uuid) from public, anon;
grant execute on function tandai_refund(uuid) to authenticated;
revoke execute on function verifikasi_pembayaran(uuid, boolean, text), batalkan_penyewaan(uuid, text),
  catat_pengembalian(uuid, timestamptz, int, kondisi_aset, text, int, numeric, text),
  ubah_kondisi_aset(uuid, kondisi_aset, int), format_nomor_kontrak(int, timestamptz) from public, anon;
grant execute on function verifikasi_pembayaran(uuid, boolean, text), batalkan_penyewaan(uuid, text),
  catat_pengembalian(uuid, timestamptz, int, kondisi_aset, text, int, numeric, text),
  ubah_kondisi_aset(uuid, kondisi_aset, int), format_nomor_kontrak(int, timestamptz) to authenticated;

-- Pembatalan otomatis transaksi yang lewat batas bayar boleh dipicu aplikasi saat dashboard dibuka
-- (aman: hanya membatalkan transaksi yang memang sudah melewati batas waktu menurut aturan, dan idempoten).
grant execute on function batalkan_kedaluwarsa() to authenticated;
