/* soal/mtk-kelas4.js — bank soal Matematika Kelas 4 SD: Pecahan. */
Soal.daftar({
  id: 'mtkkelas4',
  nama: 'Pecahan MTK Kelas IV',
  ikon: '4️⃣',
  deskripsi: 'Matematika Kelas IV SD: Pecahan',
  fakta: [
    'Pecahan senilai dapat dibuat dengan mengalikan atau membagi pembilang dan penyebut dengan bilangan yang sama.',
    'Pada pecahan, bilangan di atas garis disebut pembilang dan bilangan di bawah garis disebut penyebut.',
    'Pecahan yang penyebutnya sama dapat dibandingkan dengan melihat pembilangnya.',
    'Untuk menjumlahkan pecahan, penyebutnya harus sama terlebih dahulu.',
    'Pecahan paling sederhana adalah pecahan yang pembilang dan penyebutnya tidak bisa dibagi lagi dengan bilangan yang sama.'
  ],
  soal: [
    /* ========== MUDAH: PECAHAN SENILAI ========== */

Soal.q('mudah', 'Pecahan yang senilai dengan 1/2 adalah ...',
  '2/4', '1/4', '2/3', '3/5'),

Soal.q('mudah', 'Pecahan yang senilai dengan 1/3 adalah ...',
  '2/6', '1/6', '2/3', '3/6'),

Soal.q('mudah', 'Pecahan yang senilai dengan 2/4 adalah ...',
  '1/2', '1/4', '3/4', '2/3'),

Soal.q('mudah', 'Pecahan yang senilai dengan 1/4 adalah ...',
  '2/8', '1/8', '2/4', '3/8'),

Soal.q('mudah', 'Pecahan yang senilai dengan 3/6 adalah ...',
  '1/2', '1/3', '2/3', '3/4'),

Soal.q('mudah', 'Pecahan yang senilai dengan 2/3 adalah ...',
  '4/6', '2/6', '3/6', '2/9'),

Soal.q('mudah', 'Pecahan yang senilai dengan 1/5 adalah ...',
  '2/10', '1/10', '2/5', '5/10'),

Soal.q('mudah', 'Pecahan yang senilai dengan 4/8 adalah ...',
  '1/2', '1/4', '2/3', '3/4'),

    /* ========== MUDAH: PECAHAN SEDERHANA ========== */

Soal.q('mudah', 'Bentuk paling sederhana dari 2/4 adalah ...',
  '1/2', '1/4', '2/3', '3/4'),

Soal.q('mudah', 'Bentuk paling sederhana dari 3/6 adalah ...',
  '1/2', '1/3', '2/3', '3/4'),

Soal.q('mudah', 'Bentuk paling sederhana dari 2/8 adalah ...',
  '1/4', '1/2', '1/8', '2/4'),

Soal.q('mudah', 'Bentuk paling sederhana dari 4/6 adalah ...',
  '2/3', '1/3', '4/3', '1/2'),

Soal.q('mudah', 'Bentuk paling sederhana dari 5/10 adalah ...',
  '1/2', '1/5', '5/5', '2/5'),

Soal.q('mudah', 'Bentuk paling sederhana dari 3/9 adalah ...',
  '1/3', '1/9', '3/3', '1/2'),

Soal.q('mudah', 'Bentuk paling sederhana dari 6/8 adalah ...',
  '3/4', '1/4', '2/3', '6/4'),

    /* ========== MUDAH: MEMBANDINGKAN PECAHAN ========== */

Soal.q('mudah', 'Tanda yang tepat untuk 3/5 ... 2/5 adalah ...',
  '>', '<', '=', 'Tidak dapat dibandingkan'),

Soal.q('mudah', 'Tanda yang tepat untuk 1/4 ... 3/4 adalah ...',
  '<', '>', '=', 'Tidak dapat dibandingkan'),

Soal.q('mudah', 'Pecahan terbesar dari 1/8, 3/8, 5/8, dan 2/8 adalah ...',
  '5/8', '1/8', '3/8', '2/8'),

Soal.q('mudah', 'Pecahan terkecil dari 2/6, 5/6, 4/6, dan 3/6 adalah ...',
  '2/6', '5/6', '4/6', '3/6'),

Soal.q('mudah', 'Tanda yang tepat untuk 1/2 ... 1/2 adalah ...',
  '=', '<', '>', 'Tidak dapat dibandingkan'),

Soal.q('mudah', 'Manakah yang lebih besar, 1/2 atau 1/4?',
  '1/2', '1/4', 'Sama besar', 'Tidak dapat dibandingkan'),

Soal.q('mudah', 'Urutan pecahan 4/5, 1/5, dan 2/5 dari yang terkecil adalah ...',
  '1/5, 2/5, 4/5', '4/5, 2/5, 1/5', '2/5, 1/5, 4/5', '1/5, 4/5, 2/5'),

Soal.q('mudah', 'Tanda yang tepat untuk 7/9 ... 4/9 adalah ...',
  '>', '<', '=', 'Tidak dapat dibandingkan'),

    /* ========== MUDAH: PENJUMLAHAN & PENGURANGAN ========== */

Soal.q('mudah', 'Hasil dari 1/5 + 2/5 adalah ...',
  '3/5', '3/10', '2/10', '1/5'),

Soal.q('mudah', 'Hasil dari 3/4 - 1/4 adalah ...',
  '2/4', '4/4', '2/8', '1/4'),

Soal.q('mudah', 'Hasil dari 2/7 + 3/7 adalah ...',
  '5/7', '5/14', '6/7', '1/7'),

Soal.q('mudah', 'Hasil dari 5/6 - 2/6 adalah ...',
  '3/6', '7/6', '3/12', '2/6'),

Soal.q('mudah', 'Hasil dari 1/8 + 4/8 adalah ...',
  '5/8', '5/16', '4/8', '3/8'),

Soal.q('mudah', 'Hasil dari 6/9 - 4/9 adalah ...',
  '2/9', '10/9', '2/18', '4/9'),

Soal.q('mudah', 'Ibu mempunyai 2/5 kg gula, lalu membeli 1/5 kg lagi. Berapa kg gula ibu sekarang?',
  '3/5 kg', '3/10 kg', '1/5 kg', '2/10 kg'),

    /* ========== SEDANG: PECAHAN SENILAI ========== */

Soal.q('sedang', 'Nilai yang tepat untuk melengkapi 2/3 = ?/12 adalah ...',
  '8', '6', '9', '4'),

Soal.q('sedang', 'Nilai yang tepat untuk melengkapi 3/5 = 6/? adalah ...',
  '10', '8', '12', '15'),

Soal.q('sedang', 'Pecahan yang senilai dengan 3/4 adalah ...',
  '6/8', '6/12', '3/8', '4/6'),

    /* ========== SEDANG: PECAHAN SEDERHANA ========== */

Soal.q('sedang', 'Bentuk paling sederhana dari 12/16 adalah ...',
  '3/4', '6/8', '4/5', '2/3'),

Soal.q('sedang', 'Bentuk paling sederhana dari 10/15 adalah ...',
  '2/3', '1/3', '1/2', '5/6'),

Soal.q('sedang', 'Bentuk paling sederhana dari 8/12 adalah ...',
  '2/3', '4/6', '1/3', '3/4'),

    /* ========== SEDANG: MEMBANDINGKAN PECAHAN ========== */

Soal.q('sedang', 'Tanda yang tepat untuk 1/2 ... 2/3 adalah ...',
  '<', '>', '=', 'Tidak dapat dibandingkan'),

Soal.q('sedang', 'Tanda yang tepat untuk 3/4 ... 5/8 adalah ...',
  '>', '<', '=', 'Tidak dapat dibandingkan'),

Soal.q('sedang', 'Pecahan terbesar dari 1/2, 1/3, 1/4, dan 1/6 adalah ...',
  '1/2', '1/3', '1/4', '1/6'),

Soal.q('sedang', 'Urutan pecahan 3/4, 1/4, dan 1/2 dari yang terkecil adalah ...',
  '1/4, 1/2, 3/4', '3/4, 1/2, 1/4', '1/2, 1/4, 3/4', '1/4, 3/4, 1/2'),

    /* ========== SEDANG: PENJUMLAHAN & PENGURANGAN ========== */

Soal.q('sedang', 'Hasil dari 1/2 + 1/4 adalah ...',
  '3/4', '2/6', '2/4', '1/6'),

Soal.q('sedang', 'Hasil dari 3/4 - 1/2 adalah ...',
  '1/4', '2/2', '2/4', '1/2'),

Soal.q('sedang', 'Hasil dari 2/3 + 1/6 adalah ...',
  '5/6', '3/9', '3/6', '1/3'),

Soal.q('sedang', 'Hasil dari 5/6 - 1/3 adalah ...',
  '3/6', '4/3', '4/6', '1/3'),

Soal.q('sedang', 'Hasil dari 3/5 + 2/5 adalah ...',
  '5/5', '5/10', '1/5', '6/5'),

    /* ========== SULIT ========== */

Soal.q('sulit', 'Pecahan yang senilai dengan 2/5 dan berpenyebut 20 adalah ...',
  '8/20', '4/20', '10/20', '6/20'),

Soal.q('sulit', 'Pecahan yang senilai dengan 3/4 dan berpembilang 15 adalah ...',
  '15/20', '15/16', '15/12', '15/25'),

Soal.q('sulit', 'Pasangan pecahan yang senilai adalah ...',
  '2/5 dan 4/10', '1/3 dan 2/9', '3/4 dan 6/6', '1/2 dan 2/6'),

Soal.q('sulit', 'Bentuk paling sederhana dari 18/24 adalah ...',
  '3/4', '9/12', '6/8', '2/3'),

Soal.q('sulit', 'Bentuk paling sederhana dari 24/36 adalah ...',
  '2/3', '12/18', '4/6', '3/4'),

Soal.q('sulit', 'Dina makan 1/2 bagian kue dan Rafi makan 2/5 bagian kue yang sama besar. Siapa yang makan lebih banyak?',
  'Dina', 'Rafi', 'Sama banyak', 'Tidak dapat dibandingkan'),

Soal.q('sulit', 'Urutan pecahan 1/2, 2/3, dan 3/4 dari yang terbesar adalah ...',
  '3/4, 2/3, 1/2', '1/2, 2/3, 3/4', '2/3, 3/4, 1/2', '3/4, 1/2, 2/3'),

Soal.q('sulit', 'Tanda yang tepat untuk 5/6 ... 7/8 adalah ...',
  '<', '>', '=', 'Tidak dapat dibandingkan'),

Soal.q('sulit', 'Hasil dari 1/3 + 1/4 adalah ...',
  '7/12', '2/7', '2/12', '5/12'),

Soal.q('sulit', 'Hasil dari 3/4 - 1/3 adalah ...',
  '5/12', '2/7', '2/12', '1/12'),

Soal.q('sulit', 'Hasil dari 2/5 + 1/2 adalah ...',
  '9/10', '3/7', '3/10', '7/10'),

Soal.q('sulit', 'Ibu mempunyai pita 3/4 meter. Sebanyak 1/2 meter dipakai untuk membuat hiasan. Sisa pita ibu adalah ...',
  '1/4 meter', '2/6 meter', '1/2 meter', '4/6 meter'),

Soal.q('sulit', 'Ayah membeli 1/2 kg jeruk dan 3/8 kg apel. Berapa kg buah yang dibeli ayah seluruhnya?',
  '7/8 kg', '4/10 kg', '4/8 kg', '1/8 kg'),

Soal.q('sulit', 'Hasil dari 2/3 + 1/6 - 1/2 adalah ...',
  '1/3', '1/2', '2/3', '5/6'),

Soal.q('sulit', 'Pecahan yang nilainya paling besar di antara 3/4, 4/5, 5/6, dan 2/3 adalah ...',
  '5/6', '3/4', '4/5', '2/3'),

    /* ========== TAMBAHAN MUDAH ========== */

Soal.q('mudah', 'Pecahan 3/8 dibaca ...',
  'Tiga per delapan', 'Delapan per tiga', 'Tiga puluh delapan', 'Delapan tiga'),

Soal.q('mudah', 'Pada pecahan 2/5, penyebutnya adalah ...',
  '5', '2', '7', '3'),

Soal.q('mudah', 'Hasil dari 4/9 + 3/9 adalah ...',
  '7/9', '7/18', '1/9', '12/9'),

Soal.q('mudah', 'Hasil dari 7/8 - 3/8 adalah ...',
  '4/8', '10/8', '4/16', '3/8'),

Soal.q('mudah', 'Pecahan yang senilai dengan 1/2 dan berpenyebut 6 adalah ...',
  '3/6', '2/6', '1/6', '4/6'),

Soal.q('mudah', 'Bentuk paling sederhana dari 10/20 adalah ...',
  '1/2', '1/10', '2/5', '1/4'),

Soal.q('mudah', 'Tanda yang tepat untuk 2/6 ... 5/6 adalah ...',
  '<', '>', '=', 'Tidak dapat dibandingkan'),

Soal.q('mudah', 'Pecahan terbesar dari 3/10, 7/10, 1/10, dan 9/10 adalah ...',
  '9/10', '3/10', '7/10', '1/10'),

Soal.q('mudah', 'Hasil dari 5/12 + 4/12 adalah ...',
  '9/12', '9/24', '1/12', '20/12'),

Soal.q('mudah', 'Pecahan yang senilai dengan 1/6 adalah ...',
  '2/12', '1/12', '2/6', '3/12'),

    /* ========== TAMBAHAN SEDANG ========== */

Soal.q('sedang', 'Nilai yang tepat untuk melengkapi 3/4 = ?/8 adalah ...',
  '6', '3', '4', '5'),

Soal.q('sedang', 'Nilai yang tepat untuk melengkapi 4/6 = 2/? adalah ...',
  '3', '2', '4', '6'),

Soal.q('sedang', 'Bentuk paling sederhana dari 14/21 adalah ...',
  '2/3', '1/3', '7/3', '7/10'),

Soal.q('sedang', 'Bentuk paling sederhana dari 9/12 adalah ...',
  '3/4', '1/4', '2/3', '9/4'),

Soal.q('sedang', 'Tanda yang tepat untuk 2/3 ... 3/5 adalah ...',
  '>', '<', '=', 'Tidak dapat dibandingkan'),

Soal.q('sedang', 'Tanda yang tepat untuk 3/8 ... 1/2 adalah ...',
  '<', '>', '=', 'Tidak dapat dibandingkan'),

Soal.q('sedang', 'Urutan pecahan 1/3, 1/6, dan 1/2 dari yang terbesar adalah ...',
  '1/2, 1/3, 1/6', '1/6, 1/3, 1/2', '1/3, 1/2, 1/6', '1/2, 1/6, 1/3'),

Soal.q('sedang', 'Hasil dari 1/4 + 2/8 adalah ...',
  '4/8', '3/12', '3/8', '2/12'),

Soal.q('sedang', 'Hasil dari 7/10 - 2/5 adalah ...',
  '3/10', '5/5', '5/10', '1/5'),

Soal.q('sedang', 'Rina membaca 1/3 bagian buku di pagi hari dan 1/6 bagian di sore hari. Berapa bagian buku yang sudah dibaca Rina?',
  '3/6', '2/9', '2/6', '1/6'),

    /* ========== TAMBAHAN SULIT ========== */

Soal.q('sulit', 'Pecahan yang senilai dengan 4/7 dan berpenyebut 28 adalah ...',
  '16/28', '4/28', '12/28', '21/28'),

Soal.q('sulit', 'Bentuk paling sederhana dari 18/30 adalah ...',
  '3/5', '9/15', '2/3', '6/10'),

Soal.q('sulit', 'Pecahan yang senilai dengan 5/6 dan berpembilang 25 adalah ...',
  '25/30', '25/36', '25/25', '25/35'),

Soal.q('sulit', 'Pasangan pecahan yang senilai adalah ...',
  '3/5 dan 9/15', '2/3 dan 4/9', '1/4 dan 3/8', '5/6 dan 10/18'),

Soal.q('sulit', 'Urutan pecahan 3/5, 1/2, dan 7/10 dari yang terkecil adalah ...',
  '1/2, 3/5, 7/10', '7/10, 3/5, 1/2', '3/5, 1/2, 7/10', '1/2, 7/10, 3/5'),

Soal.q('sulit', 'Tanda yang tepat untuk 4/5 ... 7/9 adalah ...',
  '>', '<', '=', 'Tidak dapat dibandingkan'),

Soal.q('sulit', 'Budi minum 3/4 liter susu dan Ani minum 5/8 liter susu. Siapa yang minum lebih banyak?',
  'Budi', 'Ani', 'Sama banyak', 'Tidak dapat dibandingkan'),

Soal.q('sulit', 'Hasil dari 1/6 + 3/8 adalah ...',
  '13/24', '4/14', '4/48', '9/24'),

Soal.q('sulit', 'Hasil dari 7/8 - 1/4 - 1/8 adalah ...',
  '4/8', '5/8', '3/8', '2/8'),

Soal.q('sulit', 'Pak Tani menanam padi di 2/5 bagian sawah dan jagung di 1/3 bagian sawah. Sisa sawah yang ditanami sayuran adalah ...',
  '4/15', '3/8', '11/15', '3/15')
  ]
});
