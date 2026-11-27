-- =====================================================================
-- SIPASTI — 01_skema.sql
-- Tabel, tipe data, aturan bisnis (trigger), dan fungsi alur (RPC).
-- Jalankan PERTAMA di Supabase: SQL Editor > New query > paste > Run.
-- Waktu jadwal disimpan sebagai waktu lokal WIB (timestamp tanpa zona).
-- =====================================================================

create extension if not exists btree_gist;

-- ---------- tipe enum ----------
create type peran_pengguna   as enum ('penyewa', 'petugas', 'admin');
create type tipe_penyewa     as enum ('mahasiswa', 'dosen', 'staf');
create type jenis_aset       as enum ('ruangan', 'peralatan');
create type satuan_sewa      as enum ('jam', 'hari', 'kegiatan', 'unit');
create type kondisi_aset     as enum ('baik', 'rusak_ringan', 'rusak_berat', 'pemeliharaan');
create type status_penyewaan as enum ('diajukan', 'disetujui', 'sedang_disewa', 'dikembalikan', 'selesai', 'ditolak', 'dibatalkan');
create type status_pembayaran as enum ('belum_dibayar', 'menunggu_verifikasi', 'lunas', 'bukti_ditolak');
create type status_denda     as enum ('belum_dibayar', 'lunas');

create sequence seq_nomor_penyewaan;

-- ---------- fungsi bantu umum ----------
create or replace function set_diubah() returns trigger language plpgsql as $$
begin
  new.diubah := now();
  return new;
end $$;

-- true hanya saat skrip data dummy dijalankan dari SQL Editor (bukan dari pengguna aplikasi)
create or replace function sedang_seed() returns boolean language sql stable as $$
  select coalesce(current_setting('sipasti.seed', true), '') = 'on' and auth.uid() is null
$$;

-- =====================================================================
-- PENGGUNA
-- =====================================================================
create table profil_pengguna (
  id        uuid primary key references auth.users(id) on delete cascade,
  nama      text not null,
  email     text not null unique,
  tipe      tipe_penyewa,
  idn       text,                       -- NIM / NIP
  telepon   text,
  peran     peran_pengguna not null default 'penyewa',
  aktif     boolean not null default true,
  dibuat    timestamptz not null default now(),
  diubah    timestamptz not null default now()
);
create trigger trg_profil_diubah before update on profil_pengguna for each row execute function set_diubah();

create or replace function peran_saya() returns peran_pengguna
language sql stable security definer set search_path = public as $$
  select peran from profil_pengguna where id = auth.uid() and aktif
$$;
create or replace function adalah_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(peran_saya() = 'admin', false)
$$;
create or replace function adalah_staf() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(peran_saya() in ('admin', 'petugas'), false)
$$;

-- Profil dibuat otomatis saat registrasi. Peran SELALU 'penyewa' (admin/petugas diatur admin).
create or replace function buat_profil_baru() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into profil_pengguna (id, nama, email, tipe, idn, telepon, peran)
  values (
    new.id,
    coalesce(nullif(m->>'nama', ''), split_part(new.email, '@', 1)),
    new.email,
    case when m->>'tipe' in ('mahasiswa', 'dosen', 'staf') then (m->>'tipe')::tipe_penyewa end,
    nullif(m->>'idn', ''),
    nullif(m->>'telepon', ''),
    'penyewa'
  );
  return new;
end $$;
create trigger trg_auth_user_baru after insert on auth.users for each row execute function buat_profil_baru();

-- Pengguna biasa tidak bisa mengubah peran, status aktif, atau email lewat profil.
create or replace function jaga_profil() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not adalah_admin() then
    new.peran := old.peran;
    new.aktif := old.aktif;
    new.email := old.email;
  end if;
  return new;
end $$;
create trigger trg_profil_jaga before update on profil_pengguna for each row execute function jaga_profil();

