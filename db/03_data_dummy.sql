-- =====================================================================
-- SIPASTI — 03_data_dummy.sql
-- Data contoh: 7 akun uji, 17 aset, tarif, 12 transaksi, pembayaran, serah terima, pengembalian, denda.
-- Jalankan KETIGA (setelah 01 dan 02). Jalankan SEKALI saja. Semua akun bersandi: Sipasti123
-- Tanggal transaksi dihitung relatif terhadap hari ini (hari Minggu otomatis digeser ke Senin).
-- Berkas (dokumen/bukti bayar) pada data ini hanya metadata contoh; berkas aslinya tidak ada di Storage.
-- =====================================================================
begin;
set local sipasti.seed = 'on';

-- ---------- AKUN UJI ----------
do $$
declare u record;
begin
  for u in select * from (values
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'mahasiswa@students.unnes.ac.id',  'Rizky Pratama',  'mahasiswa', '4201421008', '081234567890', 'penyewa'),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'petugas@mail.unnes.ac.id',        'Slamet Riyadi',  null,        null,         null,           'petugas'),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'admin@mail.unnes.ac.id',          'Admin FMIPA',    null,        null,         null,           'admin'),
    ('a0000000-0000-0000-0000-000000000004'::uuid, 'sinta@students.unnes.ac.id',      'Sinta Maharani', 'mahasiswa', '4301422089', '081234567891', 'penyewa'),
    ('a0000000-0000-0000-0000-000000000005'::uuid, 'dewi.lestari@mail.unnes.ac.id',   'Dewi Lestari',   'dosen',     '198503122010012003', '081234567892', 'penyewa'),
    ('a0000000-0000-0000-0000-000000000006'::uuid, 'budi.hartono@mail.unnes.ac.id',   'Budi Hartono',   'staf',      '197901052005011002', '081234567893', 'penyewa'),
    ('a0000000-0000-0000-0000-000000000007'::uuid, 'andi.prakoso@mail.unnes.ac.id',   'Andi Prakoso',   'dosen',     '198207182008011004', '081234567894', 'penyewa')
  ) as t(id, email, nama, tipe, idn, telp, peran)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change, email_change_token_new)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
            extensions.crypt('Sipasti123', extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('nama', u.nama, 'tipe', u.tipe, 'idn', u.idn, 'telepon', u.telp),
            now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
            'email', now(), now(), now());
    update profil_pengguna set peran = u.peran::peran_pengguna where id = u.id;
  end loop;
end $$;

-- ASET (17 aset FMIPA UNNES; stok, kapasitas, dan tarif adalah data dummy)
insert into kategori_aset (nama, jenis) values ('Fasilitas dan Ruangan', 'ruangan'), ('Peralatan dan Perlengkapan', 'peralatan');
insert into kategori_aset (nama, induk_id, jenis)
select s.nama, k.id, k.jenis from (values
  ('Aula', 'Fasilitas dan Ruangan'), ('Laboratorium', 'Fasilitas dan Ruangan'), ('Ruang Rapat', 'Fasilitas dan Ruangan'),
  ('Audio Visual', 'Peralatan dan Perlengkapan'), ('Perlengkapan Acara', 'Peralatan dan Perlengkapan')
) s(nama, induk) join kategori_aset k on k.nama = s.induk and k.induk_id is null;

insert into aset (kode, slug, nama, nama_lengkap, kategori_id, jenis, lokasi, pengelola, kapasitas, kapasitas_satuan,
                  stok_total, stok_rusak, stok_satuan, kondisi, kondisi_detail, ringkas, deskripsi, fasilitas, dokumen_khusus, aturan, aktif)
