// Data dummy SIPASTI (front end). Seluruh stok, kapasitas, dan tarif adalah data contoh.

export const KATEGORI = {
  ruangan: {
    id: "ruangan",
    nama: "Fasilitas dan Ruangan",
    deskripsi: "Aula, laboratorium, dan ruang rapat untuk kegiatan akademik dan kemahasiswaan.",
  },
  peralatan: {
    id: "peralatan",
    nama: "Peralatan dan Perlengkapan",
    deskripsi: "Proyektor dan layar, sound system, mikrofon, kamera, kursi lipat, dan TOA.",
  },
};

export const SUBKATEGORI = ["Aula", "Laboratorium", "Ruang Rapat", "Audio Visual", "Perlengkapan Acara"];

const SATUAN_LABEL = { jam: "jam", hari: "hari", kegiatan: "kegiatan", unit: "unit" };
export const satuanLabel = (s) => SATUAN_LABEL[s] ?? s;

export const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

const ATURAN_UMUM = [
  "Pengajuan paling lambat H-2 sebelum hari pemakaian.",
  "Penyewaan hanya Senin–Sabtu, sesi 07.00–11.30 dan 12.30–18.00 WIB (11.30–12.30 istirahat).",
  "Lampirkan surat permohonan/perizinan bertanda tangan dekan atau dosen, serta identitas/KTM.",
  "Pembayaran dilakukan setelah pengajuan disetujui admin; unggah bukti bayar pada sistem.",
  "Keterlambatan pengembalian dan kerusakan dapat dikenai denda sesuai ketentuan.",
];