-- =====================================================================
-- ASET
-- =====================================================================
create table kategori_aset (
  id       bigint generated always as identity primary key,
  nama     text not null,
  induk_id bigint references kategori_aset(id) on delete restrict,
  jenis    jenis_aset not null,
  aktif    boolean not null default true
);
create unique index uq_kategori on kategori_aset (coalesce(induk_id, 0), nama);

create table aset (
  id             uuid primary key default gen_random_uuid(),
  kode           text not null unique,
  slug           text not null unique,
  nama           text not null,
  nama_lengkap   text,
  kategori_id    bigint not null references kategori_aset(id),
  jenis          jenis_aset not null,
  lokasi         text,
  pengelola      text,
  kapasitas      int,
  kapasitas_satuan text,
  stok_total     int,
  stok_rusak     int not null default 0,
  stok_satuan    text,
  stok_tersedia  int generated always as (stok_total - stok_rusak) stored,
  kondisi        kondisi_aset not null default 'baik',
  kondisi_detail text,
  ringkas        text,
  deskripsi      text,
  fasilitas      text,
  dokumen_khusus text,
  aturan         text[] not null default '{}',
  aktif          boolean not null default true,
  dibuat         timestamptz not null default now(),
  diubah         timestamptz not null default now(),
  constraint cek_jenis_ruangan  check (jenis <> 'ruangan'  or (kapasitas is not null and stok_total is null)),
  constraint cek_jenis_peralatan check (jenis <> 'peralatan' or (stok_total is not null and stok_total >= 0)),
  constraint cek_stok_rusak check (stok_total is null or (stok_rusak >= 0 and stok_rusak <= stok_total))
);
create trigger trg_aset_diubah before update on aset for each row execute function set_diubah();

-- Foto: berkas ada di R2 (publik) atau Supabase Storage; tabel hanya menyimpan kunci objek.
create table foto_aset (
  id          uuid primary key default gen_random_uuid(),
  aset_id     uuid not null references aset(id) on delete cascade,
  penyimpanan text not null default 'r2' check (penyimpanan in ('r2', 'supabase')),
  object_key  text not null,
  urutan      int not null default 0,
  unique (aset_id, urutan)
);

create table tarif_aset (
  id      uuid primary key default gen_random_uuid(),
  aset_id uuid not null references aset(id) on delete cascade,
  satuan  satuan_sewa not null,
  nominal numeric(12,0) not null check (nominal >= 0),
  unique (aset_id, satuan)
);

create table blokir_jadwal (
  id        uuid primary key default gen_random_uuid(),
  aset_id   uuid not null references aset(id) on delete cascade,
  mulai     timestamp not null,
  selesai   timestamp not null,
  alasan    text not null,
  dibuat_oleh uuid references profil_pengguna(id),
  check (selesai > mulai)
);

create table pengaturan (
  id                 int primary key default 1 check (id = 1),   -- satu baris saja
  denda_persen       numeric(5,2) not null default 10  check (denda_persen between 0 and 100),
  toleransi_menit    int not null default 30 check (toleransi_menit >= 0),
  batas_bayar_jam    int not null default 24 check (batas_bayar_jam > 0),
  min_pengajuan_hari int not null default 2  check (min_pengajuan_hari >= 0),
  maks_durasi_hari   int not null default 7  check (maks_durasi_hari > 0),
  diubah             timestamptz not null default now()
);
insert into pengaturan (id) values (1);
create trigger trg_pengaturan_diubah before update on pengaturan for each row execute function set_diubah();

-- =====================================================================
-- PENYEWAAN
-- =====================================================================
create or replace function periode_penyewaan(tm date, ts date, jm time, js time) returns tsrange
language sql immutable as $$
  select tsrange(tm + coalesce(jm, time '07:00'), ts + coalesce(js, time '18:00'), '[)')
$$;