values
($t$FAS-01$t$, $t$aula-d12$t$, $t$Aula D12$t$, null, (select id from kategori_aset where nama = $t$Aula$t$), 'ruangan', $t$Gedung D12 FMIPA UNNES$t$, null, 250, null, null, 0, null, 'baik', null, $t$Aula serbaguna untuk seminar, wisuda prodi, dan kegiatan kemahasiswaan skala besar.$t$, $t$Aula D12 dirancang untuk kegiatan berkapasitas besar dengan tata suara dan pencahayaan panggung, cocok untuk seminar nasional, kuliah umum, dan acara kemahasiswaan.$t$, $t$AC sentral, panggung, tata suara, proyektor dan layar besar, ruang transit$t$, $t$Rincian kegiatan wajib dilampirkan.$t$, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$FAS-02$t$, $t$aula-gedung-baru-lt-4$t$, $t$Aula Gedung Baru Lt. 4$t$, null, (select id from kategori_aset where nama = $t$Aula$t$), 'ruangan', $t$Gedung Kuliah & Lab Lt. 4$t$, null, 300, null, null, 0, null, 'baik', null, $t$Aula lantai 4 gedung baru dengan tata ruang modern dan pemandangan kampus.$t$, $t$Aula di lantai 4 Gedung Kuliah dan Laboratorium FMIPA dengan kursi auditorium bertingkat, panggung, dan sistem audio visual terpadu.$t$, $t$AC sentral, kursi auditorium, panggung, sistem audio visual, lift$t$, $t$Rincian kegiatan wajib dilampirkan.$t$, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$LAB-02$t$, $t$laboratorium-fisika$t$, $t$Laboratorium Fisika$t$, $t$Laboratorium Fisika (D9)$t$, (select id from kategori_aset where nama = $t$Laboratorium$t$), 'ruangan', $t$Gedung D9 FMIPA UNNES$t$, null, 30, null, null, 0, null, 'baik', $t$Baik & Terkalibrasi$t$, $t$Fasilitas laboratorium praktikum dan penelitian fisika FMIPA UNNES$t$, $t$Laboratorium Fisika D9 FMIPA UNNES dirancang untuk menunjang praktikum fisika dasar, fisika optik, mekanika, dan riset sains mahasiswa maupun dosen, dilengkapi meja optik getaran-rendah, sumber daya teregulasi, dan perlengkapan pengukuran presisi.$t$, $t$AC 2 unit, Meja Optik Newport, Osiloskop Digital, Proyektor & Whiteboard, Wastafel Laboratorium$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$LAB-03$t$, $t$laboratorium-kimia$t$, $t$Laboratorium Kimia$t$, $t$Laboratorium Kimia (D8)$t$, (select id from kategori_aset where nama = $t$Laboratorium$t$), 'ruangan', $t$Gedung D8 FMIPA UNNES$t$, null, 30, null, null, 0, null, 'pemeliharaan', null, $t$Laboratorium praktikum kimia dasar dan analitik.$t$, $t$Laboratorium Kimia D8 untuk praktikum kimia dasar, kimia analitik, dan penelitian mahasiswa. Saat ini sedang dalam pemeliharaan.$t$, $t$Lemari asam, wastafel laboratorium, neraca analitik, peralatan gelas$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], false),
($t$RPT-01$t$, $t$ruang-rapat-lt-2-dekanat$t$, $t$Ruang Rapat Lt. 2 Dekanat FMIPA$t$, $t$Ruang Rapat Lt. 2 Dekanat FMIPA UNNES$t$, (select id from kategori_aset where nama = $t$Ruang Rapat$t$), 'ruangan', $t$Gedung Dekanat Lt. 2$t$, null, 20, null, null, 0, null, 'baik', null, $t$Ruang rapat pimpinan dengan meja konferensi dan layar presentasi.$t$, $t$Ruang rapat di lantai 2 Dekanat FMIPA untuk rapat koordinasi, rapat program studi, dan pertemuan terbatas.$t$, $t$AC, meja konferensi, layar presentasi, papan tulis, akses Wi-Fi$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$ALT-02$t$, $t$sound-system$t$, $t$Sound System$t$, null, (select id from kategori_aset where nama = $t$Audio Visual$t$), 'peralatan', $t$Subbag Umum & Perlengkapan$t$, $t$Subbag Umum & Perlengkapan$t$, null, null, 3, 0, null, 'baik', null, $t$Sound system portabel lengkap dengan speaker aktif dan mixer.$t$, $t$Paket sound system portabel untuk kegiatan indoor maupun outdoor, mencakup speaker aktif, mixer, kabel, dan stand.$t$, $t$2 speaker aktif, mixer 8 channel, kabel dan stand$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$ALT-03$t$, $t$mikrofon-wireless$t$, $t$Mikrofon Wireless$t$, null, (select id from kategori_aset where nama = $t$Audio Visual$t$), 'peralatan', $t$Pengelola Perlengkapan$t$, $t$Pengelola Perlengkapan$t$, null, null, 8, 1, null, 'rusak_ringan', $t$1 unit rusak ringan, 6 baik$t$, $t$Mikrofon nirkabel genggam untuk seminar dan acara.$t$, $t$Mikrofon nirkabel genggam dengan receiver, cocok untuk seminar, rapat besar, dan kegiatan kemahasiswaan.$t$, $t$Receiver, baterai cadangan, tas pelindung$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$ALT-04$t$, $t$kamera-mirrorless$t$, $t$Kamera Mirrorless$t$, null, (select id from kategori_aset where nama = $t$Audio Visual$t$), 'peralatan', $t$Lab Multimedia FMIPA$t$, $t$Lab Multimedia FMIPA$t$, null, null, 2, 0, null, 'baik', null, $t$Kamera mirrorless untuk dokumentasi kegiatan dan konten.$t$, $t$Kamera mirrorless dengan lensa kit dan kartu memori untuk dokumentasi kegiatan akademik dan kemahasiswaan.$t$, $t$Lensa kit, baterai ekstra, kartu memori, tas kamera$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$ALT-05$t$, $t$kursi-lipat-kuliah$t$, $t$Kursi Lipat Kuliah / Acara$t$, null, (select id from kategori_aset where nama = $t$Perlengkapan Acara$t$), 'peralatan', $t$Gudang Perlengkapan FMIPA$t$, $t$Gudang Perlengkapan FMIPA$t$, null, null, 150, 0, null, 'baik', null, $t$Kursi lipat untuk kegiatan di dalam maupun luar ruangan.$t$, $t$Kursi lipat dengan sandaran dan meja tulis untuk perkuliahan, ujian, seminar, dan acara kemahasiswaan.$t$, $t$Kursi lipat dengan sandaran, mudah ditumpuk$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$LAB-01$t$, $t$laboratorium-matematika$t$, $t$Laboratorium Matematika$t$, $t$Laboratorium Matematika (D10)$t$, (select id from kategori_aset where nama = $t$Laboratorium$t$), 'ruangan', $t$Gedung D10 FMIPA UNNES$t$, null, 30, null, null, 0, null, 'baik', null, $t$Laboratorium komputasi dan pemodelan matematika.$t$, $t$Laboratorium Matematika D10 untuk praktikum komputasi, pemodelan, dan statistika dengan komputer terhubung jaringan.$t$, $t$Komputer praktikum, proyektor, whiteboard, AC$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$LAB-04$t$, $t$laboratorium-biologi$t$, $t$Laboratorium Biologi$t$, $t$Laboratorium Biologi (D11)$t$, (select id from kategori_aset where nama = $t$Laboratorium$t$), 'ruangan', $t$Gedung D11 FMIPA UNNES$t$, null, 30, null, null, 0, null, 'baik', null, $t$Laboratorium praktikum biologi, mikrobiologi, dan botani.$t$, $t$Laboratorium Biologi D11 untuk praktikum biologi sel, mikrobiologi, dan botani lengkap dengan mikroskop dan perlengkapan preparasi.$t$, $t$Mikroskop binokuler, autoklaf, wastafel, lemari penyimpanan$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$LAB-05$t$, $t$laboratorium-ipa-terpadu$t$, $t$Laboratorium IPA Terpadu$t$, $t$Laboratorium IPA Terpadu (D1 Lt. 1)$t$, (select id from kategori_aset where nama = $t$Laboratorium$t$), 'ruangan', $t$Gedung D1 Lt. 1$t$, null, 40, null, null, 0, null, 'baik', null, $t$Laboratorium terpadu untuk praktikum lintas bidang IPA.$t$, $t$Laboratorium IPA Terpadu di D1 lantai 1 untuk praktikum lintas bidang fisika, kimia, dan biologi dengan kapasitas lebih besar.$t$, $t$Meja praktikum modular, proyektor, wastafel, AC$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$LAB-06$t$, $t$laboratorium-ilmu-komputer$t$, $t$Laboratorium Ilmu Komputer$t$, $t$Laboratorium Ilmu Komputer$t$, (select id from kategori_aset where nama = $t$Laboratorium$t$), 'ruangan', $t$D1 Lt. 3 dan D2 Lt. 2$t$, null, 40, $t$PC$t$, null, 0, null, 'baik', null, $t$Laboratorium komputer dengan 40 PC untuk praktikum dan pelatihan.$t$, $t$Laboratorium Ilmu Komputer dengan 40 PC terhubung jaringan untuk praktikum pemrograman, basis data, dan pelatihan.$t$, $t$40 PC, proyektor, jaringan LAN dan Wi-Fi, AC$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$RPT-02$t$, $t$ruang-rapat-gedung-baru-8-lantai$t$, $t$Ruang Rapat Gedung Baru 8 Lantai$t$, $t$Ruang Rapat Gedung Baru 8 Lantai FMIPA UNNES$t$, (select id from kategori_aset where nama = $t$Ruang Rapat$t$), 'ruangan', $t$Gedung Baru 8 Lantai$t$, null, 25, null, null, 0, null, 'baik', null, $t$Ruang rapat modern di gedung baru FMIPA.$t$, $t$Ruang rapat di Gedung Baru 8 Lantai dengan layar presentasi dan fasilitas konferensi untuk rapat tim dan pertemuan mitra.$t$, $t$AC, layar presentasi, meja konferensi, Wi-Fi$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$RPT-03$t$, $t$ruang-rapat-besar-gedung-ukm$t$, $t$Ruang Rapat Besar (Gedung UKM)$t$, null, (select id from kategori_aset where nama = $t$Ruang Rapat$t$), 'ruangan', $t$Gedung UKM$t$, null, 50, null, null, 0, null, 'baik', null, $t$Ruang rapat besar untuk organisasi dan unit kegiatan mahasiswa.$t$, $t$Ruang rapat besar di Gedung UKM untuk rapat organisasi, pelatihan, dan lokakarya berkapasitas menengah.$t$, $t$AC, proyektor, whiteboard, akses Wi-Fi$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$ALT-01$t$, $t$proyektor-dan-layar-proyektor$t$, $t$Proyektor dan Layar Proyektor$t$, null, (select id from kategori_aset where nama = $t$Audio Visual$t$), 'peralatan', $t$Dikelola Petugas FMIPA$t$, $t$Dikelola Petugas FMIPA$t$, null, null, 5, 0, $t$set$t$, 'baik', null, $t$Satu set proyektor LCD dan layar proyektor.$t$, $t$Satu set proyektor LCD beserta layar proyektor, kabel HDMI, dan kabel daya untuk presentasi dan kegiatan.$t$, $t$Proyektor LCD, layar, kabel HDMI, kabel daya$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true),
($t$ALT-06$t$, $t$toa$t$, $t$TOA$t$, null, (select id from kategori_aset where nama = $t$Audio Visual$t$), 'peralatan', $t$Gudang Perlengkapan FMIPA$t$, $t$Gudang Perlengkapan FMIPA$t$, null, null, 4, 0, null, 'baik', null, $t$Pengeras suara portabel untuk kegiatan lapangan.$t$, $t$Pengeras suara portabel (TOA) dengan baterai untuk kegiatan lapangan, apel, dan acara luar ruangan.$t$, $t$Baterai isi ulang, mikrofon genggam$t$, null, array[$t$Pengajuan paling lambat H-2 sebelum hari pemakaian.$t$, $t$Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).$t$, $t$Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.$t$, $t$Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.$t$, $t$Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.$t$], true);

