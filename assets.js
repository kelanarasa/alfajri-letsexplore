/*
  assets.js — satu-satunya tempat nama aset dan path gambar.
  Logika game (game.js) hanya memanggil aset lewat nama, mis. Assets.fill(el, 'tiles', 'event').

  Struktur folder (relatif terhadap index.html):
    assets/characters/  karakter/bidak yang bisa dipilih di menu
    assets/tiles/       ikon tiap jenis pos (dipakai Map 1). Ikon khusus Map 2 / Map 3: tiles/map2/, tiles/map3/
    assets/buildings/   bangunan / properti
    assets/dice/        ikon tombol dadu + muka dadu 1-6 (Dadu 1). Dadu 2 / Dadu 3: dice/d2/, dice/d3/
    assets/effects/     ikon kartu soal (benar, salah, bonus) dan kartu pos event (gempa_kecil, gempa_sedang, megathrust, pencuri, teleportasi, rinnegan, pajak, rezeki, kemacetan)
    assets/ui/          ikon antarmuka
    assets/background/  latar halaman. Latar map: background/stage.jpg + board.jpg (Map 1), background/map2/, background/map3/

  Cara pakai gambar sendiri:
  1) Taruh gambar di folder assets/ sesuai path di bawah (PNG transparan disarankan).
  2) Ubah useImages menjadi true.
  Jika sebuah gambar tidak ditemukan, otomatis kembali ke cadangan:
    - ikon pos Map 2 / Map 3 yang belum ada  -> memakai ikon di tiles/ (Map 1), lalu emoji
    - muka dadu yang belum ada               -> titik-titik CSS dengan warna set dadu itu
    - latar map yang belum ada               -> warna/gradasi bawaan map itu (lihat style.css, [data-map="..."])
  Untuk mengganti nama/path file, cukup ubah nilai img di bawah; game.js tidak perlu disentuh.
  Menambah map / dadu baru: salin satu blok di maps / diceSets, beri kunci baru (mis. map4, d4).
*/
(function () {
  'use strict';

  const A = {
    useImages: true,            // false = emoji placeholder, true = pakai gambar di bawah
    base: 'assets/',

    characters: {                // karakter/bidak pilihan di menu (minimal 4 supaya 4 pemain tidak berebut)
      c1: { emoji: '👮🏻‍♂️', img: 'characters/char1.png', label: 'Andre' },
      c2: { emoji: '👩🏻‍🍳', img: 'characters/char2.png', label: 'Chandra' },
      c3: { emoji: '👨🏾‍🎤', img: 'characters/char3.png', label: 'Ridho' },
      c4: { emoji: '👩‍🎓', img: 'characters/char4.png', label: 'Baskara' },
      c5: { emoji: '👩🏼‍✈️', img: 'characters/char5.png', label: 'Syakira' },
      c6: { emoji: '👨🏻‍🚀', img: 'characters/char6.png', label: 'Keisha' },
      c7: { emoji: '🧛🏼‍♂️', img: 'characters/char7.png', label: 'Irma' },
      c8: { emoji: '👩🏽‍🌾', img: 'characters/char8.png', label: 'Icha' }
    },
    tiles: {                     // ikon setiap jenis pos (bawaan, dipakai Map 1 dan sebagai cadangan map lain)
      start:    { emoji: '🚩', img: 'tiles/start.png' },
      finish:   { emoji: '🏁', img: 'tiles/finish.png' },
      mudah:    { emoji: '🟢', img: 'tiles/mudah.png' },
      sedang:   { emoji: '🟡', img: 'tiles/sedang.png' },
      sulit:    { emoji: '🔴', img: 'tiles/sulit.png' },
      event:    { emoji: '🎴', img: 'tiles/event.png' },     // pos event (3 kartu)
      khusus:   { emoji: '⭐', img: 'tiles/khusus.png' },
      freewill: { emoji: '🎯', img: 'tiles/freewill.png' }
    },
    buildings: {                 // bangunan/properti di papan
      center: { emoji: '🏫', img: 'buildings/school.png' }
    },
    dice: {                      // ikon tombol dadu (muka dadu ada di diceSets di bawah)
      roll:  { emoji: '🎲', img: 'dice/roll.png' }
    },
    effects: {                   // ikon yang tampil di kartu soal, pos khusus, dan kartu pos event
      benar: { emoji: '🎉', img: 'effects/benar.png' },
      salah: { emoji: '😅', img: 'effects/salah.png' },
      bonus: { emoji: '✨', img: 'effects/bonus.png' },                 // dipakai pos khusus
      gempa_kecil:  { emoji: '📳', img: 'effects/gempa_kecil.png' },    // kartu event: nama file = id event di game.js
      gempa_sedang: { emoji: '🏚️', img: 'effects/gempa_sedang.png' },
      megathrust:   { emoji: '🌊', img: 'effects/megathrust.png' },
      pencuri:     { emoji: '🦹', img: 'effects/pencuri.png' },
      teleportasi: { emoji: '🌀', img: 'effects/teleportasi.png' },
      rinnegan:    { emoji: '👁️', img: 'effects/rinnegan.png' },
      pajak:       { emoji: '💸', img: 'effects/pajak.png' },
      rezeki:      { emoji: '🍀', img: 'effects/rezeki.png' },
      kemacetan:   { emoji: '🚦', img: 'effects/kemacetan.png' }
    },
    ui: {                        // ikon antarmuka
      sound_on:  { emoji: '🔊', img: 'ui/sound_on.png' },
      sound_off: { emoji: '🔇', img: 'ui/sound_off.png' }
    },
    background: {                // latar halaman; kosongkan img untuk memakai warna bawaan
      page:  { img: 'background/page.jpg' }     // seluruh halaman
    },

    /* ============ MAP (dipilih di menu halaman 2) ============
       nama   : tulisan di menu
       emoji  : ikon kecil di menu
       bgm    : lagu latar permainan (kunci di BGM pada game.js: game, tropis, senja)
       stage  : gambar di belakang papan            (kosong = gradasi bawaan map di style.css)
       board  : gambar di tengah papan              (kosong = gradasi bawaan map di style.css)
       tiles  : ikon pos khusus map ini (opsional; yang tidak ada memakai tiles/ bawaan di atas) */
    maps: {
      map1: {
        nama: 'Sekolah', emoji: '🏫', bgm: 'game',
        stage: 'background/stage.jpg',
        board: 'background/board.jpg',
        tiles: {}                                           // Map 1 memakai ikon bawaan di tiles/
      },
      map2: {
        nama: 'Pulau Tropis', emoji: '🏝️', bgm: 'tropis',
        stage: 'background/map2/stage.jpg',
        board: 'background/map2/board.jpg',
        tiles: {
          start:    { img: 'tiles/map2/start.png' },
          mudah:    { img: 'tiles/map2/mudah.png' },
          sedang:   { img: 'tiles/map2/sedang.png' },
          sulit:    { img: 'tiles/map2/sulit.png' },
          event:    { img: 'tiles/map2/event.png' },
          khusus:   { img: 'tiles/map2/khusus.png' },
          freewill: { img: 'tiles/map2/freewill.png' }
        }
      },
      map3: {
        nama: 'Kota Senja', emoji: '🌇', bgm: 'senja',
        stage: 'background/map3/stage.jpg',
        board: 'background/map3/board.jpg',
        tiles: {
          start:    { img: 'tiles/map3/start.png' },
          mudah:    { img: 'tiles/map3/mudah.png' },
          sedang:   { img: 'tiles/map3/sedang.png' },
          sulit:    { img: 'tiles/map3/sulit.png' },
          event:    { img: 'tiles/map3/event.png' },
          khusus:   { img: 'tiles/map3/khusus.png' },
          freewill: { img: 'tiles/map3/freewill.png' }
        }
      }
    },

    /* ============ DADU (dipilih di menu halaman 2) ============
       nama  : tulisan di menu
       emoji : ikon kecil
       sfx   : suara dadu dikocok (kunci di DICE_SFX pada game.js: klasik, kayu, neon)
       faces : gambar muka dadu 1..6 (urut). Jika belum ada, dipakai titik-titik CSS
       body, pip, edge, glow, pipGlow : warna dadu CSS cadangan (badan, titik, sisi bawah, cahaya) */
    diceSets: {
      d1: {
        nama: 'Klasik', emoji: '🎲', sfx: 'klasik',
        faces: ['dice/face1.png', 'dice/face2.png', 'dice/face3.png', 'dice/face4.png', 'dice/face5.png', 'dice/face6.png'],
        body: '#ffffff', pip: '#12304a', edge: 'rgba(0, 0, 0, .3)'
      },
      d2: {
        nama: 'Kayu', emoji: '🪵', sfx: 'kayu',
        faces: ['dice/d2/face1.png', 'dice/d2/face2.png', 'dice/d2/face3.png', 'dice/d2/face4.png', 'dice/d2/face5.png', 'dice/d2/face6.png'],
        body: '#e0a864', pip: '#4a2a12', edge: '#8a5a2b'
      },
      d3: {
        nama: 'Neon', emoji: '💠', sfx: 'neon',
        faces: ['dice/d3/face1.png', 'dice/d3/face2.png', 'dice/d3/face3.png', 'dice/d3/face4.png', 'dice/d3/face5.png', 'dice/d3/face6.png'],
        body: '#1b1f4b', pip: '#5ef2ff', edge: '#0b0d2a',
        glow: '0 0 14px rgba(94, 242, 255, .6)', pipGlow: '0 0 6px #5ef2ff'
      }
    }
  };

  // Ikon pos khusus map (A.maps[variant].tiles[key]) jika ada, ditaruh sebelum ikon bawaan
  function variantEntry(group, key, variant) {
    if (group !== 'tiles' || !variant) return null;
    const m = (A.maps || {})[variant];
    return (m && m.tiles && m.tiles[key]) || null;
  }

  // Mengisi sebuah elemen dengan gambar aset (atau emoji jika gambar belum ada/dimatikan).
  // variant (opsional) = kunci map, supaya ikon pos memakai gambar khusus map itu.
  function fill(el, group, key, variant) {
    const a = (A[group] || {})[key] || {};
    el.textContent = '';
    const srcs = [];
    if (A.useImages) {
      const v = variantEntry(group, key, variant);
      if (v && v.img) srcs.push(A.base + v.img);
      if (a.img) srcs.push(A.base + a.img);
    }
    if (!srcs.length) { el.textContent = a.emoji || ''; return; }
    const im = new Image();
    let n = 0;
    im.alt = '';
    im.draggable = false;
    im.className = 'asset-img';
    im.onerror = function () {                 // gambar tidak ada: coba cadangan berikutnya, terakhir emoji
      n++;
      if (n < srcs.length) im.src = srcs[n];
      else el.textContent = a.emoji || '';
    };
    im.src = srcs[0];
    el.appendChild(im);
  }

  // Alamat gambar sebuah aset, atau null jika gambar dimatikan / tidak didefinisikan
  function url(group, key) {
    const a = (A[group] || {})[key];
    return A.useImages && a && a.img ? A.base + a.img : null;
  }

  // Memeriksa apakah sebuah alamat gambar benar-benar ada. Promise berisi alamat itu, atau null jika gagal dimuat.
  function probeUrl(u) {
    return new Promise(function (resolve) {
      if (!u) { resolve(null); return; }
      const im = new Image();
      im.onload = function () { resolve(u); };
      im.onerror = function () { resolve(null); };
      im.src = u;
    });
  }

  function probe(group, key) { return probeUrl(url(group, key)); }

  // Alamat gambar muka dadu v (1..6) pada set dadu setKey, atau null
  function faceUrl(setKey, v) {
    const s = (A.diceSets || {})[setKey];
    const p = s && s.faces && s.faces[v - 1];
    return A.useImages && p ? A.base + p : null;
  }

  // Menerapkan latar sebuah map ke elemen: atribut data-map (warna cadangan di CSS) + variabel --stage-img / --board-img.
  // Gambar ditaruh di atas gradasi bawaan, jadi kalau file hilang tampilan tetap utuh.
  function mapStyle(el, key) {
    const m = (A.maps || {})[key];
    if (!el || !m) return;
    const u = function (p) { return A.useImages && p ? 'url("' + A.base + p + '")' : 'none'; };
    el.setAttribute('data-map', key);
    el.style.setProperty('--stage-img', u(m.stage));
    el.style.setProperty('--board-img', u(m.board));
  }

  // Latar halaman (seluruh body)
  function applyBackground(key, el) {
    const a = A.background[key];
    if (!el || !A.useImages || !a || !a.img) return;
    const old = getComputedStyle(el).backgroundImage;
    el.style.backgroundImage = 'url("' + A.base + a.img + '")' + (old && old !== 'none' ? ', ' + old : '');
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  }

  // Elemen HTML dengan atribut data-asset="grup.nama" diisi otomatis
  function init() {
    document.querySelectorAll('[data-asset]').forEach(function (el) {
      const p = el.dataset.asset.split('.');
      fill(el, p[0], p[1]);
    });
    applyBackground('page', document.body);
  }

  window.Assets = { config: A, fill: fill, url: url, probe: probe, probeUrl: probeUrl, faceUrl: faceUrl, mapStyle: mapStyle, init: init };
})();