create table penyewaan (
  id                 uuid primary key default gen_random_uuid(),
  nomor              text not null unique default ('SPT-' || lpad(nextval('seq_nomor_penyewaan')::text, 4, '0')),
  penyewa_id         uuid not null references profil_pengguna(id),
  aset_id            uuid not null references aset(id),
  jenis_aset         jenis_aset not null,                 -- salinan, diisi otomatis
  jumlah             int not null default 1 check (jumlah > 0),
  satuan             satuan_sewa not null,
  tarif_satuan       numeric(12,0) not null,              -- salinan tarif saat transaksi (BR-04)
  durasi             int not null default 1 check (durasi > 0),
  tanggal_mulai      date not null,
  tanggal_selesai    date not null,
  jam_mulai          time,
  jam_selesai        time,
  tujuan             text not null check (length(trim(tujuan)) >= 5),
  total_biaya        numeric(12,0) not null,
  status             status_penyewaan not null default 'diajukan',
  catatan_admin      text,
  kunci_idempotensi  text unique,                         -- cegah transaksi ganda saat kirim ulang (FR-19)
  disetujui_pada     timestamptz,
  dibuat             timestamptz not null default now(),
  diubah             timestamptz not null default now(),
  periode            tsrange generated always as (periode_penyewaan(tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai)) stored,
  constraint cek_tanggal check (tanggal_selesai >= tanggal_mulai),
  -- BR-01: dua transaksi aktif pada ruangan yang sama tidak boleh tumpang tindih
  constraint cegah_bentrok_ruangan exclude using gist (aset_id with =, periode with &&)
    where (jenis_aset = 'ruangan' and status in ('disetujui', 'sedang_disewa'))
);
create index idx_penyewaan_penyewa on penyewaan (penyewa_id);
create index idx_penyewaan_aset on penyewaan (aset_id, status);
create trigger trg_penyewaan_diubah before update on penyewaan for each row execute function set_diubah();
alter sequence seq_nomor_penyewaan owned by penyewaan.nomor;

create table dokumen_penyewaan (
  id          uuid primary key default gen_random_uuid(),
  penyewaan_id uuid not null references penyewaan(id) on delete cascade,
  jenis       text not null,
  nama_berkas text not null,
  ukuran_byte bigint,
  penyimpanan text not null default 'supabase' check (penyimpanan in ('r2', 'supabase')),
  object_key  text not null,
  dibuat      timestamptz not null default now()
);

create table pembayaran (
  id                  uuid primary key default gen_random_uuid(),
  penyewaan_id        uuid not null unique references penyewaan(id) on delete cascade,
  nominal             numeric(12,0) not null,
  status              status_pembayaran not null default 'belum_dibayar',
  batas_bayar         timestamptz,
  penyimpanan         text check (penyimpanan in ('r2', 'supabase')),
  object_key          text,                                -- bukti bayar
  nama_berkas         text,
  dikirim_pada        timestamptz,
  diverifikasi_oleh   uuid references profil_pengguna(id),
  diverifikasi_pada   timestamptz,
  catatan_verifikasi  text,
  refund_persen       int check (refund_persen between 0 and 100),
  refund_nominal      numeric(12,0) not null default 0,
  refund_pada         timestamptz,
  alasan_batal        text,
  dibuat              timestamptz not null default now(),
  diubah              timestamptz not null default now()
);
create trigger trg_pembayaran_diubah before update on pembayaran for each row execute function set_diubah();

create table serah_terima (
  id           uuid primary key default gen_random_uuid(),
  penyewaan_id uuid not null unique references penyewaan(id) on delete cascade,
  petugas_id   uuid references profil_pengguna(id),
  waktu        timestamptz not null default now(),
  jumlah       int not null check (jumlah > 0),
  kondisi      kondisi_aset not null default 'baik',
  catatan      text
);

create table pengembalian (
  id            uuid primary key default gen_random_uuid(),
  penyewaan_id  uuid not null unique references penyewaan(id) on delete cascade,
  petugas_id    uuid references profil_pengguna(id),
  waktu_aktual  timestamptz not null,
  jumlah_kembali int not null check (jumlah_kembali >= 0),
  kondisi       kondisi_aset not null default 'baik',
  catatan       text
);