insert into tarif_aset (aset_id, satuan, nominal) values
((select id from aset where slug = $t$aula-d12$t$), 'hari', 1500000),
((select id from aset where slug = $t$aula-gedung-baru-lt-4$t$), 'hari', 2500000),
((select id from aset where slug = $t$laboratorium-fisika$t$), 'jam', 125000),
((select id from aset where slug = $t$laboratorium-kimia$t$), 'jam', 150000),
((select id from aset where slug = $t$ruang-rapat-lt-2-dekanat$t$), 'jam', 75000),
((select id from aset where slug = $t$sound-system$t$), 'hari', 500000),
((select id from aset where slug = $t$mikrofon-wireless$t$), 'hari', 40000),
((select id from aset where slug = $t$kamera-mirrorless$t$), 'hari', 250000),
((select id from aset where slug = $t$kursi-lipat-kuliah$t$), 'unit', 2000),
((select id from aset where slug = $t$laboratorium-matematika$t$), 'jam', 100000),
((select id from aset where slug = $t$laboratorium-biologi$t$), 'jam', 125000),
((select id from aset where slug = $t$laboratorium-ipa-terpadu$t$), 'jam', 150000),
((select id from aset where slug = $t$laboratorium-ilmu-komputer$t$), 'jam', 200000),
((select id from aset where slug = $t$ruang-rapat-gedung-baru-8-lantai$t$), 'jam', 100000),
((select id from aset where slug = $t$ruang-rapat-besar-gedung-ukm$t$), 'jam', 150000),
((select id from aset where slug = $t$proyektor-dan-layar-proyektor$t$), 'hari', 100000),
((select id from aset where slug = $t$toa$t$), 'hari', 75000);