// Urutan array = urutan tampil "Paling Sesuai" (halaman 1 = 9 aset pertama, sesuai desain).
export const ASET = [
  {
    slug: "aula-d12", kode: "FAS-01", nama: "Aula D12", kategori: "ruangan", subkategori: "Aula",
    lokasi: "Gedung D12 FMIPA UNNES", kapasitas: 250, kondisi: "Baik", status: "Tersedia",
    satuan: "hari", tarif: 1500000,
    ringkas: "Aula serbaguna untuk seminar, wisuda prodi, dan kegiatan kemahasiswaan skala besar.",
    deskripsi: "Aula D12 dirancang untuk kegiatan berkapasitas besar dengan tata suara dan pencahayaan panggung, cocok untuk seminar nasional, kuliah umum, dan acara kemahasiswaan.",
    fasilitas: "AC sentral, panggung, tata suara, proyektor dan layar besar, ruang transit",
    dokumenKhusus: "Rincian kegiatan wajib dilampirkan.",
  },
  {
    slug: "aula-gedung-baru-lt-4", kode: "FAS-02", nama: "Aula Gedung Baru Lt. 4", kategori: "ruangan", subkategori: "Aula",
    lokasi: "Gedung Kuliah & Lab Lt. 4", kapasitas: 300, kondisi: "Baik", status: "Tersedia",
    satuan: "hari", tarif: 2500000,
    ringkas: "Aula lantai 4 gedung baru dengan tata ruang modern dan pemandangan kampus.",
    deskripsi: "Aula di lantai 4 Gedung Kuliah dan Laboratorium FMIPA dengan kursi auditorium bertingkat, panggung, dan sistem audio visual terpadu.",
    fasilitas: "AC sentral, kursi auditorium, panggung, sistem audio visual, lift",
    dokumenKhusus: "Rincian kegiatan wajib dilampirkan.",
  },
  {
    slug: "laboratorium-fisika", kode: "LAB-02", nama: "Laboratorium Fisika", nama2: "Laboratorium Fisika (D9)", kategori: "ruangan", subkategori: "Laboratorium",
    lokasi: "Gedung D9 FMIPA UNNES", kapasitas: 30, kondisi: "Baik", kondisiDetail: "Baik & Terkalibrasi", status: "Tersedia",
    satuan: "jam", tarif: 125000,
    ringkas: "Fasilitas laboratorium praktikum dan penelitian fisika FMIPA UNNES",
    deskripsi: "Laboratorium Fisika D9 FMIPA UNNES dirancang untuk menunjang praktikum fisika dasar, fisika optik, mekanika, dan riset sains mahasiswa maupun dosen, dilengkapi meja optik getaran-rendah, sumber daya teregulasi, dan perlengkapan pengukuran presisi.",
    fasilitas: "AC 2 unit, Meja Optik Newport, Osiloskop Digital, Proyektor & Whiteboard, Wastafel Laboratorium",
  },
  {
    slug: "laboratorium-kimia", kode: "LAB-03", nama: "Laboratorium Kimia", nama2: "Laboratorium Kimia (D8)", kategori: "ruangan", subkategori: "Laboratorium",
    lokasi: "Gedung D8 FMIPA UNNES", kapasitas: 30, kondisi: "Dalam Pemeliharaan", status: "Tidak tersedia", statusKet: "perawatan",
    satuan: "jam", tarif: 150000,
    ringkas: "Laboratorium praktikum kimia dasar dan analitik.",
    deskripsi: "Laboratorium Kimia D8 untuk praktikum kimia dasar, kimia analitik, dan penelitian mahasiswa. Saat ini sedang dalam pemeliharaan.",
    fasilitas: "Lemari asam, wastafel laboratorium, neraca analitik, peralatan gelas",
  },
  {
    slug: "ruang-rapat-lt-2-dekanat", kode: "RPT-01", nama: "Ruang Rapat Lt. 2 Dekanat FMIPA", nama2: "Ruang Rapat Lt. 2 Dekanat FMIPA UNNES", kategori: "ruangan", subkategori: "Ruang Rapat",
    lokasi: "Gedung Dekanat Lt. 2", kapasitas: 20, kondisi: "Baik", status: "Terisi",
    satuan: "jam", tarif: 75000,
    ringkas: "Ruang rapat pimpinan dengan meja konferensi dan layar presentasi.",
    deskripsi: "Ruang rapat di lantai 2 Dekanat FMIPA untuk rapat koordinasi, rapat program studi, dan pertemuan terbatas.",
    fasilitas: "AC, meja konferensi, layar presentasi, papan tulis, akses Wi-Fi",
  },
  {
    slug: "sound-system", kode: "ALT-02", nama: "Sound System", kategori: "peralatan", subkategori: "Audio Visual",
    lokasi: "Subbag Umum & Perlengkapan", pengelola: "Subbag Umum & Perlengkapan", stok: 3, stokTotal: 3, kondisi: "Baik", status: "Tersedia",
    satuan: "hari", tarif: 500000,
    ringkas: "Sound system portabel lengkap dengan speaker aktif dan mixer.",
    deskripsi: "Paket sound system portabel untuk kegiatan indoor maupun outdoor, mencakup speaker aktif, mixer, kabel, dan stand.",
    fasilitas: "2 speaker aktif, mixer 8 channel, kabel dan stand",
  },
  {
    slug: "mikrofon-wireless", kode: "ALT-03", nama: "Mikrofon Wireless", kategori: "peralatan", subkategori: "Audio Visual",
    lokasi: "Pengelola Perlengkapan", pengelola: "Pengelola Perlengkapan", stok: 7, stokTotal: 8, kondisi: "1 unit rusak ringan, 6 baik", status: "Tersedia",
    satuan: "hari", tarif: 40000,
    ringkas: "Mikrofon nirkabel genggam untuk seminar dan acara.",
    deskripsi: "Mikrofon nirkabel genggam dengan receiver, cocok untuk seminar, rapat besar, dan kegiatan kemahasiswaan.",
    fasilitas: "Receiver, baterai cadangan, tas pelindung",
  },
  {
    slug: "kamera-mirrorless", kode: "ALT-04", nama: "Kamera Mirrorless", kategori: "peralatan", subkategori: "Audio Visual",
    lokasi: "Lab Multimedia FMIPA", pengelola: "Lab Multimedia FMIPA", stok: 2, stokTotal: 2, kondisi: "Baik", status: "Tersedia",
    satuan: "hari", tarif: 250000,
    ringkas: "Kamera mirrorless untuk dokumentasi kegiatan dan konten.",
    deskripsi: "Kamera mirrorless dengan lensa kit dan kartu memori untuk dokumentasi kegiatan akademik dan kemahasiswaan.",
    fasilitas: "Lensa kit, baterai ekstra, kartu memori, tas kamera",
  },
  {
    slug: "kursi-lipat-kuliah", kode: "ALT-05", nama: "Kursi Lipat Kuliah / Acara", kategori: "peralatan", subkategori: "Perlengkapan Acara",
    lokasi: "Gudang Perlengkapan FMIPA", pengelola: "Gudang Perlengkapan FMIPA", stok: 150, stokTotal: 150, kondisi: "Baik", status: "Tersedia",
    satuan: "unit", tarif: 2000,
    ringkas: "Kursi lipat untuk kegiatan di dalam maupun luar ruangan.",
    deskripsi: "Kursi lipat dengan sandaran dan meja tulis untuk perkuliahan, ujian, seminar, dan acara kemahasiswaan.",
    fasilitas: "Kursi lipat dengan sandaran, mudah ditumpuk",
  },
  {
    slug: "laboratorium-matematika", kode: "LAB-01", nama: "Laboratorium Matematika", nama2: "Laboratorium Matematika (D10)", kategori: "ruangan", subkategori: "Laboratorium",
    lokasi: "Gedung D10 FMIPA UNNES", kapasitas: 30, kondisi: "Baik", status: "Tersedia",
    satuan: "jam", tarif: 100000,
    ringkas: "Laboratorium komputasi dan pemodelan matematika.",
    deskripsi: "Laboratorium Matematika D10 untuk praktikum komputasi, pemodelan, dan statistika dengan komputer terhubung jaringan.",
    fasilitas: "Komputer praktikum, proyektor, whiteboard, AC",
  },
  {
    slug: "laboratorium-biologi", kode: "LAB-04", nama: "Laboratorium Biologi", nama2: "Laboratorium Biologi (D11)", kategori: "ruangan", subkategori: "Laboratorium",
    lokasi: "Gedung D11 FMIPA UNNES", kapasitas: 30, kondisi: "Baik", status: "Tersedia",
    satuan: "jam", tarif: 125000,
    ringkas: "Laboratorium praktikum biologi, mikrobiologi, dan botani.",
    deskripsi: "Laboratorium Biologi D11 untuk praktikum biologi sel, mikrobiologi, dan botani lengkap dengan mikroskop dan perlengkapan preparasi.",
    fasilitas: "Mikroskop binokuler, autoklaf, wastafel, lemari penyimpanan",
  },
  {
    slug: "laboratorium-ipa-terpadu", kode: "LAB-05", nama: "Laboratorium IPA Terpadu", nama2: "Laboratorium IPA Terpadu (D1 Lt. 1)", kategori: "ruangan", subkategori: "Laboratorium",
    lokasi: "Gedung D1 Lt. 1", kapasitas: 40, kondisi: "Baik", status: "Tersedia",
    satuan: "jam", tarif: 150000,
    ringkas: "Laboratorium terpadu untuk praktikum lintas bidang IPA.",
    deskripsi: "Laboratorium IPA Terpadu di D1 lantai 1 untuk praktikum lintas bidang fisika, kimia, dan biologi dengan kapasitas lebih besar.",
    fasilitas: "Meja praktikum modular, proyektor, wastafel, AC",
  },
  {
    slug: "laboratorium-ilmu-komputer", kode: "LAB-06", nama: "Laboratorium Ilmu Komputer", nama2: "Laboratorium Ilmu Komputer", kategori: "ruangan", subkategori: "Laboratorium",
    lokasi: "D1 Lt. 3 dan D2 Lt. 2", kapasitas: 40, kapasitasSatuan: "PC", kondisi: "Baik", status: "Tersedia",
    satuan: "jam", tarif: 200000,
    ringkas: "Laboratorium komputer dengan 40 PC untuk praktikum dan pelatihan.",
    deskripsi: "Laboratorium Ilmu Komputer dengan 40 PC terhubung jaringan untuk praktikum pemrograman, basis data, dan pelatihan.",
    fasilitas: "40 PC, proyektor, jaringan LAN dan Wi-Fi, AC",
  },
  {
    slug: "ruang-rapat-gedung-baru-8-lantai", kode: "RPT-02", nama: "Ruang Rapat Gedung Baru 8 Lantai", nama2: "Ruang Rapat Gedung Baru 8 Lantai FMIPA UNNES", kategori: "ruangan", subkategori: "Ruang Rapat",
    lokasi: "Gedung Baru 8 Lantai", kapasitas: 25, kondisi: "Baik", status: "Tersedia",
    satuan: "jam", tarif: 100000,
    ringkas: "Ruang rapat modern di gedung baru FMIPA.",
    deskripsi: "Ruang rapat di Gedung Baru 8 Lantai dengan layar presentasi dan fasilitas konferensi untuk rapat tim dan pertemuan mitra.",
    fasilitas: "AC, layar presentasi, meja konferensi, Wi-Fi",
  },
  {
    slug: "ruang-rapat-besar-gedung-ukm", kode: "RPT-03", nama: "Ruang Rapat Besar (Gedung UKM)", kategori: "ruangan", subkategori: "Ruang Rapat",
    lokasi: "Gedung UKM", kapasitas: 50, kondisi: "Baik", status: "Tersedia",
    satuan: "jam", tarif: 150000,
    ringkas: "Ruang rapat besar untuk organisasi dan unit kegiatan mahasiswa.",
    deskripsi: "Ruang rapat besar di Gedung UKM untuk rapat organisasi, pelatihan, dan lokakarya berkapasitas menengah.",
    fasilitas: "AC, proyektor, whiteboard, akses Wi-Fi",
  },
  {
    slug: "proyektor-dan-layar-proyektor", kode: "ALT-01", nama: "Proyektor dan Layar Proyektor", kategori: "peralatan", subkategori: "Audio Visual",
    lokasi: "Dikelola Petugas FMIPA", pengelola: "Dikelola Petugas FMIPA", stok: 5, stokTotal: 5, stokSatuan: "set", kondisi: "Baik", status: "Tersedia",
    satuan: "hari", tarif: 100000,
    ringkas: "Satu set proyektor LCD dan layar proyektor.",
    deskripsi: "Satu set proyektor LCD beserta layar proyektor, kabel HDMI, dan kabel daya untuk presentasi dan kegiatan.",
    fasilitas: "Proyektor LCD, layar, kabel HDMI, kabel daya",
  },
  {
    slug: "toa", kode: "ALT-06", nama: "TOA", kategori: "peralatan", subkategori: "Audio Visual",
    lokasi: "Gudang Perlengkapan FMIPA", pengelola: "Gudang Perlengkapan FMIPA", stok: 4, stokTotal: 4, kondisi: "Baik", status: "Tersedia",
    satuan: "hari", tarif: 75000,
    ringkas: "Pengeras suara portabel untuk kegiatan lapangan.",
    deskripsi: "Pengeras suara portabel (TOA) dengan baterai untuk kegiatan lapangan, apel, dan acara luar ruangan.",
    fasilitas: "Baterai isi ulang, mikrofon genggam",
  },
].map((a) => ({ ...a, aturan: ATURAN_UMUM, foto: `/images/aset/${a.slug}.jpg` }));

