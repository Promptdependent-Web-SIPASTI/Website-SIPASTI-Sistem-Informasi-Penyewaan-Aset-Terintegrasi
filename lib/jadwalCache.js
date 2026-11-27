// Salinan jadwal terisi (view `jadwal_terisi`) agar kalender dapat dihitung sinkron.
let baris = [];
export const setJadwal = (data) => { baris = data ?? []; };
export const jadwalAset = (asetId) => baris.filter((r) => r.aset_id === asetId);
export const jadwalHari = (asetId, iso) => baris.filter((r) => r.aset_id === asetId && r.tanggal_mulai <= iso && r.tanggal_selesai >= iso);