-- ---------- TRANSAKSI (12) ----------
create function pg_temp.tgl(n int) returns date language sql as $$
  select case when extract(dow from current_date + n) = 0 then current_date + n + 1 else current_date + n end
$$;

insert into penyewaan (nomor, penyewa_id, aset_id, jumlah, satuan, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai,
                       tujuan, status, catatan_admin, disetujui_pada, dibuat)
select v.nomor, p.id, a.id, v.jumlah, v.satuan::satuan_sewa, v.tm, v.ts, v.jm, v.js, v.tujuan, v.status::status_penyewaan,
       case when v.status in ('disetujui','sedang_disewa','dikembalikan','selesai') then 'Dokumen lengkap, pengajuan disetujui.' end,
       case when v.status in ('disetujui','sedang_disewa','dikembalikan','selesai') then v.dibuat + interval '1 hour' end,
       v.dibuat
from (values
  ('SPT-0001','mahasiswa@students.unnes.ac.id','laboratorium-ilmu-komputer','jam',     1, pg_temp.tgl(-17), pg_temp.tgl(-17), time '13:00', time '16:00', 'Pelatihan pemrograman web untuk mahasiswa.', 'selesai',       now() - interval '19 days'),
  ('SPT-0002','mahasiswa@students.unnes.ac.id','mikrofon-wireless',            'hari',    2, pg_temp.tgl(-9),  pg_temp.tgl(-9),  null, null, 'Kegiatan bedah buku.', 'selesai',       now() - interval '14 days'),
  ('SPT-0003','mahasiswa@students.unnes.ac.id','proyektor-dan-layar-proyektor','hari',    2, pg_temp.tgl(0),   pg_temp.tgl(0),   null, null, 'Presentasi tugas akhir kelompok.', 'sedang_disewa', now() - interval '4 days'),
  ('SPT-0004','mahasiswa@students.unnes.ac.id','laboratorium-fisika',          'jam',     1, pg_temp.tgl(6),   pg_temp.tgl(6),   time '08:00', time '11:00', 'Praktikum tambahan mata kuliah Fisika Dasar bagi kelompok studi mahasiswa semester ganjil.', 'disetujui', now() - interval '1 day'),
  ('SPT-0005','sinta@students.unnes.ac.id',    'ruang-rapat-besar-gedung-ukm', 'jam',     1, pg_temp.tgl(4),   pg_temp.tgl(4),   time '13:00', time '15:00', 'Rapat koordinasi panitia kegiatan himpunan.', 'disetujui', now() - interval '1 day'),
  ('SPT-0006','mahasiswa@students.unnes.ac.id','kamera-mirrorless',            'hari',    1, pg_temp.tgl(12),  pg_temp.tgl(12),  null, null, 'Dokumentasi kegiatan seminar himpunan.', 'diajukan', now() - interval '3 hours'),
  ('SPT-0007','dewi.lestari@mail.unnes.ac.id', 'aula-d12',                     'hari',    1, pg_temp.tgl(20),  case when extract(dow from pg_temp.tgl(20) + 1) = 0 then pg_temp.tgl(20) else pg_temp.tgl(20) + 1 end, null, null, 'Seminar nasional pendidikan sains dan diseminasi hasil penelitian dosen muda se-Jawa Tengah.', 'diajukan', now() - interval '5 hours'),
  ('SPT-0008','budi.hartono@mail.unnes.ac.id', 'sound-system',                 'hari',    1, pg_temp.tgl(8),   pg_temp.tgl(8),   null, null, 'Kegiatan apel dan pembinaan tenaga kependidikan.', 'diajukan', now() - interval '2 hours'),
  ('SPT-0009','andi.prakoso@mail.unnes.ac.id', 'laboratorium-biologi',        'jam',     1, pg_temp.tgl(-3),  pg_temp.tgl(-3),  time '08:00', time '10:00', 'Praktikum mikrobiologi kelas khusus.', 'dikembalikan', now() - interval '6 days'),
  ('SPT-0010','sinta@students.unnes.ac.id',    'toa',                          'hari',    1, pg_temp.tgl(-14), pg_temp.tgl(-14), null, null, 'Apel pembukaan kegiatan orientasi himpunan.', 'selesai', now() - interval '20 days'),
  ('SPT-0011','dewi.lestari@mail.unnes.ac.id', 'laboratorium-matematika',      'jam',     1, pg_temp.tgl(-11), pg_temp.tgl(-11), time '08:00', time '11:00', 'Pelatihan perangkat lunak statistika untuk dosen.', 'selesai', now() - interval '16 days'),
  ('SPT-0012','budi.hartono@mail.unnes.ac.id', 'kursi-lipat-kuliah',           'unit',  100, pg_temp.tgl(-7),  pg_temp.tgl(-7),  null, null, 'Pelaksanaan wisuda program studi.', 'selesai', now() - interval '12 days')
) as v(nomor, email, slug, satuan, jumlah, tm, ts, jm, js, tujuan, status, dibuat)
join profil_pengguna p on p.email = v.email
join aset a on a.slug = v.slug;

