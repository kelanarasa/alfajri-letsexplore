/*
  TEMPLATE PELAJARAN BARU (file ini tidak dimuat game; salin dulu, lihat PANDUAN.txt)
  Salin menjadi soal/namamapel.js, lalu ubah id, nama, ikon, dan isi soal.
*/
Soal.daftar({
  id: 'pkn8',                       // unik, huruf kecil tanpa spasi
  nama: 'PKn Kelas 8',              // tulisan di tombol menu
  ikon: '📘',                       // emoji di tombol menu
  deskripsi: 'Keterangan singkat',  // opsional
  fakta: [                          // opsional: tampil di pos bintang. Boleh dikosongkan: []
    'Contoh fakta menarik.'
  ],
  soal: [
    // Soal.q('tingkat', 'Pertanyaan', 'JAWABAN BENAR', 'salah 1', 'salah 2', 'salah 3'),
    // tingkat: 'mudah', 'sedang', atau 'sulit'. Jawaban benar SELALU ditulis pertama; urutan A-D diacak otomatis.
    Soal.q('mudah', 'Contoh pertanyaan?', 'Jawaban benar', 'Salah satu', 'Salah dua', 'Salah tiga'),
  ]
});
