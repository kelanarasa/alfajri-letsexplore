/* soal/soal.js — mendaftarkan pelajaran dan memeriksa format soal. Biasanya tidak perlu diubah. */
(function () {
  'use strict';
  const LEVELS = ['mudah', 'sedang', 'sulit'];
  const list = [];

  function valid(s) {
    return !!s && LEVELS.indexOf(s.l) !== -1 && typeof s.q === 'string' && s.q.trim() !== '' &&
      Array.isArray(s.o) && s.o.length === 4 &&
      s.o.every(function (t) { return typeof t === 'string' && t.trim() !== ''; }) &&
      new Set(s.o.map(function (t) { return t.trim(); })).size === 4;   // 4 pilihan, tidak kosong, tidak kembar
  }

  window.Soal = {
    list: list,
    // Soal.q(tingkat, pertanyaan, JAWABAN BENAR, salah 1, salah 2, salah 3)
    q: function (l, q, a, b, c, d) { return { l: l, q: q, o: [a, b, c, d] }; },
    daftar: function (m) {
      const id = String((m && m.id) || '').trim();
      if (!id) { console.warn('[Soal] Ada pelajaran tanpa id, dilewati.'); return; }
      if (list.some(function (x) { return x.id === id; })) { console.warn('[Soal] id "' + id + '" kembar, dilewati.'); return; }
      const ok = [];
      const bad = [];
      (m.soal || []).forEach(function (s, i) { if (valid(s)) ok.push(s); else bad.push(i + 1); });
      if (!ok.length) { console.warn('[Soal] "' + id + '" tidak punya soal yang valid, dilewati.'); return; }
      const count = { mudah: 0, sedang: 0, sulit: 0 };
      ok.forEach(function (s) { count[s.l]++; });
      const warn = [];
      if (bad.length) {
        warn.push(bad.length + ' soal dilewati karena formatnya salah');
        console.warn('[Soal] ' + id + ': soal urutan ke-' + bad.join(', ') + ' formatnya salah (tingkat harus mudah/sedang/sulit, 4 pilihan berbeda).');
      }
      LEVELS.forEach(function (l) { if (!count[l]) warn.push('belum ada soal ' + l); });
      list.push({
        id: id, nama: String(m.nama || id), ikon: m.ikon || '📚', deskripsi: m.deskripsi || '',
        fakta: Array.isArray(m.fakta) ? m.fakta.filter(function (f) { return typeof f === 'string' && f.trim(); }) : [],
        soal: ok, count: count, warn: warn
      });
    }
  };
})();