select setval('seq_nomor_penyewaan', 12);
update penyewaan set disetujui_pada = now() - interval '1 hour 48 minutes' where nomor = 'SPT-0004';

-- ---------- DOKUMEN PENDUKUNG (metadata contoh) ----------
insert into dokumen_penyewaan (penyewaan_id, jenis, nama_berkas, ukuran_byte, object_key)
select p.id, d.jenis, d.nama || '_' || p.nomor || d.ekstensi, d.ukuran, 'seed/' || p.id || '/' || d.nama || d.ekstensi
from penyewaan p
cross join (values
  ('Surat Permohonan / Perizinan', 'Surat_Permohonan', '.pdf', 1258291),
  ('Identitas / Kartu Tanda Mahasiswa (KTM)', 'KTM', '.jpg', 870400)
) d(jenis, nama, ekstensi, ukuran);
insert into dokumen_penyewaan (penyewaan_id, jenis, nama_berkas, ukuran_byte, object_key)
select p.id, 'Rincian Kegiatan', 'Rincian_Kegiatan_SPT-0007.pdf', 2202009, 'seed/' || p.id || '/Rincian_Kegiatan.pdf'
from penyewaan p where p.nomor = 'SPT-0007';

-- ---------- PEMBAYARAN (dibuat saat disetujui) ----------
insert into pembayaran (penyewaan_id, nominal, status, batas_bayar, penyimpanan, object_key, nama_berkas, dikirim_pada,
                        diverifikasi_oleh, diverifikasi_pada)