create table denda (
  id            uuid primary key default gen_random_uuid(),
  penyewaan_id  uuid not null references penyewaan(id) on delete cascade,
  jenis         text not null check (jenis in ('terlambat', 'kerusakan')),
  nominal       numeric(12,0) not null check (nominal >= 0),
  status        status_denda not null default 'belum_dibayar',
  dikonfirmasi  boolean not null default false,            -- BR-09: kerusakan dikonfirmasi admin
  catatan       text,
  dibuat        timestamptz not null default now(),
  dilunasi_pada timestamptz,
  unique (penyewaan_id, jenis)
);

create table riwayat_penyewaan (
  id           uuid primary key default gen_random_uuid(),
  penyewaan_id uuid not null references penyewaan(id) on delete cascade,
  status       status_penyewaan not null,
  keterangan   text,
  oleh         uuid,
  waktu        timestamptz not null default now()
);
create index idx_riwayat on riwayat_penyewaan (penyewaan_id, waktu);

-- =====================================================================
-- ATURAN BISNIS
-- =====================================================================

-- Pemeriksaan ketersediaan (BR-01, BR-02, BR-10). Mengembalikan pesan galat atau NULL bila tersedia.
create or replace function cek_ketersediaan(p_aset uuid, p_periode tsrange, p_jumlah int, p_kecuali uuid default null)
returns text language plpgsql stable security definer set search_path = public as $$
declare a aset%rowtype; terpakai int;
begin
  select * into a from aset where id = p_aset;
  if not found then return 'Aset tidak ditemukan.'; end if;
  if not a.aktif or a.kondisi in ('rusak_berat', 'pemeliharaan') then
    return 'Aset sedang tidak dapat disewa (nonaktif, rusak berat, atau dalam pemeliharaan).';
  end if;
  if exists (select 1 from blokir_jadwal b where b.aset_id = p_aset and tsrange(b.mulai, b.selesai, '[)') && p_periode) then
    return 'Jadwal aset diblokir untuk perawatan atau kegiatan kampus pada periode tersebut.';
  end if;
  if a.jenis = 'ruangan' then
    if exists (select 1 from penyewaan p
               where p.aset_id = p_aset and p.status in ('disetujui', 'sedang_disewa')
                 and p.periode && p_periode and p.id is distinct from p_kecuali) then
      return 'Jadwal bentrok dengan penyewaan lain pada ruangan yang sama.';
    end if;
  else
    select coalesce(sum(p.jumlah), 0) into terpakai from penyewaan p
     where p.aset_id = p_aset and p.status in ('disetujui', 'sedang_disewa')
       and p.periode && p_periode and p.id is distinct from p_kecuali;
    if terpakai + p_jumlah > a.stok_tersedia then
      return format('Stok tidak mencukupi. Tersisa %s %s pada periode tersebut.',
                    greatest(a.stok_tersedia - terpakai, 0), coalesce(a.stok_satuan, 'unit'));
    end if;
  end if;
  return null;
end $$;

-- Validasi dan penghitungan otomatis saat pengajuan dibuat (FR-14 s.d. FR-19).
create or replace function penyewaan_sebelum_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  a aset%rowtype; cfg pengaturan%rowtype; seed boolean := sedang_seed();
  v_tarif numeric; hari_ini date := (now() at time zone 'Asia/Jakarta')::date; err text;
