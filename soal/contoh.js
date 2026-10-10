/* soal/contoh.js — contoh pelajaran untuk mencoba menu. Hapus file ini dan barisnya di index.html jika tidak dipakai. */
Soal.daftar({
  id: 'contoh',
  nama: 'Contoh Template',
  ikon: '📝',
  deskripsi: 'Hanya contoh format, ganti dengan soal Anda',
  fakta: ['Ini contoh kartu fakta untuk pos bintang.'],
  soal: [
    Soal.q('mudah', 'Ibu kota Indonesia adalah…', 'Jakarta', 'Bandung', 'Surabaya', 'Medan'),
    Soal.q('mudah', 'Hasil dari 2 + 3 adalah…', '5', '4', '6', '7'),
    Soal.q('sedang', 'Benua terluas di dunia adalah…', 'Asia', 'Afrika', 'Eropa', 'Australia'),
    Soal.q('sedang', 'Hasil dari 6 x 7 adalah…', '42', '36', '48', '54'),
    Soal.q('sulit', 'Samudra terluas di dunia adalah…', 'Pasifik', 'Atlantik', 'Hindia', 'Arktik'),
    Soal.q('sulit', 'Jika 3x = 21, maka nilai x adalah…', '7', '6', '8', '9')
  ]
});