select p.id, p.total_biaya,
       case p.nomor when 'SPT-0004' then 'belum_dibayar' when 'SPT-0005' then 'menunggu_verifikasi' else 'lunas' end::status_pembayaran,
       case p.nomor when 'SPT-0004' then now() + interval '22 hours 12 minutes' else p.disetujui_pada + interval '24 hours' end,
       case when p.nomor <> 'SPT-0004' then 'supabase' end,
       case when p.nomor <> 'SPT-0004' then 'seed/' || p.id || '/bukti_bayar.jpg' end,
       case when p.nomor <> 'SPT-0004' then 'Bukti_Bayar_' || p.nomor || '.jpg' end,
       case when p.nomor <> 'SPT-0004' then p.disetujui_pada + interval '3 hours' end,
       case when p.nomor not in ('SPT-0004', 'SPT-0005') then (select id from profil_pengguna where email = 'admin@mail.unnes.ac.id') end,
       case when p.nomor not in ('SPT-0004', 'SPT-0005') then p.disetujui_pada + interval '5 hours' end
from penyewaan p where p.status in ('disetujui', 'sedang_disewa', 'dikembalikan', 'selesai');

-- ---------- SERAH TERIMA & PENGEMBALIAN ----------
insert into serah_terima (penyewaan_id, petugas_id, waktu, jumlah, kondisi, catatan)
select p.id, (select id from profil_pengguna where email = 'petugas@mail.unnes.ac.id'),
       (p.tanggal_mulai + coalesce(p.jam_mulai, time '08:00')) at time zone 'Asia/Jakarta', p.jumlah, 'baik', 'Aset diserahkan dalam kondisi baik.'