export const getAset = (slug) => ASET.find((a) => a.slug === slug);

export const kapasitasLabel = (a) =>
  a.kategori === "ruangan"
    ? `Kapasitas ${a.kapasitas} ${a.kapasitasSatuan ?? "orang"}`
    : `Tersedia ${a.stok} ${a.stokSatuan ?? "unit"}`;

export const tarifLabel = (a) =>
  a.satuan === "unit" ? `${rupiah(a.tarif)} / unit` : `${rupiah(a.tarif)} / ${satuanLabel(a.satuan)}`;

export const FAQ = [
  {
    q: "Siapa yang boleh menyewa aset FMIPA UNNES?",
    a: "Mahasiswa, dosen, dan staf UNNES yang telah memiliki akun SIPASTI. Penyewa dari pihak luar kampus belum dilayani pada versi ini.",
  },
  {
    q: "Dokumen apa saja yang diperlukan?",
    a: "Surat permohonan atau perizinan yang ditandatangani dekan atau dosen, serta identitas atau KTM. Untuk penyewaan aula, lampirkan juga rincian kegiatan.",
  },
  {
    q: "Berapa batas waktu pembayaran?",
    a: "Pembayaran dilakukan setelah pengajuan disetujui admin, paling lambat 24 jam setelah persetujuan atau H-1 sebelum pemakaian (mana yang lebih awal). Jika terlewat, pengajuan otomatis dibatalkan.",
  },
  {
    q: "Bagaimana aturan pembatalan dan refund?",
    a: "Pembatalan sebelum disetujui tidak dikenai biaya. Setelah disetujui dan dibayar: refund 100% bila dibatalkan H-3 atau lebih awal, 50% pada H-2 sampai H-1, dan 0% bila kurang dari H-1. Jika dibatalkan pihak kampus, refund 100%.",
  },
  {
    q: "Apakah ada denda keterlambatan atau kerusakan?",
    a: "Ya. Sewa per jam dikenai 10% dari tarif per jam untuk setiap jam terlambat; sewa per hari atau per kegiatan dikenai 10% dari tarif sewa untuk setiap hari terlambat (toleransi 30 menit). Kerusakan atau kehilangan ditetapkan petugas dan dikonfirmasi admin.",
  },
];

export const LANGKAH = [
  { judul: "Cari Aset dan Cek Jadwal", isi: "Pilih aset yang dibutuhkan dan pastikan jadwalnya tersedia.", ikon: "Search" },
  { judul: "Ajukan Sewa dan Unggah Dokumen", isi: "Isi formulir dan lampirkan dokumen. Pengajuan paling lambat H-2 sebelum pemakaian.", ikon: "FileUp" },
  { judul: "Tunggu Persetujuan Admin", isi: "Admin memeriksa dokumen dan ketersediaan, lalu menyetujui atau menolak pengajuan.", ikon: "ShieldCheck" },
  { judul: "Bayar dan Unggah Bukti Pembayaran", isi: "Lakukan pembayaran sesuai tagihan, lalu unggah bukti ke sistem.", ikon: "Wallet" },
  { judul: "Gunakan Aset dan Kembalikan", isi: "Gunakan aset sesuai jadwal dan lakukan serah terima pengembalian.", ikon: "PackageCheck" },
];