begin
  select * into a from aset where id = new.aset_id for update;       -- kunci agar pemeriksaan tidak balapan
  if not found then raise exception 'Aset tidak ditemukan.'; end if;
  select * into cfg from pengaturan where id = 1;

  select nominal into v_tarif from tarif_aset where aset_id = new.aset_id and satuan = new.satuan;
  if v_tarif is null then raise exception 'Aset ini tidak memiliki tarif untuk satuan sewa yang dipilih.'; end if;

  new.jenis_aset := a.jenis;
  new.tarif_satuan := v_tarif;
  if a.jenis = 'ruangan' then new.jumlah := 1; end if;

  if new.satuan = 'jam' then
    if new.jam_mulai is null or new.jam_selesai is null then
      raise exception 'Jam mulai dan jam selesai wajib diisi untuk sewa per jam.'; end if;
    new.tanggal_selesai := new.tanggal_mulai;
    if new.jam_selesai <= new.jam_mulai then raise exception 'Jam selesai harus setelah jam mulai.'; end if;
    new.durasi := ceil(extract(epoch from (new.jam_selesai - new.jam_mulai)) / 3600)::int;
  elsif new.satuan = 'hari' then
    new.jam_mulai := null; new.jam_selesai := null;
    new.durasi := (new.tanggal_selesai - new.tanggal_mulai) + 1;
  else
    new.jam_mulai := null; new.jam_selesai := null;
    new.durasi := 1;
  end if;
  new.total_biaya := new.tarif_satuan * (case when new.satuan in ('jam', 'hari') then new.durasi else 1 end) * new.jumlah;

  if not seed then
    new.status := 'diajukan'; new.catatan_admin := null; new.disetujui_pada := null;
    if new.tanggal_mulai < hari_ini + cfg.min_pengajuan_hari then
      raise exception 'Pengajuan paling lambat % hari sebelum pemakaian.', cfg.min_pengajuan_hari; end if;
    if extract(dow from new.tanggal_mulai) = 0 or extract(dow from new.tanggal_selesai) = 0 then
      raise exception 'Penyewaan hanya dilayani Senin sampai Sabtu.'; end if;
    if new.satuan = 'jam' and not ((new.jam_mulai >= time '07:00' and new.jam_selesai <= time '11:30')
                                or (new.jam_mulai >= time '12:30' and new.jam_selesai <= time '18:00')) then
      raise exception 'Waktu sewa harus berada pada sesi 07.00–11.30 atau 12.30–18.00 (11.30–12.30 istirahat).'; end if;
    if new.satuan = 'hari' and new.durasi > cfg.maks_durasi_hari then
      raise exception 'Durasi sewa maksimal % hari.', cfg.maks_durasi_hari; end if;
    if a.jenis = 'peralatan' and new.jumlah > a.stok_tersedia then
      raise exception 'Jumlah melebihi stok yang tersedia (% %).', a.stok_tersedia, coalesce(a.stok_satuan, 'unit'); end if;
    err := cek_ketersediaan(new.aset_id, periode_penyewaan(new.tanggal_mulai, new.tanggal_selesai, new.jam_mulai, new.jam_selesai), new.jumlah);
    if err is not null then raise exception '%', err; end if;
  end if;
  return new;
end $$;
create trigger trg_penyewaan_sebelum_insert before insert on penyewaan for each row execute function penyewaan_sebelum_insert();

-- Riwayat status otomatis
create or replace function catat_riwayat() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into riwayat_penyewaan (penyewaan_id, status, keterangan, oleh)
    values (new.id, new.status,
            case when tg_op = 'INSERT' then 'Pengajuan dibuat.'
                 when new.status in ('ditolak', 'dibatalkan', 'disetujui') then new.catatan_admin end,
            auth.uid());
  end if;
  return null;
end $$;
create trigger trg_penyewaan_riwayat after insert or update of status on penyewaan for each row execute function catat_riwayat();

-- =====================================================================
-- FUNGSI ALUR (dipanggil dari aplikasi lewat supabase.rpc)
-- =====================================================================
create or replace function wajib_login() returns uuid language plpgsql stable as $$
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu.' using errcode = '42501'; end if;
  return auth.uid();
end $$;