from penyewaan p where p.status in ('sedang_disewa', 'dikembalikan', 'selesai');

insert into pengembalian (penyewaan_id, petugas_id, waktu_aktual, jumlah_kembali, kondisi, catatan)
select p.id, (select id from profil_pengguna where email = 'petugas@mail.unnes.ac.id'),
       (p.tanggal_selesai + coalesce(p.jam_selesai, time '17:00') + case p.nomor when 'SPT-0009' then interval '1 hour' else interval '0' end) at time zone 'Asia/Jakarta',
       p.jumlah, 'baik',
       case p.nomor when 'SPT-0009' then 'Dikembalikan terlambat 1 jam.' else 'Dikembalikan dalam kondisi baik.' end
from penyewaan p where p.status in ('dikembalikan', 'selesai');

-- ---------- DENDA ----------
-- SPT-0009: terlambat 1 jam x 10% x Rp125.000 = Rp12.500 (belum dibayar)
insert into denda (penyewaan_id, jenis, nominal, status, dikonfirmasi, catatan)
select id, 'terlambat', hitung_denda_terlambat(id, (tanggal_selesai + jam_selesai + interval '1 hour') at time zone 'Asia/Jakarta'),
       'belum_dibayar', true, 'Dihitung otomatis menurut aturan keterlambatan.'
from penyewaan where nomor = 'SPT-0009';

commit;