create or replace function setujui_penyewaan(p_id uuid, p_catatan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p penyewaan%rowtype; cfg pengaturan%rowtype; err text; batas timestamptz;
begin
  if not adalah_admin() then raise exception 'Hanya admin yang dapat menyetujui pengajuan.' using errcode = '42501'; end if;
  select * into p from penyewaan where id = p_id for update;
  if not found then raise exception 'Transaksi tidak ditemukan.'; end if;
  if p.status <> 'diajukan' then raise exception 'Hanya pengajuan berstatus Diajukan yang dapat disetujui.'; end if;
  perform 1 from aset where id = p.aset_id for update;
  err := cek_ketersediaan(p.aset_id, p.periode, p.jumlah, p.id);
  if err is not null then raise exception '%', err; end if;
  select * into cfg from pengaturan where id = 1;
  -- BR-05: 24 jam setelah persetujuan atau H-1 (mana yang lebih awal)
  batas := least(now() + make_interval(hours => cfg.batas_bayar_jam),
                 ((p.tanggal_mulai - 1) + time '23:59') at time zone 'Asia/Jakarta');
  update penyewaan set status = 'disetujui', catatan_admin = p_catatan, disetujui_pada = now() where id = p_id;
  insert into pembayaran (penyewaan_id, nominal, batas_bayar) values (p_id, p.total_biaya, batas)
  on conflict (penyewaan_id) do nothing;
end $$;

create or replace function tolak_penyewaan(p_id uuid, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
declare p penyewaan%rowtype;
begin
  if not adalah_admin() then raise exception 'Hanya admin yang dapat menolak pengajuan.' using errcode = '42501'; end if;
  if p_catatan is null or length(trim(p_catatan)) < 3 then raise exception 'Catatan penolakan wajib diisi.'; end if;
  select * into p from penyewaan where id = p_id for update;
  if not found then raise exception 'Transaksi tidak ditemukan.'; end if;
  if p.status <> 'diajukan' then raise exception 'Hanya pengajuan berstatus Diajukan yang dapat ditolak.'; end if;
  update penyewaan set status = 'ditolak', catatan_admin = p_catatan where id = p_id;
end $$;

create or replace function kirim_bukti_bayar(p_id uuid, p_penyimpanan text, p_object_key text, p_nama text) returns void
language plpgsql security definer set search_path = public as $$
declare p penyewaan%rowtype; b pembayaran%rowtype; uid uuid := wajib_login();
begin
  select * into p from penyewaan where id = p_id for update;
  if not found or p.penyewa_id <> uid then raise exception 'Transaksi tidak ditemukan.'; end if;
  if p.status <> 'disetujui' then raise exception 'Bukti bayar hanya dapat diunggah untuk transaksi yang disetujui.'; end if;
  select * into b from pembayaran where penyewaan_id = p_id for update;
  if b.status not in ('belum_dibayar', 'bukti_ditolak') then raise exception 'Pembayaran sudah dikirim atau lunas.'; end if;
  if b.batas_bayar is not null and now() > b.batas_bayar then raise exception 'Batas waktu pembayaran telah terlewat.'; end if;
  if p_penyimpanan not in ('r2', 'supabase') or p_object_key is null or p_object_key = '' then
    raise exception 'Data berkas tidak valid.'; end if;
  update pembayaran set status = 'menunggu_verifikasi', penyimpanan = p_penyimpanan, object_key = p_object_key,
         nama_berkas = p_nama, dikirim_pada = now(), catatan_verifikasi = null where penyewaan_id = p_id;
end $$;

create or replace function verifikasi_pembayaran(p_id uuid, p_setuju boolean, p_catatan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare b pembayaran%rowtype;
begin
  if not adalah_admin() then raise exception 'Hanya admin yang dapat memverifikasi pembayaran.' using errcode = '42501'; end if;
  select * into b from pembayaran where penyewaan_id = p_id for update;
  if not found then raise exception 'Data pembayaran tidak ditemukan.'; end if;
  if b.status <> 'menunggu_verifikasi' then raise exception 'Pembayaran ini tidak sedang menunggu verifikasi.'; end if;
  if not p_setuju and (p_catatan is null or length(trim(p_catatan)) < 3) then
    raise exception 'Alasan penolakan bukti wajib diisi.'; end if;
  update pembayaran set status = case when p_setuju then 'lunas'::status_pembayaran else 'bukti_ditolak' end,
         diverifikasi_oleh = auth.uid(), diverifikasi_pada = now(), catatan_verifikasi = p_catatan
   where penyewaan_id = p_id;
end $$;

create or replace function catat_serah_terima(p_id uuid, p_jumlah int, p_kondisi kondisi_aset default 'baik', p_catatan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p penyewaan%rowtype; b pembayaran%rowtype;
begin
  if not adalah_staf() then raise exception 'Hanya petugas atau admin yang dapat mencatat serah terima.' using errcode = '42501'; end if;
  select * into p from penyewaan where id = p_id for update;
  if not found then raise exception 'Transaksi tidak ditemukan.'; end if;
  if p.status <> 'disetujui' then raise exception 'Serah terima hanya untuk transaksi berstatus Disetujui.'; end if;
  select * into b from pembayaran where penyewaan_id = p_id;
  if b.status is distinct from 'lunas' then raise exception 'Serah terima hanya dapat dilakukan setelah pembayaran lunas.'; end if;
  if p_jumlah <> p.jumlah then raise exception 'Jumlah serah terima harus sama dengan jumlah yang disewa (%).', p.jumlah; end if;
  insert into serah_terima (penyewaan_id, petugas_id, jumlah, kondisi, catatan) values (p_id, auth.uid(), p_jumlah, p_kondisi, p_catatan);
  update penyewaan set status = 'sedang_disewa' where id = p_id;
end $$;

-- Denda keterlambatan (BR-08)
create or replace function hitung_denda_terlambat(p_id uuid, p_waktu_aktual timestamptz) returns numeric
language plpgsql stable security definer set search_path = public as $$
declare p penyewaan%rowtype; cfg pengaturan%rowtype; akhir timestamp; telat interval; unit numeric;
begin
  select * into p from penyewaan where id = p_id;
  select * into cfg from pengaturan where id = 1;
  akhir := p.tanggal_selesai + coalesce(p.jam_selesai, time '18:00');
  telat := (p_waktu_aktual at time zone 'Asia/Jakarta') - akhir;
  if telat <= make_interval(mins => cfg.toleransi_menit) then return 0; end if;
  unit := case p.satuan when 'jam' then ceil(extract(epoch from telat) / 3600)
                        else ceil(extract(epoch from telat) / 86400) end;
  return least(p.total_biaya, round(p.tarif_satuan * cfg.denda_persen / 100 * unit * p.jumlah));
end $$;

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

  insert into pengembalian (penyewaan_id, petugas_id, waktu_aktual, jumlah_kembali, kondisi, catatan)
  values (p_id, auth.uid(), p_waktu, p_jumlah_kembali, p_kondisi, p_catatan);

  nominal_telat := hitung_denda_terlambat(p_id, p_waktu);
  if nominal_telat > 0 then
    insert into denda (penyewaan_id, jenis, nominal, dikonfirmasi, catatan)
    values (p_id, 'terlambat', nominal_telat, true, 'Dihitung otomatis menurut aturan keterlambatan.');
  end if;
  if coalesce(p_denda_kerusakan, 0) > 0 then
    insert into denda (penyewaan_id, jenis, nominal, dikonfirmasi, catatan)
    values (p_id, 'kerusakan', p_denda_kerusakan, false, p_catatan_kerusakan);
  end if;

  -- FR-32: perbarui kondisi dan ketersediaan aset
  select * into a from aset where id = p.aset_id for update;
  if a.jenis = 'ruangan' then
    update aset set kondisi = p_kondisi where id = a.id;
  else
    hilang := p.jumlah - p_jumlah_kembali;
    update aset set stok_total = stok_total - hilang, stok_rusak = least(stok_rusak + p_jumlah_rusak, stok_total - hilang) where id = a.id;
  end if;
  update penyewaan set status = 'dikembalikan' where id = p_id;
end $$;

create or replace function konfirmasi_denda(p_denda_id uuid, p_nominal numeric default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not adalah_admin() then raise exception 'Hanya admin yang dapat mengonfirmasi denda.' using errcode = '42501'; end if;
  update denda set dikonfirmasi = true, nominal = coalesce(p_nominal, nominal) where id = p_denda_id;
  if not found then raise exception 'Denda tidak ditemukan.'; end if;
end $$;

create or replace function lunasi_denda(p_denda_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not adalah_admin() then raise exception 'Hanya admin yang dapat mencatat pelunasan denda.' using errcode = '42501'; end if;
  update denda set status = 'lunas', dilunasi_pada = now() where id = p_denda_id and dikonfirmasi;
  if not found then raise exception 'Denda tidak ditemukan atau belum dikonfirmasi.'; end if;
end $$;

-- FR-33: penutupan transaksi
create or replace function selesaikan_penyewaan(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not adalah_staf() then raise exception 'Tidak berwenang.' using errcode = '42501'; end if;
  if (select status from penyewaan where id = p_id) is distinct from 'dikembalikan' then
    raise exception 'Hanya transaksi berstatus Dikembalikan yang dapat diselesaikan.'; end if;
  if exists (select 1 from denda where penyewaan_id = p_id and (status <> 'lunas' or not dikonfirmasi)) then
    raise exception 'Masih ada denda yang belum dikonfirmasi atau belum lunas.'; end if;
  update penyewaan set status = 'selesai' where id = p_id;
end $$;

-- Pembatalan + refund (BR-07). Penyewa: transaksinya sendiri; admin: pembatalan oleh pihak kampus (refund 100%).
create or replace function batalkan_penyewaan(p_id uuid, p_alasan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p penyewaan%rowtype; b pembayaran%rowtype; uid uuid := wajib_login(); oleh_kampus boolean := adalah_admin();
        selisih int; persen int := 0; hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
begin
  select * into p from penyewaan where id = p_id for update;
  if not found or (p.penyewa_id <> uid and not oleh_kampus) then raise exception 'Transaksi tidak ditemukan.'; end if;
  if p.status not in ('diajukan', 'disetujui') then raise exception 'Transaksi dengan status ini tidak dapat dibatalkan.'; end if;
  if oleh_kampus and p.penyewa_id <> uid and (p_alasan is null or length(trim(p_alasan)) < 3) then
    raise exception 'Alasan pembatalan wajib diisi.'; end if;

  select * into b from pembayaran where penyewaan_id = p_id for update;
  if found and b.status in ('lunas', 'menunggu_verifikasi') then
    if oleh_kampus and p.penyewa_id <> uid then persen := 100;
    else
      selisih := p.tanggal_mulai - hari_ini;
      persen := case when selisih >= 3 then 100 when selisih >= 1 then 50 else 0 end;
    end if;
    update pembayaran set refund_persen = persen, refund_nominal = round(p.total_biaya * persen / 100.0),
           refund_pada = now(), alasan_batal = p_alasan where penyewaan_id = p_id;
  end if;
  update penyewaan set status = 'dibatalkan', catatan_admin = coalesce(p_alasan, catatan_admin) where id = p_id;
end $$;

-- FR-26: batalkan otomatis transaksi yang tidak dibayar hingga batas waktu.
-- Dijalankan terjadwal (pg_cron / Edge Function), bukan oleh pengguna.
create or replace function batalkan_kedaluwarsa() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with k as (
    select p.id from penyewaan p join pembayaran b on b.penyewaan_id = p.id
     where p.status = 'disetujui' and b.status in ('belum_dibayar', 'bukti_ditolak') and b.batas_bayar < now()
     for update of p
  )
  update penyewaan set status = 'dibatalkan', catatan_admin = 'Dibatalkan otomatis: melewati batas waktu pembayaran.'
   where id in (select id from k);
  get diagnostics n = row_count;
  return n;
end $$;

-- FR-32: petugas/admin memperbarui kondisi aset
create or replace function ubah_kondisi_aset(p_aset uuid, p_kondisi kondisi_aset, p_stok_rusak int default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not adalah_staf() then raise exception 'Tidak berwenang.' using errcode = '42501'; end if;
  update aset set kondisi = p_kondisi, stok_rusak = coalesce(p_stok_rusak, stok_rusak) where id = p_aset;
  if not found then raise exception 'Aset tidak ditemukan.'; end if;
end $$;
