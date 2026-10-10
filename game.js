(function () {
  'use strict';

  const Assets = window.Assets; // dari assets.js
  const Soal = window.Soal;     // dari soal/soal.js (daftar pelajaran)
  if (!Soal || !Soal.list.length) {
    document.body.innerHTML = '<p style="padding:24px;font:18px sans-serif">Belum ada soal. Pastikan soal/soal.js dan minimal satu file soal (mis. soal/ips.js) dimuat di index.html sebelum game.js.</p>';
    return;
  }

  /* ================= PENGATURAN ================= */
  const BOARD = 40;           // jumlah pos di papan (pos 0 = START); papan berputar terus, tidak ada garis finish
  const STEP_MS = 300;        // jeda per langkah bidak
  const LETTERS = ['A', 'B', 'C', 'D'];

  const RULES = {
    mudah:  { label: 'Mudah',  icon: '🟢', gain: 5,  loss: 2 },
    sedang: { label: 'Sedang', icon: '🟡', gain: 10, loss: 4 },
    sulit:  { label: 'Sulit',  icon: '🔴', gain: 15, loss: 6 }
  };
  // Pos event: pemain memilih 1 dari 3 kartu, isi kartu baru terlihat setelah dibuka (lihat bagian POS EVENT di bawah)
  const EVENT = {
    revealDelay: 500,   // jeda setelah kartu dibuka sampai efek terjadi (ms)
    quakeMs: 2000,      // lama layar berguncang pada kartu Gempa (ms)
    quakeShift: 7,      // kekuatan guncangan (px); makin kecil makin halus
    quakeBigMs: 4000,   // lama guncangan dan suara kartu Megathrust (ms)
    quakeMediumPoints: 5,  // poin yang hilang pada Gempa Sedang (pemain di pos event)
    megathrustPoints: 5,   // poin yang hilang dari SEMUA pemain pada Megathrust
    stealPoints: 10,    // poin yang dicuri oleh kartu Pencuri
    cards: 3,           // jumlah kartu yang ditampilkan; diambil acak dari daftar EVENTS (tata letak CSS dibuat untuk 3 kartu)
    rinneganRange: 10,  // jarak (pos) ke depan/belakang yang terkena Rinnegan
    rinneganPoints: 5,  // poin yang diambil dari tiap pemain yang ditarik
    taxPoints: 10,      // poin yang hilang karena kartu Pajak
    luckyPoints: 5,     // poin tambahan dari kartu Rezeki
    charityPoints: 15,  // Sedekah Jariyah: poin dari pemain tertinggi ke pemain terendah
    crisisPoints: 10,   // Krisis dan Kerusuhan: poin yang hilang dari pemain tertinggi
    crisisToOpener: false   // true = poin itu dijarah pemain yang membuka kartu (jika bukan pemain tertinggi itu sendiri); false = hilang begitu saja
  };
  // Aset pos event. Jika assets.js belum punya entrinya, emoji bawaan ini dipakai.
  // Untuk memakai gambar sendiri, tambahkan entri yang sama di assets.js (tiles.event, effects.gempa, dst.).
  (function ensureEventAssets() {
    const c = Assets.config;
    const add = (group, key, v) => { c[group] = c[group] || {}; if (!c[group][key]) c[group][key] = v; };
    add('tiles', 'event', { emoji: '🎴', img: 'tiles/event.png' });
    add('tiles', 'freewill', { emoji: '🎯', img: 'tiles/freewill.png' });
    add('effects', 'gempa_kecil', { emoji: '📳', img: 'effects/gempa_kecil.png' });
    add('effects', 'gempa_sedang', { emoji: '🏚️', img: 'effects/gempa_sedang.png' });
    add('effects', 'megathrust', { emoji: '🌊', img: 'effects/megathrust.png' });
    add('effects', 'kemacetan', { emoji: '🚦', img: 'effects/kemacetan.png' });
    add('effects', 'pencuri', { emoji: '🦹', img: 'effects/pencuri.png' });
    add('effects', 'teleportasi', { emoji: '🌀', img: 'effects/teleportasi.png' });
    add('effects', 'rinnegan', { emoji: '👁️', img: 'effects/rinnegan.png' });
    add('effects', 'pajak', { emoji: '💸', img: 'effects/pajak.png' });
    add('effects', 'rezeki', { emoji: '🍀', img: 'effects/rezeki.png' });
    add('effects', 'sedekah_jariyah', { emoji: '🤲', img: 'effects/sedekah_jariyah.png' });
    add('effects', 'krisis_kerusuhan', { emoji: '🔥', img: 'effects/krisis_kerusuhan.png' });
  })();
  // Tingkat kesulitan (dipilih di menu) hanya mengubah timer menjawab soal. detik: 0 = tanpa timer.
  const DIFFICULTY = {
    mudah:   { nama: 'Mudah',   detik: 0 },
    sedang:  { nama: 'Sedang',  detik: 30 },
    sulit:   { nama: 'Sulit',   detik: 15 },
    legenda: { nama: 'Legenda', detik: 8 }
  };
  const DEFAULT_DIFF = 'sedang';
  const diffOf = (id) => (Object.prototype.hasOwnProperty.call(DIFFICULTY, id) ? id : DEFAULT_DIFF);
  let diff = DEFAULT_DIFF;       // tingkat kesulitan permainan yang sedang berjalan
  const BACK_STEPS = 3;          // langkah mundur jika jawaban salah atau waktu habis (jawaban benar tidak menggerakkan bidak)
  const FACT_POINTS = 3;

  // Skill pemain (hanya True Explorer): sebelum kocokan pertama tiap pemain memilih 1 dari kartu skill acak.
  const SKILL = {
    cards: 3,                // jumlah kartu pilihan (diambil acak dari SKILLS; diambil acak dari semua skill yang terdaftar)
    revealMs: 1800,          // jeda setelah kartu dibuka sampai pemain berikutnya memilih (ms)
    noteMs: 3200,            // lama notifikasi kecil tampil (ms)
    thiefChance: 0.05,       // Si Pencuri: peluang aktif tiap kali melewati lawan (0.05 = 5%)
    thiefPoints: 10,         // Si Pencuri: poin yang diambil dari tiap lawan yang dilewati
    thiefIncludeLanding: false,   // true = lawan yang berada di petak tujuan juga dihitung "dilewati"
    privilegePoints: 20,     // Si Privilese: poin saat pertama kali mengocok dadu
    businessPoints: 10,      // Si Pengusaha: poin tiap melewati START
    mafiaChance: 0.2,        // Si Mafia: peluang beli pos kosong gratis
    mafiaMax: 3,             // Si Mafia: maksimal berapa kali efek terpakai (setelah itu skill hilang)
    lincahChance: 0.2,       // Si Lincah: peluang bebas sewa (tidak terbatas jumlahnya)
    kikirMultiplier: 2,      // Si Kikir: biaya ambil alih pos miliknya dikalikan ini
    kikirMax: 2,             // Si Kikir: maksimal berapa kali efek terpakai (setelah itu skill hilang)
    papaChance: 0.3,         // Si Anak Papa: peluang sewa dibayarkan papa (poin pemilik pos tetap bertambah)
    ghoibChance: 0.5,        // Si Anak Ghoib: peluang teleportasi ke pos Free Will setelah singgah di pos lawan
    baekPoints: 10,          // Si Orang Baek: poin untuk tiap pemain lain saat kocokan pertamanya
    pintarChance: 0.3,       // Si Pintar: peluang tombol "Ganti Soal" gratis muncul tiap ada soal (tanpa batas jumlah)
    telitiStreak: 3,         // Si Teliti: jumlah jawaban benar beruntun yang dibutuhkan
    telitiPoints: 15         // Si Teliti: bonus poin saat beruntun tercapai
  };
  // Menambah skill baru: tambahkan satu objek di sini, lalu satu fungsi efek dan satu pemanggilnya (lihat bagian SKILL PEMAIN).
  const SKILLS = {
    pencuri:   { id: 'pencuri',   nama: 'Si Pencuri',   emoji: '🦹', ket: Math.round(SKILL.thiefChance * 100) + '% peluang mengambil ' + SKILL.thiefPoints + ' poin dari tiap lawan yang dilewati.' },
    privilese: { id: 'privilese', nama: 'Si Privilese', emoji: '👑', ket: 'Dapat ' + SKILL.privilegePoints + ' poin saat pertama kali mengocok dadu.' },
    pengusaha: { id: 'pengusaha', nama: 'Si Pengusaha', emoji: '💼', ket: 'Dapat ' + SKILL.businessPoints + ' poin setiap melewati START.' },
    mafia:     { id: 'mafia',     nama: 'Si Mafia',     emoji: '🕶️', max: SKILL.mafiaMax, ket: Math.round(SKILL.mafiaChance * 100) + '% peluang membeli pos kosong secara gratis. Efek dipakai maksimal ' + SKILL.mafiaMax + 'x.' },
    lincah:    { id: 'lincah',    nama: 'Si Lincah',    emoji: '🏃', ket: Math.round(SKILL.lincahChance * 100) + '% peluang bebas sewa saat singgah di pos lawan (biaya ambil alih tetap dibayar). Bisa aktif terus-menerus.' },
    kikir:     { id: 'kikir',     nama: 'Si Kikir',     emoji: '🧐', max: SKILL.kikirMax, ket: 'Lawan yang mengambil alih pos milikmu membayar ' + SKILL.kikirMultiplier + 'x lipat. Efek hanya ' + SKILL.kikirMax + 'x, setelah itu skill hilang.' },
    anakpapa:  { id: 'anakpapa',  nama: 'Si Anak Papa',  emoji: '👨‍👦', ket: Math.round(SKILL.papaChance * 100) + '% peluang sewa dibayarin papa: poinmu tidak berkurang, tetapi pemilik pos tetap menerima sewanya.' },
    anakghoib: { id: 'anakghoib', nama: 'Si Anak Ghoib', emoji: '👻', ket: Math.round(SKILL.ghoibChance * 100) + '% peluang teleportasi ke pos Free Will setelah singgah di pos milik lawan.' },
    orangbaek: { id: 'orangbaek', nama: 'Si Orang Baek', emoji: '😇', ket: 'Saat kocokan pertama, semua pemain lain mendapat ' + SKILL.baekPoints + ' poin.' },
    pintar:    { id: 'pintar',    nama: 'Si Pintar',    emoji: '🧠', ket: Math.round(SKILL.pintarChance * 100) + '% peluang bebas mengganti soal yang muncul. Bisa aktif terus-menerus.' },
    teliti:    { id: 'teliti',    nama: 'Si Teliti',    emoji: '🔍', ket: 'Jawab benar ' + SKILL.telitiStreak + 'x beruntun, dapat bonus ' + SKILL.telitiPoints + ' poin.' }
  };
  // Ikon skill: tambahkan entri yang sama di assets.js (effects.skill_pencuri, dst.) untuk memakai gambar sendiri.
  (() => {   // ikon notifikasi bunga investasi pos (effects.investasi)
    const c = Assets.config;
    c.effects = c.effects || {};
    if (!c.effects.investasi) c.effects.investasi = { emoji: '💰', img: 'effects/investasi.png' };
  })();
  Object.keys(SKILLS).forEach((k) => {
    const c = Assets.config;
    c.effects = c.effects || {};
    if (!c.effects['skill_' + k]) c.effects['skill_' + k] = { emoji: SKILLS[k].emoji, img: 'effects/skill_' + k + '.png' };
  });

  // Perjalanan dipilih di menu dan menentukan target poin: permainan selesai saat salah satu pemain
  // mencapai (sama dengan atau lebih dari) target. Papan berputar terus sampai ada yang mencapai target.
  const JOURNEYS = {
    short:    { nama: 'Short Journey', target: 80 },
    long:     { nama: 'Long Journey',  target: 140 },
    traveler: { nama: 'Traveler',      target: 200 }
  };
  const DEFAULT_JOURNEY = 'long';
  const journeyOf = (id) => (Object.prototype.hasOwnProperty.call(JOURNEYS, id) ? id : DEFAULT_JOURNEY);
  let journey = DEFAULT_JOURNEY;   // perjalanan permainan yang sedang berjalan
  const targetPoints = () => JOURNEYS[journey].target;
  const MAX_PLAYERS = 4;

  // Mode permainan (dipilih di menu halaman 2). Menambah mode baru: tambahkan satu objek di sini.
  const MODES = {
    klasik:   { nama: 'Mode Klasik',   emoji: '🎲', ket: 'Jawab soal, kumpulkan poin. Cocok untuk anak SD.' },
    explorer: { nama: 'True Explorer', emoji: '🏙️', ket: 'Beli pos dengan poin seperti monopoli, plus skill pemain. Cocok untuk kelas atas dan guru.' },
    survivor: { nama: 'Survivor', emoji: '💀', ket: 'Aturan True Explorer, tetapi semua mulai 50 poin, poin habis (0) = gugur, dan tiap 5 putaran sewa serta ambil alih dikali 2. Pemain terakhir bertahan menang. Min. 2 pemain.' }
  };
  const SURVIVOR_START = 50;       // modal poin tiap pemain di mode Survivor
  const SURVIVOR_MIN_PLAYERS = 2;
  const SURVIVOR_INFLATE_EVERY = 5;   // tiap 5 putaran (semua pemain sudah giliran 5x), sewa dan ambil alih dikali SURVIVOR_INFLATE_MUL
  const SURVIVOR_INFLATE_MUL = 2;
  let costMul = 1;                    // pengali sewa & ambil alih saat ini (Survivor)
  let roundNo = 0;                    // putaran yang sudah selesai (semua mode)
  const DEFAULT_MODE = 'klasik';
  const modeOf = (id) => (Object.prototype.hasOwnProperty.call(MODES, id) ? id : DEFAULT_MODE);
  let mode = DEFAULT_MODE;
  const isEx = () => mode === 'explorer' || mode === 'survivor';   // mekanisme True Explorer (pos, skill, sewa) berlaku di kedua mode
  const isSurv = () => mode === 'survivor';
  let watching = false;            // Survivor: semua pemain manusia gugur dan pemain memilih menonton Com bermain       // mode permainan yang sedang berjalan

  // True Explorer: hanya pos soal (types) yang bisa dimiliki. Uangnya adalah poin.
  // price = harga beli, rent = sewa yang dibayar pemain lain yang singgah, takeover = biaya ambil alih.
  const PROPERTY = {
    types: ['mudah', 'sedang', 'sulit'],
    tiers: [
      { from: 1,  to: 9,  price: 5,  rent: 4, takeover: 7 },    // baris 1: pos 1 - 9
      { from: 10, to: 19, price: 7,  rent: 5, takeover: 9 },    // baris 2: pos 10 - 19
      { from: 20, to: 39, price: 10, rent: 8, takeover: 14 }    // baris 3 dan 4: pos 20 - 39
    ],
    takeoverToOwner: true,   // true = biaya ambil alih dibayarkan kepada pemilik lama; false = hilang (ke bank)
    comBuy: 0.85,            // peluang com membeli pos kosong yang mampu dibelinya
    comTakeover: 0.6,        // peluang com mengambil alih pos milik pemain lain yang mampu dibayarnya
    investPoints: 5,         // hasil investasi: poin tiap melewati atau berhenti di pos milik sendiri (maju saja)
    upgradeRent: 4,          // tiap ada bidak berhenti di pos yang sudah dibeli: sewa pos naik sebesar ini (kelipatannya tiap level)
    upgradeTakeover: 2,      // ... dan biaya ambil alih naik sebesar ini
    hotelAt: 3               // level maksimal: pada kunjungan ke-3 rumah berubah jadi hotel (dan tidak naik lagi)
  };
  let levels = Array.from({ length: BOARD }, () => 0);    // level bangunan tiap pos: 0 = kosong, 1-2 = rumah, hotelAt = hotel
  // pos dengan harga sewa / ambil alih yang sudah termasuk kenaikan level (null jika bukan pos yang bisa dimiliki)
  const tierOf = (pos) => {
    const t = propOf(pos);
    if (!t) return null;
    const lv = levels[pos] || 0;
    return { from: t.from, to: t.to, price: t.price, rent: (t.rent + lv * PROPERTY.upgradeRent) * costMul, takeover: (t.takeover + lv * PROPERTY.upgradeTakeover) * costMul };
  };
  let owners = Array.from({ length: BOARD }, () => -1);   // pemilik tiap pos: indeks pemain, -1 = belum dimiliki

  // Map dan dadu dibaca dari assets.js (Assets.config.maps / diceSets). Jika tidak ada, dipakai satu pilihan bawaan.
  const MAPS = Assets.config.maps || { map1: { nama: 'Map 1', emoji: '🗺️', bgm: 'game', tiles: {} } };
  const DICE_SETS = Assets.config.diceSets || { d1: { nama: 'Klasik', emoji: '🎲', sfx: 'klasik', body: '#ffffff', pip: '#12304a' } };
  const DEFAULT_MAP = Object.keys(MAPS)[0];
  const DEFAULT_DICE = Object.keys(DICE_SETS)[0];
  const mapOf = (id) => (Object.prototype.hasOwnProperty.call(MAPS, id) ? id : DEFAULT_MAP);
  const diceOf = (id) => (Object.prototype.hasOwnProperty.call(DICE_SETS, id) ? id : DEFAULT_DICE);
  // Pemain komputer (com): peluang menjawab benar 0.85 = 85% (ubah di sini, mis. 0.8 sampai 0.9).
  const COM = {
    accuracy: 0.85,
    rollMs: 900,            // jeda sebelum com mengocok dadu (ms)
    thinkMin: 1200,         // com "berpikir" sebelum memilih jawaban (ms, acak antara min dan max)
    thinkMax: 2800,
    readMs: 1800,           // jeda sebelum com menekan Lanjut (ms)
    pickMs: 1100            // jeda sebelum com membuka kartu event (ms)
  };
  const NAME_MAX = 12;
  const SAVE_KEY = 'jips8.save.v2';   // permainan yang sedang berjalan (localStorage)
  const SETUP_KEY = 'jips8.setup.v1'; // pilihan terakhir di menu (nama, karakter, dst.)
  // Posisi bidak saat satu pos dipakai bersama: [geser-x %, geser-y %, skala]
  const SPOTS = {
    1: [[0, 0, 1]],
    2: [[-24, 24, .85], [24, -24, .85]],
    3: [[-26, 22, .7], [26, 22, .7], [0, -28, .7]],
    4: [[-26, -26, .65], [26, -26, .65], [-26, 26, .65], [26, 26, .65]]
  };

  // 40 pos: 0 = START, 39 = pos event (dulu FINISH), sisanya mengikuti pola 10 pos yang berulang
  const PATTERN = ['mudah', 'sedang', 'mudah', 'event', 'sulit', 'sedang', 'mudah', 'khusus', 'sedang', 'sulit'];
  // Pos tambahan yang dijadikan pos event (menimpa pola di atas). Tambah/hapus nomor pos di sini.
  const EXTRA_EVENT_TILES = [7, 19, 27, 30];
  // Pos dengan jenis khusus yang menimpa pola di atas. 'freewill' = pemain bebas memilih jenis pos tanpa berpindah.
  const SPECIAL_TILES = { 20: 'freewill', 21: 'sulit' };
  const LAYOUT = Array.from({ length: BOARD }, (_, i) =>
    SPECIAL_TILES[i] || (i === 0 ? 'start' : i === BOARD - 1 || EXTRA_EVENT_TILES.indexOf(i) !== -1 ? 'event' : PATTERN[(i - 1) % PATTERN.length]));
  const TITLES = {
    start: 'START', mudah: 'Soal mudah', sedang: 'Soal sedang',
    sulit: 'Soal sulit', event: 'Pos event', khusus: 'Pos khusus', freewill: 'Free Will'
  };
  // Data harga pos (atau null jika pos itu tidak bisa dimiliki: START, event, khusus, Free Will)
  const propOf = (pos) => (PROPERTY.types.indexOf(LAYOUT[pos]) === -1 ? null : PROPERTY.tiers.find((t) => pos >= t.from && pos <= t.to) || null);


  /* ================= ELEMEN & STATE ================= */
  const $ = (id) => document.getElementById(id);
  const el = {
    board: $('board'), dice: $('dice'),
    rollBtn: $('rollBtn'), restartBtn: $('restartBtn'), soundBtn: $('soundBtn'),
    diceText: $('diceText'), turnText: $('turnText'), roundText: $('roundText'), message: $('message'),
    modal: $('modal'), modalCard: $('modalCard'), badge: $('badge'), qText: $('qText'),
    options: $('options'), feedback: $('feedback'), nextBtn: $('nextBtn'), fx: $('fxIcon'),
    win: $('win'), winText: $('winText'), winResult: $('winResult'), againBtn: $('againBtn'),
    home: $('home'), setupView: $('setupView'), gameView: $('gameView'), menuBtn: $('menuBtn'), winMenuBtn: $('winMenuBtn'),
    toSetupBtn: $('toSetupBtn'), backBtn: $('backBtn'), mapBtns: $('mapBtns'), diceBtns: $('diceBtns'),
    helpPick: $('helpPick'), helpTabs: $('helpTabs'), helpBody: $('helpBody'), helpClose: $('helpClose'),
    playersBox: $('players'), countBtns: $('countBtns'), journeyBtns: $('journeyBtns'), diffBtns: $('diffBtns'), setupRows: $('setupRows'), subjectBtns: $('subjectBtns'), subjectInfo: $('subjectInfo'),
    subjectOpen: $('subjectOpen'), subjectPick: $('subjectPick'), subjectClose: $('subjectClose'),
    subjectCurIco: $('subjectCurIco'), subjectCurName: $('subjectCurName'), subjectCurCount: $('subjectCurCount'),
    timer: $('timer'), timerFill: $('timerFill'), timerText: $('timerText'),
    freePick: $('freePick'), freeBox: $('freeBox'), fwBadge: $('fwBadge'), fwBtns: $('fwBtns'),
    modeBtns: $('modeBtns'), modeDesc: $('modeDesc'), propPick: $('propPick'), propBox: $('propBox'), propBadge: $('propBadge'), propTitle: $('propTitle'), propInfo: $('propInfo'), propBtns: $('propBtns'),
    evPick: $('eventPick'), evBox: $('eventBox'), evBadge: $('evBadge'), evHint: $('evHint'), evCards: $('evCards'), evResult: $('evResult'), evNext: $('evNext'),
    confirmBox: $('confirm'), confirmText: $('confirmText'), confirmYes: $('confirmYes'), confirmNo: $('confirmNo'),
    startBtn: $('startBtn'), continueBox: $('continueBox'), continueInfo: $('continueInfo'), continueBtn: $('continueBtn'),
    skillPick: $('skillPick'), skillBox: $('skillBox'), skBadge: $('skBadge'), skHint: $('skHint'), skCards: $('skCards'), skResult: $('skResult'), skTaken: $('skTaken'), skillFeed: $('skillFeed')
  };
  const NAMES = [];   // nama pemain (diisi saat permainan dimulai)
  const ui = [];      // elemen kartu & bidak tiap pemain (dibuat oleh buildPlayers)

  // pos = nomor pos (0..39)
  const newPlayer = (name, char, com) => ({ name: name, char: char, com: !!com, pos: 0, score: 0, answered: 0, correct: 0, wrong: 0, skip: 0, skill: null, priv: false, used: 0, streak: 0, out: false });
  // state.pos, state.score, dst. selalu menunjuk ke pemain yang sedang giliran
  const state = {
    players: [], turn: 0, busy: false, run: 0,
    get pos() { return this.players[this.turn].pos; }, set pos(v) { this.players[this.turn].pos = v; },
    get score() { return this.players[this.turn].score; }, set score(v) { this.players[this.turn].score = v; },
    get answered() { return this.players[this.turn].answered; }, set answered(v) { this.players[this.turn].answered = v; },
    get correct() { return this.players[this.turn].correct; }, set correct(v) { this.players[this.turn].correct = v; },
    get wrong() { return this.players[this.turn].wrong; }, set wrong(v) { this.players[this.turn].wrong = v; }
  };
  const queues = { mudah: [], sedang: [], sulit: [] };
  let factQueue = [];
  let subject = null;   // pelajaran yang sedang dimainkan (objek dari Soal.list)
  const subjectById = (id) => Soal.list.find((x) => x.id === id) || Soal.list[0];
  const cells = [];
  const bldEls = [];   // elemen emoji bangunan tiap pos
  const pips = [];
  let soundOn = true;
  let audioCtx = null;
  let extraRoll = false;      // true = pemain yang sedang giliran boleh mengocok dadu lagi (kartu Rezeki)
  let faceNow = 1;            // muka dadu yang sedang tampil
  const diceUrl = {};         // gambar muka dadu custom yang berhasil dimuat: { 1: 'assets/dice/face1.png', ... }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ================= ATURAN KEMENANGAN (TARGET POIN) ================= */
  const cur = () => state.players[state.turn];
  const aliveCount = () => state.players.filter((p) => !p.out).length;
  const humanAlive = () => state.players.some((p) => !p.com && !p.out);
  // menang = skor sama dengan atau lebih dari target perjalanan
  const hasWon = (p) => !isSurv() && p.score >= targetPoints();
  // 0..1 : kemajuan pemain menuju target poin
  const progressOf = (p) => (isSurv() ? (p.out ? 0 : Math.min(1, p.score / SURVIVOR_START)) : Math.min(1, p.score / targetPoints()));
  // Indeks pemenang (-1 jika belum ada). Di True Explorer pemilik pos bisa mencapai target dari sewa, jadi semua pemain dicek.
  // Jika lebih dari satu yang mencapai target, skor tertinggi menang; seri = yang lebih dulu dalam urutan giliran.
  function winnerIndex() {
    if (isSurv()) {                // Survivor: menang = satu-satunya pemain yang belum gugur
      const alive = state.players.map((p, i) => i).filter((i) => !state.players[i].out);
      return alive.length === 1 && state.players.length > 1 ? alive[0] : -1;
    }
    const n = state.players.length;
    let best = -1;
    for (let k = 0; k < n; k++) {
      const i = (state.turn + k) % n;
      if (hasWon(state.players[i]) && (best === -1 || state.players[i].score > state.players[best].score)) best = i;
    }
    return best;
  }

  /* ================= PENYIMPANAN (localStorage) ================= */
  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 3, journey: journey, diff: diff, subject: subject.id, map: config ? config.map : setup.map, dice: config ? config.dice : setup.dice, mode: mode, owners: owners, levels: levels, costMul: costMul, roundNo: roundNo, turn: state.turn, players: state.players }));
    } catch (e) { /* penyimpanan tidak tersedia: abaikan */ }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* abaikan */ }
  }

  const CHARS = Object.keys(Assets.config.characters);

  function cleanName(v, i, com) {
    v = String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
    return v || (com ? 'Com ' : 'Pemain ') + (i + 1);
  }

  // Mengembalikan { journey, diff, subject, turn, players } yang valid, atau null jika tidak ada / rusak / sudah menang.
  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || d.v !== 3 || !Array.isArray(d.players) || d.players.length < 1 || d.players.length > MAX_PLAYERS) return null;
      const jr = journeyOf(d.journey);
      const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
      const players = d.players.map((p, i) => {
        p = p || {};
        return {
          name: cleanName(p.name, i, i > 0 && !!p.com), com: i > 0 && !!p.com, char: CHARS.indexOf(p.char) !== -1 ? p.char : CHARS[i % CHARS.length],
          pos: Math.min(num(p.pos), BOARD - 1),
          score: num(p.score), answered: num(p.answered), correct: num(p.correct), wrong: num(p.wrong),
          skip: Math.min(num(p.skip), 2),
          out: modeOf(d.mode) === 'survivor' && !!p.out, skill: (modeOf(d.mode) === 'explorer' || modeOf(d.mode) === 'survivor') && SKILLS[p.skill] ? p.skill : null, priv: !!p.priv, used: Math.min(num(p.used), 99), streak: Math.min(num(p.streak), 99)
        };
      });
      if (modeOf(d.mode) === 'survivor') {
        if (players.length < SURVIVOR_MIN_PLAYERS || players.filter((p) => !p.out).length < 2) return null;   // sisa satu pemain = sudah ada pemenang
      } else if (players.some((p) => p.score >= JOURNEYS[jr].target)) return null;   // sudah ada pemenang
      const turn = Math.floor(d.turn);
      const md = modeOf(d.mode);
      let own = Array.from({ length: BOARD }, () => -1);   // kepemilikan hanya berlaku di True Explorer dan hanya untuk pos yang bisa dimiliki
      if ((md === 'explorer' || md === 'survivor') && Array.isArray(d.owners)) {
        own = own.map((_, i) => { const o = d.owners[i]; return Number.isInteger(o) && o >= 0 && o < players.length && propOf(i) ? o : -1; });
      }
      const lvl = own.map((o, i) => (o >= 0 && Array.isArray(d.levels) ? Math.min(num(d.levels[i]), PROPERTY.hotelAt) : 0));   // level bangunan hanya untuk pos yang dimiliki
      return { journey: jr, diff: diffOf(d.diff), subject: subjectById(d.subject).id, map: mapOf(d.map), dice: diceOf(d.dice), mode: md, owners: own, levels: lvl, costMul: md === 'survivor' ? Math.max(1, Math.min(num(d.costMul) || 1, 1 << 20)) : 1, roundNo: num(d.roundNo), turn: turn >= 0 && turn < players.length ? turn : 0, players: players };
    } catch (e) { return null; }
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function nextQuestion(level) {
    if (!queues[level].length) {
      let pool = subject.soal.filter((q) => q.l === level);
      if (!pool.length) pool = subject.soal;   // tingkat ini kosong: pakai soal tingkat lain
      queues[level] = shuffle(pool);
    }
    return queues[level].pop();
  }

  function nextFact() {
    if (!subject.fakta.length) return 'Kamu menemukan kartu kejutan!';
    if (!factQueue.length) factQueue = shuffle(subject.fakta);
    return factQueue.pop();
  }

  /* ================= SUARA (Web Audio, tanpa internet) ================= */
  function getCtx() {
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function tone(freq, start, dur, type, vol) {
    if (!soundOn) return;
    try {
      const c = getCtx();
      if (!c) return;
      const t = c.currentTime + start;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    } catch (e) { /* abaikan error audio */ }
  }

  const sfx = {
    tick: () => tone(420 + Math.random() * 200, 0, 0.05, 'square', 0.35),
    step: () => tone(660, 0, 0.08, 'triangle', 0.60),
    good: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle', 0.45)),
    bad: () => { tone(220, 0, 0.25, 'sawtooth', 0.09); tone(165, 0.2, 0.3, 'sawtooth', 0.45); },
    bonus: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.08, 0.16, 'sine', 0.30)),
    win: () => [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.90)),
    // efek tombol menu
    click: () => { tone(520, 0, 0.06, 'triangle', 0.40); tone(780, 0.04, 0.08, 'triangle', 0.30); },
    select: () => { tone(660, 0, 0.07, 'sine', 0.45); tone(880, 0.06, 0.12, 'sine', 0.40); },
    start: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.2, 'triangle', 0.50)),
    // efek pos event
    flip: () => { tone(500, 0, 0.06, 'triangle', 0.40); tone(750, 0.05, 0.1, 'triangle', 0.35); },
    quake: (ms) => { const n = Math.round((ms || 2000) / 125); for (let i = 0; i < n; i++) tone(55 + Math.random() * 55, i * 0.125, 0.2, 'sawtooth', 0.50); },   // lama suara = lama guncangan
    steal: () => [988, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.1, 'square', 0.22)),
    warp: () => [330, 494, 740, 1109, 1568].forEach((f, i) => tone(f, i * 0.06, 0.14, 'sine', 0.40)),
    pull: () => [220, 330, 495, 740].forEach((f, i) => tone(f, i * 0.07, 0.14, 'triangle', 0.45))
  };

  // Suara dadu per jenis dadu (kunci sfx di assets.js -> diceSets). roll = bunyi tiap putaran, land = bunyi saat dadu berhenti.
  const DICE_SFX = {
    klasik: {
      roll: () => tone(420 + Math.random() * 200, 0, 0.05, 'square', 0.35),
      land: () => { tone(330, 0, 0.08, 'triangle', 0.6); tone(262, 0.06, 0.14, 'triangle', 0.5); }
    },
    kayu: {      // "tok tok" kayu: nada rendah-menengah yang sangat pendek
      roll: () => tone(210 + Math.random() * 130, 0, 0.045, 'triangle', 0.9),
      land: () => { tone(170, 0, 0.1, 'triangle', 0.9); tone(120, 0.05, 0.16, 'sine', 0.9); }
    },
    neon: {      // "ping" elektronik tinggi, naik saat berhenti
      roll: () => tone(1100 + Math.random() * 900, 0, 0.06, 'sine', 0.5),
      land: () => [880, 1320, 1760].forEach((f, i) => tone(f, i * 0.05, 0.14, 'sine', 0.5))
    }
  };
  let diceKey = DEFAULT_DICE;     // set dadu yang sedang dipakai
  const diceSfx = () => DICE_SFX[(DICE_SETS[diceKey] || {}).sfx] || DICE_SFX.klasik;

  /* ================= MUSIK LATAR (Web Audio, dibuat dari kode, tanpa file) ================= */
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);   // nomor nada MIDI -> frekuensi (Hz)
  // Daftar lagu. volume 0..1 per lagu (volume efek suara tidak ikut berubah). Kunci lagu dipakai oleh maps[...].bgm di assets.js.
  // Lagu 'beat': melody & bass = 64 langkah (8 birama x 8 langkah, 1 langkah = 1/8 ketuk, 0 = jeda); bass = akar nada tiap birama.
  //   lead / bassW = [jenis gelombang, volume, panjang nada (kali satu langkah)]; kick / hat = langkah (0..7) di tiap birama yang berbunyi.
  const BGM = {
    menu: { kind: 'menu', bpm: 76, volume: 0.55 },
    // Map 1 Sekolah: ceria, C - Am - F - G
    game: {
      kind: 'beat', bpm: 132, volume: 0.70, lead: ['triangle', 0.22, 0.9], bassW: ['triangle', 0.3, 1.6], kick: [0, 4], hat: [1, 3, 5, 7],
      bass: [48, 45, 41, 43, 48, 45, 41, 43],
      melody: [
        76, 0, 79, 76, 84, 0, 79, 0,    81, 0, 76, 81, 84, 0, 81, 0,    // birama 1-2
        77, 0, 81, 77, 84, 0, 81, 77,   79, 0, 83, 79, 86, 0, 83, 0,    // birama 3-4
        84, 0, 79, 84, 88, 0, 84, 0,    81, 79, 76, 0, 81, 0, 76, 0,    // birama 5-6
        77, 81, 84, 81, 77, 0, 81, 0,   79, 83, 86, 83, 79, 0, 0, 0     // birama 7-8
      ]
    },
    // Map 2 Pulau Tropis: santai dan memantul, G - Em - C - D, nada seperti marimba
    tropis: {
      kind: 'beat', bpm: 112, volume: 0.75, lead: ['sine', 0.34, 0.7], bassW: ['triangle', 0.32, 1.5], kick: [4], hat: [1, 3, 5, 7],
      bass: [43, 40, 48, 50, 43, 40, 48, 50],
      melody: [
        74, 0, 79, 0, 76, 74, 71, 0,    71, 0, 76, 0, 79, 76, 71, 0,
        72, 0, 76, 0, 79, 76, 72, 0,    74, 0, 78, 0, 81, 78, 74, 0,
        79, 0, 83, 0, 81, 79, 74, 0,    76, 0, 79, 0, 83, 79, 76, 0,
        84, 0, 79, 0, 76, 72, 76, 0,    78, 74, 78, 81, 78, 74, 0, 0
      ]
    },
    // Map 3 Kota Senja: funky santai, Am - F - C - G, lead sedikit tajam
    senja: {
      kind: 'beat', bpm: 100, volume: 0.65, lead: ['square', 0.11, 0.75], bassW: ['triangle', 0.36, 1.4], kick: [0, 3, 4], hat: [2, 6, 7],
      bass: [45, 41, 48, 43, 45, 41, 48, 43],
      melody: [
        76, 0, 0, 72, 0, 69, 0, 72,     77, 0, 0, 72, 0, 69, 0, 72,
        79, 0, 0, 76, 0, 72, 0, 76,     74, 0, 79, 0, 83, 0, 79, 0,
        81, 0, 0, 76, 0, 72, 0, 76,     77, 0, 81, 0, 84, 0, 81, 77,
        79, 0, 76, 0, 72, 0, 67, 0,     71, 0, 74, 0, 79, 0, 0, 0
      ]
    }
  };

  // Lagu menu: pelan dan santai. Akor C - G - Am - F - C - G - F - G, arpeggio lembut + melodi jarang.
  const MENU_BASS = [48, 43, 45, 41, 48, 43, 41, 43];
  const MENU_THIRD = [4, 4, 3, 4, 4, 4, 4, 4];   // 4 = akor mayor, 3 = minor
  const MENU_MELODY = [
    76, 0, 0, 0, 79, 0, 76, 0,    74, 0, 0, 0, 79, 0, 0, 0,
    76, 0, 0, 0, 81, 0, 79, 0,    77, 0, 0, 0, 81, 0, 0, 0,
    79, 0, 0, 0, 76, 0, 72, 0,    74, 0, 0, 0, 71, 0, 74, 0,
    72, 0, 0, 0, 77, 0, 76, 0,    74, 0, 0, 0, 0, 0, 0, 0
  ];

  function bgmNote(freq, t, dur, type, vol, dest) {
    const c = audioCtx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  const bgm = {
    timer: null, next: 0, step: 0, master: null, noise: null,
    name: null,               // lagu yang aktif: 'menu' atau 'game'
    wanted: false,            // true = musik seharusnya menyala (dipakai saat tab kembali aktif / suara dinyalakan lagi)
    start(name) {              // start('menu') / start('game'); tanpa nama = lanjutkan lagu yang aktif
      name = BGM[name] ? name : (BGM[this.name] ? this.name : 'game');
      this.wanted = true;
      if (name !== this.name) {   // ganti lagu: mulai dari awal
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        this.name = name;
        this.step = 0;
      }
      if (!soundOn || this.timer) return;
      const c = getCtx();
      if (!c) return;
      if (!this.master) { this.master = c.createGain(); this.master.connect(c.destination); }
      this.master.gain.cancelScheduledValues(c.currentTime);
      this.master.gain.setValueAtTime(BGM[name].volume, c.currentTime);
      this.next = c.currentTime + 0.08;
      this.timer = setInterval(() => this.pump(), 50);
    },
    halt() {                  // berhenti sementara (suara dimatikan / tab disembunyikan)
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      if (this.master && audioCtx) {
        const t = audioCtx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(this.master.gain.value, t);
        this.master.gain.linearRampToValueAtTime(0.0001, t + 0.15);
      }
    },
    stop() { this.wanted = false; this.halt(); },
    pump() {
      const c = audioCtx;
      if (!c) return;
      const song = BGM[this.name] || BGM.game;
      const menu = song.kind === 'menu';
      const dur = 60 / song.bpm / 2;
      const len = menu ? MENU_MELODY.length : song.melody.length;
      if (this.next < c.currentTime - 0.5) this.next = c.currentTime + 0.05;
      while (this.next < c.currentTime + 0.3) {
        if (menu) this.playMenu(this.step, this.next, dur); else this.play(this.step, this.next, dur, song);
        this.next += dur;
        this.step = (this.step + 1) % len;
      }
    },
    playMenu(s, t, d) {         // lagu menu: bass panjang, pad tipis, arpeggio lembut, melodi sine
      const bar = s >> 3, i = s & 7;
      const root = MENU_BASS[bar % MENU_BASS.length];
      const third = MENU_THIRD[bar % MENU_THIRD.length];
      const m = MENU_MELODY[s];
      if (m) bgmNote(midi(m), t, d * 3, 'sine', 0.2, this.master);                                  // melodi
      if (i === 0) {
        bgmNote(midi(root), t, d * 7.5, 'sine', 0.34, this.master);                                  // bass
        [12, 12 + third, 19].forEach((n) => bgmNote(midi(root + n), t, d * 8, 'sine', 0.07, this.master));   // pad
      }
      const off = [0, 7, 12, 12 + third, 19, 12 + third, 12, 7][i];
      bgmNote(midi(root + 12 + off), t, d * 1.9, 'triangle', 0.1, this.master);                      // arpeggio
    },
    play(s, t, d, song) {
      const c = audioCtx;
      const bar = s >> 3, i = s & 7;
      const m = song.melody[s];
      if (m) bgmNote(midi(m), t, d * song.lead[2], song.lead[0], song.lead[1], this.master);       // melodi
      if (i % 2 === 0) {                                                            // bass memantul
        const r = song.bass[bar % song.bass.length];
        bgmNote(midi([r, r + 12, r + 7, r + 12][i >> 1]), t, d * song.bassW[2], song.bassW[0], song.bassW[1], this.master);
      }
      if (song.kick.indexOf(i) !== -1) {                                            // kick
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + 0.2);
      }
      if (song.hat.indexOf(i) !== -1) {                                             // hi-hat tipis
        if (!this.noise) {
          this.noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.1), c.sampleRate);
          const data = this.noise.getChannelData(0);
          for (let k = 0; k < data.length; k++) data[k] = Math.random() * 2 - 1;
        }
        const src = c.createBufferSource();
        const hp = c.createBiquadFilter();
        const g = c.createGain();
        src.buffer = this.noise;
        hp.type = 'highpass';
        hp.frequency.value = 7000;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        src.connect(hp); hp.connect(g); g.connect(this.master);
        src.start(t); src.stop(t + 0.06);
      }
    }
  };
  // musik berhenti saat tab disembunyikan, lanjut lagi saat dibuka
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) bgm.halt();
    else if (bgm.wanted && soundOn) bgm.start();
  });

  /* ================= PAPAN ================= */
  function coord(i) {
    // mengembalikan [kolom, baris] pada grid 11 x 11 (keliling = 40 pos)
    if (i <= 10) return [i + 1, 1];           // baris atas, kiri ke kanan
    if (i <= 19) return [11, i - 9];          // kolom kanan, atas ke bawah
    if (i <= 30) return [31 - i, 11];         // baris bawah, kanan ke kiri
    return [1, 41 - i];                       // kolom kiri, bawah ke atas
  }

  // Arah hadap nomor dan ikon tiap pos, seperti monopoli: bagian bawah tulisan menghadap ke luar papan.
  // Nilai derajat (searah jarum jam) di bidang papan; sudut pojok miring 45 derajat ke arah luar.
  function faceAngle(i) {
    if (i === 0) return 135;      // pojok kiri atas (START)
    if (i < 10) return 180;       // sisi atas
    if (i === 10) return -135;    // pojok kanan atas
    if (i < 20) return -90;       // sisi kanan
    if (i === 20) return -45;     // pojok kanan bawah
    if (i < 30) return 0;         // sisi bawah
    if (i === 30) return 45;      // pojok kiri bawah
    return 90;                    // sisi kiri
  }

  const tileIcons = [];      // ikon tiap pos, diisi ulang saat map ganti (ikon pos bisa berbeda per map)
  let mapKey = DEFAULT_MAP;  // map yang sedang dipakai

  // Menerapkan map: latar belakang papan + tengah papan (lewat variabel CSS pada bingkai) dan ikon pos khusus map
  function applyMap(key) {
    mapKey = mapOf(key);
    Assets.mapStyle(document.getElementById('frame'), mapKey);
    tileIcons.forEach((t) => Assets.fill(t.node, 'tiles', t.type, mapKey));
  }

  function buildBoard() {
    LAYOUT.forEach((type, i) => {
      const c = coord(i);
      const div = document.createElement('div');
      div.className = 'cell t-' + type;
      div.style.gridColumn = String(c[0]);
      div.style.gridRow = String(c[1]);
      div.style.setProperty('--face', faceAngle(i) + 'deg');
      div.title = TITLES[type];
      const tag = document.createElement('span');
      tag.className = 'tag';
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = type === 'start' ? 'START' : String(i);
      const ico = document.createElement('span');
      ico.className = 'ico';
      Assets.fill(ico, 'tiles', type, mapKey);
      tileIcons.push({ node: ico, type: type });
      tag.appendChild(num);
      tag.appendChild(ico);
      div.appendChild(tag);
      const bld = document.createElement('span');   // emoji rumah / hotel (diisi paintOwners)
      bld.className = 'bld';
      bld.hidden = true;
      div.appendChild(bld);
      bldEls.push(bld);
      el.board.appendChild(div);
      cells.push(div);
    });
  }

  function buildDice() {
    for (let i = 0; i < 9; i++) {
      const p = document.createElement('span');
      p.className = 'pip';
      el.dice.appendChild(p);
      pips.push(p);
    }
  }

  const FACES = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  function showFace(v) {
    faceNow = v;
    const on = FACES[v];
    pips.forEach((p, i) => p.classList.toggle('on', on.indexOf(i) !== -1));
    // jika ada gambar muka dadu custom (assets.js -> dice.face1..face6) pakai gambar, jika tidak pakai titik CSS
    const u = diceUrl[v];
    el.dice.classList.toggle('img-face', !!u);
    el.dice.style.backgroundImage = u ? 'url("' + u + '")' : '';
    el.dice.setAttribute('aria-label', 'Dadu menunjukkan ' + v);
  }

  function loadDiceFaces() {
    const k = diceKey;
    for (let v = 1; v <= 6; v++) {
      diceUrl[v] = null;
      Assets.probeUrl(Assets.faceUrl(k, v)).then((u) => {
        if (k !== diceKey) return;                 // set dadu sudah ganti: abaikan hasil lama
        diceUrl[v] = u;
        if (v === faceNow) showFace(v);
      });
    }
  }

  // Warna dadu (badan, titik, sisi, cahaya) dari set dadu; dipakai dadu permainan dan pratinjau di menu
  function styleDice(node, key) {
    const d = DICE_SETS[key] || {};
    const set = (name, v) => { if (v) node.style.setProperty(name, v); else node.style.removeProperty(name); };
    set('--dice-bg', d.body);
    set('--dice-pip', d.pip);
    set('--dice-edge', d.edge);
    set('--dice-glow', d.glow);
    set('--pip-glow', d.pipGlow);
  }

  function applyDice(key) {
    diceKey = diceOf(key);
    styleDice(el.dice, diceKey);
    loadDiceFaces();
    showFace(faceNow);
  }

  function placePiece() {
    // pemain yang berada di pos sama dibagi posisinya supaya bidak tidak saling menutupi
    const groups = {};
    state.players.forEach((p, i) => { (groups[p.pos] = groups[p.pos] || []).push(i); });
    state.players.forEach((p, i) => {
      const c = coord(p.pos);
      const pc = ui[i].piece;
      const g = groups[p.pos];
      const s = SPOTS[g.length][g.indexOf(i)];
      pc.style.left = ((c[0] - 1) / 11 * 100) + '%';
      pc.style.top = ((c[1] - 1) / 11 * 100) + '%';
      pc.style.setProperty('--ox', s[0] + '%');
      pc.style.setProperty('--oy', s[1] + '%');
      pc.style.setProperty('--sc', s[2]);
      pc.classList.toggle('active', i === state.turn);
    });
  }

  function render() {
    state.players.forEach((p, i) => {
      ui[i].pos.textContent = p.pos === 0 ? 'START' : 'Pos ' + p.pos;
      ui[i].goal.textContent = (isSurv() ? (p.out ? 'GUGUR' : 'Bertahan') : 'Target ' + targetPoints()) + (isEx() ? ' · 🏠' + owners.filter((o) => o === i).length : '');
      ui[i].card.classList.toggle('out', !!p.out);
      ui[i].piece.hidden = !!p.out;
      ui[i].score.textContent = p.score;
      ui[i].bar.style.width = (progressOf(p) * 100) + '%';
      ui[i].card.classList.toggle('active', i === state.turn);
      ui[i].card.classList.toggle('skip', p.skip > 0);     // tertahan macet: melewati giliran berikutnya
      paintSkill(i);
    });
    el.turnText.textContent = 'Giliran: ' + NAMES[state.turn];
    el.roundText.textContent = 'Putaran ' + (roundNo + 1) + (isSurv() && costMul > 1 ? ' · Sewa ×' + costMul : '');
    cells.forEach((c, i) => c.classList.toggle('here', i === state.pos));
    placePiece();
    if (camera.follow) camera.focusTile(state.pos);
  }

  function setMessage(text) { el.message.textContent = text; }

  // Mewarnai pos sesuai pemiliknya (kelas own-p0..p3) dan memperbarui keterangan (title) tiap pos
  function paintOwners() {
    cells.forEach((c, i) => {
      const o = owners[i];
      for (let k = 0; k < MAX_PLAYERS; k++) c.classList.toggle('own-p' + k, o === k);
      const tier = tierOf(i);
      const lv = o >= 0 && isEx() ? levels[i] || 0 : 0;
      bldEls[i].textContent = lv >= PROPERTY.hotelAt ? '🏨' : lv > 0 ? '🏠'.repeat(lv) : '';
      bldEls[i].hidden = !lv;
      let t = TITLES[LAYOUT[i]];
      if (isEx() && tier) {
        t += o >= 0 && NAMES[o] ? ' · milik ' + NAMES[o] + ' · sewa ' + tier.rent + ' poin' : ' · harga ' + tier.price + ' poin';
      }
      c.title = t;
    });
  }

  // Mengubah skor pemain ke-i (skor tidak pernah di bawah 0) dan menampilkan animasi pada angkanya
  function changeScore(i, delta) {
    const p = state.players[i];
    p.score = Math.max(0, p.score + delta);
    if (isSurv() && p.score <= 0) eliminate(i);
    const sc = ui[i].score;
    sc.textContent = p.score;
    ui[i].bar.style.width = (progressOf(p) * 100) + '%';
    sc.classList.remove('bump');
    void sc.offsetWidth;
    sc.classList.add('bump');
  }

  // Survivor: pemain yang poinnya habis gugur. Pos miliknya dilepas (kembali bisa dibeli). Pemain terakhir tidak bisa digugurkan.
  function eliminate(i) {
    const p = state.players[i];
    if (p.out || state.players.filter((q, j) => j !== i && !q.out).length === 0) return;
    p.out = true;
    p.skip = 0;
    let freed = 0;
    owners.forEach((o, k) => { if (o === i) { owners[k] = -1; levels[k] = 0; freed++; } });
    paintOwners();
    ui[i].card.classList.add('out');
    ui[i].piece.hidden = true;
    ui[i].goal.textContent = 'GUGUR';
    sfx.bad();
    const ev = mk('div', 'skill-note elim-note');
    ev.appendChild(mk('span', 'sn-ico', '💀'));
    ev.appendChild(mk('span', null, p.name + ' gugur! Poinnya habis.' + (freed ? ' ' + freed + ' pos miliknya dilepas.' : '')));
    el.skillFeed.style.top = (el.playersBox.offsetHeight + 8) + 'px';
    el.skillFeed.appendChild(ev);
    setTimeout(() => ev.classList.add('out'), 4500);
    setTimeout(() => ev.remove(), 4900);
    setMessage('💀 ' + p.name + ' gugur!');
  }

  function addScore(delta) { changeScore(state.turn, delta); }   // skor pemain yang sedang giliran

  /* ================= GERAKAN ================= */
  // Satu langkah ke pos berikutnya (dir = +1 maju, -1 mundur). Papan berputar: setelah pos terakhir kembali ke START,
  // dan mundur dari START menuju pos terakhir.
  function stepOnce(dir) {
    const p = cur();
    p.pos = (p.pos + dir + BOARD) % BOARD;
    return true;
  }

  // Bidak berpindah SATU POS PER LANGKAH (tidak teleport). Posisi di state selalu mengikuti langkah terakhir.
  async function moveSteps(n, id) {
    if (!n) return;
    const dir = n > 0 ? 1 : -1;
    let left = Math.abs(n);
    let invested = 0;              // True Explorer: jumlah pos milik sendiri yang dilewati / dipijak (hasil investasi)
    while (left > 0) {
      if (!stepOnce(dir)) break;
      if (dir > 0 && cur().pos === 0) skillPassStart();   // Si Pengusaha: melewati START
      if (dir > 0 && isEx() && owners[cur().pos] === state.turn) {   // hasil investasi pos sendiri
        addScore(PROPERTY.investPoints);
        invested++;
      }
      render();
      const pc = ui[state.turn].piece;
      pc.classList.remove('hop');
      void pc.offsetWidth;
      pc.classList.add('hop');
      sfx.step();
      left--;
      await sleep(STEP_MS);
      if (id !== state.run) return;
    }
    if (invested) {
      sfx.bonus();
      skillNote(state.turn, 'investasi', 'Investasi: ' + cur().name + ' +' + (invested * PROPERTY.investPoints) + ' poin dari ' + invested + ' pos miliknya');
    }
  }

  async function animateDice(id) {
    el.dice.classList.add('rolling');
    for (let i = 0; i < 9; i++) {
      showFace(1 + Math.floor(Math.random() * 6));
      diceSfx().roll();
      await sleep(80);
      if (id !== state.run) return 0;
    }
    const v = 1 + Math.floor(Math.random() * 6);
    showFace(v);
    diceSfx().land();
    el.dice.classList.remove('rolling');
    return v;
  }

  /* ================= MODAL ================= */
  // ikon event di modal (aset: effects.benar / effects.salah / effects.bonus, atau tiles.khusus)
  function setFx(group, key) {
    if (!group) { el.fx.hidden = true; el.fx.textContent = ''; return; }
    Assets.fill(el.fx, group, key);
    el.fx.hidden = false;
  }

  function openModal() {
    el.modal.hidden = false;
    document.body.classList.add('modal-open');
    el.modalCard.classList.remove('flash-good', 'flash-bad');
    el.modalCard.focus();
  }

  /* ---- pengatur waktu soal ---- */
  let timerId = null;

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  // Hitung mundur sesuai tingkat kesulitan; waktu tidak berkurang saat tab disembunyikan. onEnd dipanggil saat habis.
  // Tingkat Mudah: tanpa timer (bilah waktu disembunyikan, soal tidak pernah kedaluwarsa).
  function startTimer(onEnd) {
    stopTimer();
    const seconds = DIFFICULTY[diff].detik;
    if (!seconds) { el.timer.hidden = true; return; }
    const total = seconds * 1000;
    let left = total;
    const draw = () => {
      el.timerFill.style.width = (left / total * 100) + '%';
      el.timerText.textContent = Math.max(0, Math.ceil(left / 1000));
      el.timer.classList.toggle('low', left <= 3000);
    };
    el.timer.hidden = false;
    draw();
    timerId = setInterval(() => {
      if (document.hidden || document.documentElement.classList.contains('tegak')) return;
      left -= 100;
      draw();
      if (left > 0 && left <= 3000 && left % 1000 === 0) sfx.tick();
      if (left <= 0) { stopTimer(); onEnd(); }
    }, 100);
  }

  function closeModal() {
    stopTimer();
    stopQuake();
    el.evNext.onclick = null;
    el.evPick.hidden = true;
    el.freePick.hidden = true;
    el.propPick.hidden = true;
    el.skillPick.hidden = true;
    el.skillBox.classList.remove('com-turn');
    el.modal.hidden = true;
    el.modalCard.classList.remove('com-turn');
    el.evBox.classList.remove('com-turn');
    el.freeBox.classList.remove('com-turn');
    el.propBox.classList.remove('com-turn');
    document.body.classList.remove('modal-open');
  }

  function waitNext() {
    return new Promise((resolve) => {
      const run = state.run;
      const go = () => { el.nextBtn.onclick = null; resolve(); };
      el.nextBtn.hidden = false;
      el.nextBtn.onclick = go;
      if (cur().com) {       // giliran com: Lanjut ditekan otomatis setelah hasil sempat terbaca
        setTimeout(() => { if (run === state.run && el.nextBtn.onclick === go) go(); }, COM.readMs);
      } else {
        el.nextBtn.focus();
      }
    });
  }

  const SWAP = { swap: true };   // hasil khusus ask(): soal diganti lewat Si Pintar
  function ask(item, level) {
    return new Promise((resolve) => {
      const rule = RULES[level];
      const opts = shuffle(item.o.map((t, i) => ({ t: t, ok: i === 0 })));
      el.badge.className = 'badge b-' + level;
      el.badge.textContent = NAMES[state.turn] + (cur().com ? ' (Com)' : '') + ' · ' + rule.label;
      el.qText.textContent = item.q;
      el.options.innerHTML = '';
      el.feedback.hidden = true;
      el.nextBtn.hidden = true;
      setFx();
      const btns = [];
      let swapBtn = null;
      opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt';
        const letter = document.createElement('span');
        letter.className = 'letter';
        letter.textContent = LETTERS[i];
        const text = document.createElement('span');
        text.textContent = o.t;
        b.appendChild(letter);
        b.appendChild(text);
        b.addEventListener('click', () => {
          stopTimer();
          if (swapBtn) swapBtn.disabled = true;   // sudah menjawab: tombol ganti soal tidak berlaku lagi
          btns.forEach((x, j) => {
            x.disabled = true;
            if (opts[j].ok) x.classList.add('correct');
            else if (x !== b) x.classList.add('dim');
          });
          if (!o.ok) b.classList.add('wrong');
          resolve(o.ok);
        });
        el.options.appendChild(b);
        btns.push(b);
      });
      // Si Pintar: peluang muncul tombol ganti soal gratis (hasil SWAP = soal diganti, bukan jawaban)
      if (cur().skill === 'pintar' && Math.random() < SKILL.pintarChance) {
        swapBtn = document.createElement('button');
        swapBtn.type = 'button';
        swapBtn.className = 'btn ghost';
        swapBtn.style.marginTop = '8px';
        swapBtn.textContent = '🧠 Si Pintar: Ganti Soal (gratis)';
        swapBtn.addEventListener('click', () => {
          stopTimer();
          swapBtn.disabled = true;
          btns.forEach((x) => { x.disabled = true; });
          skillNote(state.turn, 'pintar', 'Si Pintar: ' + cur().name + ' mengganti soal');
          sfx.select();
          resolve(SWAP);
        });
        el.options.appendChild(swapBtn);
      }
      openModal();
      el.modalCard.classList.toggle('com-turn', !!cur().com);   // giliran com: pilihan tidak bisa diketuk pemain
      startTimer(() => {
        if (swapBtn) swapBtn.disabled = true;          // waktu habis: kunci semua pilihan, tampilkan jawaban benar, hasil = null
        btns.forEach((x, j) => {
          x.disabled = true;
          if (opts[j].ok) x.classList.add('correct'); else x.classList.add('dim');
        });
        resolve(null);
      });
      if (cur().com) {            // com memilih jawaban: benar dengan peluang COM.accuracy, selain itu salah satu jawaban salah
        const run = state.run;
        const right = Math.random() < COM.accuracy;
        const pool = btns.filter((x, j) => opts[j].ok === right);
        const choice = pool[Math.floor(Math.random() * pool.length)] || btns[0];
        const wait = COM.thinkMin + Math.random() * (COM.thinkMax - COM.thinkMin);
        const comSwap = !!swapBtn && Math.random() < 0.5;   // com yang punya Si Pintar mengganti soal separuh dari kesempatan
        setTimeout(() => {
          if (run !== state.run) return;
          if (comSwap && swapBtn.isConnected && !swapBtn.disabled) { swapBtn.click(); return; }
          if (choice.isConnected && !choice.disabled) choice.click();
        }, wait);
      }
    });
  }

  function showFeedback(ok, msg, pts) {
    el.feedback.className = 'feedback ' + (ok ? 'good' : 'bad');
    el.feedback.textContent = msg;
    const small = document.createElement('small');
    small.textContent = pts;
    el.feedback.appendChild(small);
    el.feedback.hidden = false;
    setFx('effects', ok ? 'benar' : 'salah');
    el.modalCard.classList.add(ok ? 'flash-good' : 'flash-bad');
  }

  function showInfo(kind, badgeText, title, text, fx) {
    el.badge.className = 'badge b-' + kind;
    el.badge.textContent = NAMES[state.turn] + ' · ' + badgeText;
    el.qText.textContent = title;
    el.options.innerHTML = '';
    el.feedback.className = 'feedback info';
    el.feedback.textContent = text;
    el.feedback.hidden = false;
    el.nextBtn.hidden = true;
    el.timer.hidden = true;
    if (fx) setFx(fx[0], fx[1]); else if (kind === 'bonus') setFx('effects', 'bonus'); else setFx('tiles', kind);
    openModal();
  }

  /* ================= ALUR PERMAINAN ================= */
  // Mengembalikan true jika jawaban benar (false jika salah / waktu habis). hint (opsional) = fungsi yang menambah teks pada jawaban benar.
  async function handleQuestion(level, id, hint) {
    const rule = RULES[level];
    let res = SWAP;
    while (res === SWAP) {                               // Si Pintar bisa mengganti soal; soal baru muncul dengan undian baru
      res = await ask(nextQuestion(level), level);       // true / false / null (waktu habis) / SWAP (diganti)
      if (id !== state.run) return;
    }
    const timeout = res === null;
    const ok = res === true;

    const before = state.score;
    let msg;
    let move = 0;                   // jawaban benar: bidak tetap di tempat; yang berubah hanya poin
    state.answered++;
    if (ok) {
      state.correct++;
      addScore(rule.gain);
      msg = 'Benar! Poinmu bertambah.' + (hint ? ' ' + hint() : '') + skillTeliti(true);
      sfx.good();
    } else {
      state.wrong++;
      skillTeliti(false);
      addScore(-rule.loss);
      move = -BACK_STEPS;
      const lead = timeout ? 'Waktu habis!' : 'Jawaban belum tepat.';
      msg = lead + ' Kamu mundur ' + BACK_STEPS + ' langkah.';
      sfx.bad();
    }
    if (hasWon(cur())) msg = 'Benar! Target ' + targetPoints() + ' poin tercapai!';
    const delta = state.score - before;
    const pts = delta > 0 ? '+' + delta + ' poin' : delta < 0 ? delta + ' poin' : 'Skor tetap ' + state.score;
    showFeedback(ok, msg, pts);

    await waitNext();
    if (id !== state.run) return;
    closeModal();
    if (hasWon(cur())) return ok;  // target tercapai: permainan selesai, bidak tidak perlu bergerak lagi
    if (move) {                    // hanya jawaban salah / waktu habis yang menggerakkan bidak
      await sleep(200);
      await moveSteps(move, id);
    }
    return ok;
  }

  /* ================= POS EVENT (3 KARTU) ================= */
  // Tiap event: id (juga nama ikon effects.<id>), nama, keterangan di kartu, dan run(id) yang menjalankan efeknya.
  // run mengembalikan { text, pts } untuk ditampilkan di kartu, dan/atau { followUp: nomorPos } untuk memicu pos tujuan.
  // Menambah event baru: tambahkan satu objek di sini dan satu fungsi efek di bawahnya.
  const EVENTS = [
    { id: 'gempa_kecil', nama: 'Gempa Kecil', ket: 'Layar berguncang ' + EVENT.quakeMs / 1000 + ' detik. Tidak ada korban.', run: eventGempaKecil },
    { id: 'gempa_sedang', nama: 'Gempa Sedang', ket: 'Layar berguncang ' + EVENT.quakeMs / 1000 + ' detik. Kamu −' + EVENT.quakeMediumPoints + ' poin.', run: eventGempaSedang },
    { id: 'megathrust', nama: 'Megathrust', ket: 'Guncangan ' + EVENT.quakeBigMs / 1000 + ' detik! Semua pemain −' + EVENT.megathrustPoints + ' poin.', run: eventMegathrust },
    { id: 'pencuri', nama: 'Pencuri', ket: 'Mencuri ' + EVENT.stealPoints + ' poin dari pemain lain.', run: eventPencuri },
    { id: 'teleportasi', nama: 'Teleportasi', ket: 'Pindah acak ke pos lain dan memicu pos itu.', run: eventTeleportasi },
    { id: 'rinnegan', nama: 'Rinnegan', ket: 'Tarik pemain dalam ' + EVENT.rinneganRange + ' pos & ambil ' + EVENT.rinneganPoints + ' poin.', run: eventRinnegan },
    { id: 'pajak', nama: 'Pajak', ket: 'Kamu membayar pajak ' + EVENT.taxPoints + ' poin.', run: eventPajak },
    { id: 'rezeki', nama: 'Rezeki', ket: 'Dapat ' + EVENT.luckyPoints + ' poin dan kocok dadu lagi!', run: eventRezeki },
    { id: 'kemacetan', nama: 'Kemacetan', ket: 'Giliranmu berikutnya dilewati.', run: eventKemacetan },
    { id: 'sedekah_jariyah', nama: 'Sedekah Jariyah', ket: 'Pemain berpoin tertinggi memberi ' + EVENT.charityPoints + ' poin kepada pemain berpoin terendah.', run: eventSedekah },
    { id: 'krisis_kerusuhan', nama: 'Krisis dan Kerusuhan', ket: 'Layar berguncang ' + EVENT.quakeMs / 1000 + ' detik. Pemain berpoin tertinggi kehilangan ' + EVENT.crisisPoints + ' poin.', run: eventKrisis }
  ];

  /* ---- guncangan layar ---- */
  let quakeAnims = [];
  let quakeTimer = null;

  // Menggetarkan seluruh isi bingkai selama ms milidetik. Memakai properti translate (tidak mengganggu skala bingkai).
  function quake(ms) {
    return new Promise((resolve) => {
      sfx.quake(ms);
      const frame = document.getElementById('frame');
      const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const useTranslate = !!(window.CSS && CSS.supports && CSS.supports('translate', '1px 1px'));
      const steps = Math.max(2, Math.round(ms / 100));
      const frames = [];
      for (let i = 0; i <= steps; i++) {
        const k = i === steps ? 0 : 1 - i / steps;                      // guncangan makin lemah menjelang akhir
        const x = (i % 2 ? 1 : -1) * (EVENT.quakeShift * 0.5 + Math.random() * EVENT.quakeShift * 0.5) * k;
        const y = (Math.random() * 2 - 1) * EVENT.quakeShift * 0.5 * k;
        frames.push(useTranslate ? { translate: x + 'px ' + y + 'px' } : { transform: 'translate(' + x + 'px,' + y + 'px)' });
      }
      quakeAnims = calm ? [] : Array.from(frame.children).map((c) => c.animate(frames, { duration: ms, easing: 'linear' }));
      quakeTimer = setTimeout(() => { quakeTimer = null; quakeAnims = []; resolve(); }, ms);
    });
  }

  function stopQuake() {
    quakeAnims.forEach((a) => a.cancel());
    quakeAnims = [];
    if (quakeTimer) { clearTimeout(quakeTimer); quakeTimer = null; }
  }

  /* ---- jendela 3 kartu ---- */
  function openEvent() {
    el.evPick.hidden = false;
    document.body.classList.add('modal-open');
    el.evBox.focus();
  }

  function closeEvent() {
    el.evNext.onclick = null;
    el.evPick.hidden = true;
    document.body.classList.remove('modal-open');
  }

  // Menampilkan 3 kartu tertutup (letak event diacak tiap kali). Promise selesai dengan event milik kartu yang diklik.
  function pickEventCard() {
    return new Promise((resolve) => {
      const deck = shuffle(EVENTS).slice(0, EVENT.cards);   // 3 kartu diambil acak dari semua event
      el.evBadge.textContent = NAMES[state.turn] + (cur().com ? ' (Com)' : '') + ' · Pos Event';
      el.evHint.hidden = false;
      el.evResult.hidden = true;
      el.evNext.hidden = true;
      el.evCards.textContent = '';
      const btns = [];
      deck.forEach((ev, i) => {
        const b = mk('button', 'evc');
        b.type = 'button';
        b.setAttribute('aria-label', 'Kartu ' + (i + 1) + ', ketuk untuk membuka');
        const inner = mk('span', 'evc-inner');
        const back = mk('span', 'evc-face evc-back');
        back.appendChild(mk('b', 'evc-q', '?'));
        back.appendChild(mk('small', null, 'Kartu ' + (i + 1)));
        const front = mk('span', 'evc-face evc-front');
        const ico = mk('span', 'evc-ico');
        Assets.fill(ico, 'effects', ev.id);
        front.appendChild(ico);
        front.appendChild(mk('b', 'evc-name', ev.nama));
        front.appendChild(mk('small', null, ev.ket));
        inner.appendChild(back);
        inner.appendChild(front);
        b.appendChild(inner);
        b.addEventListener('click', () => {
          btns.forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('dim'); });
          b.classList.add('open');
          b.setAttribute('aria-label', 'Kartu ' + ev.nama);
          el.evHint.hidden = true;
          sfx.flip();
          resolve(ev);
        });
        el.evCards.appendChild(b);
        btns.push(b);
      });
      openEvent();
      el.evBox.classList.toggle('com-turn', !!cur().com);   // giliran com: kartu tidak bisa diketuk pemain
      if (cur().com) {                                      // com membuka satu kartu secara acak
        const run = state.run;
        const choice = btns[Math.floor(Math.random() * btns.length)];
        setTimeout(() => { if (run === state.run && choice.isConnected && !choice.disabled) choice.click(); }, COM.pickMs);
      }
    });
  }

  function showEventResult(text, pts) {
    el.evResult.className = 'feedback info';
    el.evResult.textContent = text;
    if (pts) {
      const small = document.createElement('small');
      small.textContent = pts;
      el.evResult.appendChild(small);
    }
    el.evResult.hidden = false;
  }

  function waitEvNext() {
    return new Promise((resolve) => {
      const run = state.run;
      const go = () => { el.evNext.onclick = null; resolve(); };
      el.evNext.hidden = false;
      el.evNext.onclick = go;
      if (cur().com) {
        setTimeout(() => { if (run === state.run && el.evNext.onclick === go) go(); }, COM.readMs + 400);
      } else {
        el.evNext.focus();
      }
    });
  }

  /* ---- efek tiap kartu ---- */
  // Gempa kecil: hanya guncangan, tidak ada korban
  async function eventGempaKecil() {
    await quake(EVENT.quakeMs);
    return { text: 'Gempa kecil mengguncang papan. Tidak ada korban.', pts: 'Poin tidak berubah' };
  }

  // Gempa sedang: guncangan, lalu pemain di pos event (yang membuka kartu) kehilangan poin
  async function eventGempaSedang() {
    await quake(EVENT.quakeMs);
    const loss = Math.min(EVENT.quakeMediumPoints, state.score);
    if (!loss) return { text: 'Gempa sedang mengguncang papan, tetapi ' + NAMES[state.turn] + ' tidak punya poin yang bisa hilang.', pts: 'Poin tidak berubah' };
    addScore(-loss);
    sfx.bad();
    return { text: 'Gempa sedang! ' + NAMES[state.turn] + ' terkena reruntuhan.', pts: '−' + loss + ' poin' + (loss < EVENT.quakeMediumPoints ? ' (hanya punya ' + loss + ' poin)' : '') };
  }

  // Megathrust: guncangan dan suara lebih lama, SEMUA pemain kehilangan poin
  async function eventMegathrust() {
    await quake(EVENT.quakeBigMs);
    const detail = [];
    state.players.forEach((p, i) => {
      const loss = Math.min(EVENT.megathrustPoints, p.score);
      if (loss) { changeScore(i, -loss); detail.push(p.name + ' −' + loss); }
    });
    sfx.bad();
    return { text: 'Megathrust! Gempa dahsyat mengguncang seluruh papan dan semua pemain terdampak.', pts: detail.length ? detail.join(' · ') : 'Poin tidak berubah (belum ada yang punya poin)' };
  }

  // Kemacetan: pemain yang membuka kartu melewati giliran berikutnya (dihitung di nextTurn)
  async function eventKemacetan() {
    cur().skip = 1;
    sfx.bad();
    render();
    return { text: 'Jalanan macet total! ' + NAMES[state.turn] + ' akan melewatkan giliran berikutnya.', pts: 'Giliran berikutnya dilewati' };
  }

  // Pemain dengan poin tertinggi / terendah (jika seri, dipilih acak di antara yang seri). exclude = indeks yang dilewati.
  function extremePlayer(highest, exclude) {
    const idx = state.players.map((p, i) => i).filter((i) => i !== exclude && !state.players[i].out);
    if (!idx.length) return -1;
    const best = idx.reduce((m, i) => (highest ? Math.max(m, state.players[i].score) : Math.min(m, state.players[i].score)), highest ? -Infinity : Infinity);
    const tied = idx.filter((i) => state.players[i].score === best);
    return tied[Math.floor(Math.random() * tied.length)];
  }

  // Sedekah Jariyah: pemain tertinggi memberi poin kepada pemain terendah (bukan pemain yang sama)
  async function eventSedekah() {
    const giver = extremePlayer(true, -1);
    const taker = giver === -1 ? -1 : extremePlayer(false, giver);
    if (giver === -1 || taker === -1) return { text: 'Tidak ada pemain lain yang bisa menerima sedekah. Poin tidak berubah.' };   // bermain sendiri
    const g = state.players[giver];
    const t = state.players[taker];
    const amount = Math.min(EVENT.charityPoints, g.score);
    if (!amount) { sfx.bad(); return { text: g.name + ' belum punya poin untuk disedekahkan.', pts: 'Poin tidak berubah' }; }
    changeScore(giver, -amount);
    changeScore(taker, amount);
    sfx.bonus();
    return {
      text: g.name + ' (poin tertinggi) bersedekah kepada ' + t.name + ' (poin terendah). Semoga berkah!',
      pts: g.name + ' −' + amount + ' · ' + t.name + ' +' + amount + (amount < EVENT.charityPoints ? ' (hanya punya ' + amount + ' poin)' : '')
    };
  }

  // Krisis dan Kerusuhan: layar berguncang, pemain berpoin tertinggi kehilangan poin (bisa dijarah pembuka kartu)
  async function eventKrisis() {
    await quake(EVENT.quakeMs);
    const vi = extremePlayer(true, -1);
    const v = state.players[vi];
    const loss = v ? Math.min(EVENT.crisisPoints, v.score) : 0;
    if (!loss) { sfx.bad(); return { text: 'Kerusuhan pecah, tetapi tidak ada poin yang bisa dijarah.', pts: 'Poin tidak berubah' }; }
    changeScore(vi, -loss);
    const me = state.turn;
    const looted = EVENT.crisisToOpener && vi !== me;
    if (looted) changeScore(me, loss);
    sfx.bad();
    return {
      text: looted ? 'Kerusuhan pecah! ' + NAMES[me] + ' menjarah ' + loss + ' poin dari ' + v.name + ', pemain berpoin tertinggi.'
        : 'Krisis dan kerusuhan melanda! ' + v.name + ', pemain berpoin tertinggi, kehilangan poin.',
      pts: v.name + ' −' + loss + (looted ? ' · ' + NAMES[me] + ' +' + loss : '') + (loss < EVENT.crisisPoints ? ' (hanya punya ' + loss + ' poin)' : '')
    };
  }

  async function eventPencuri() {
    const me = state.turn;
    const others = state.players.map((p, i) => i).filter((i) => i !== me && !state.players[i].out);
    if (!others.length) return { text: 'Tidak ada pemain lain yang bisa dicuri. Poinmu tidak berubah.' };   // bermain sendiri
    const vi = others[Math.floor(Math.random() * others.length)];                                        // korban dipilih acak
    const victim = state.players[vi];
    const amount = Math.min(EVENT.stealPoints, victim.score);                                            // tidak bisa mencuri lebih dari yang dimiliki
    if (!amount) { sfx.bad(); return { text: victim.name + ' tidak punya poin yang bisa dicuri.', pts: 'Poin tidak berubah' }; }
    changeScore(vi, -amount);
    changeScore(me, amount);
    sfx.steal();
    return {
      text: NAMES[me] + ' mencuri ' + amount + ' poin dari ' + victim.name + '!',
      pts: NAMES[me] + ' +' + amount + ' · ' + victim.name + ' −' + amount +
        (amount < EVENT.stealPoints ? ' (hanya punya ' + amount + ' poin)' : '')
    };
  }

  const daftarNama = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' dan ' + a[a.length - 1] : a[0]);

  // Rinnegan: pemain lain dalam jarak rinneganRange pos (ke depan atau ke belakang, papan berputar) ditarik 1 pos
  // ke arah pemain di pos event tanpa memicu pos yang dilewati; tiap yang ditarik kehilangan poin untuk pemain ini.
  async function eventRinnegan(id) {
    const me = state.turn;
    const myPos = state.pos;
    const range = EVENT.rinneganRange;
    const pulls = [];
    state.players.forEach((p, i) => {
      if (i === me || p.out) return;
      const ahead = (p.pos - myPos + BOARD) % BOARD;     // jarak jika pemain itu ada di depan
      const behind = (myPos - p.pos + BOARD) % BOARD;    // jarak jika pemain itu ada di belakang
      if (ahead >= 1 && ahead <= range) pulls.push({ i: i, dir: -1 });          // di depan: ditarik mundur 1 pos
      else if (behind >= 1 && behind <= range) pulls.push({ i: i, dir: 1 });    // di belakang: ditarik maju 1 pos
    });
    if (!pulls.length) return { text: 'Tidak ada pemain lain dalam jarak ' + range + ' pos. Efek Rinnegan tidak berjalan.', pts: 'Poin tidak berubah' };

    closeEvent();                                   // kartu ditutup supaya tarikan terlihat di papan
    camera.setFollow(false);                        // kamera melihat seluruh papan
    await sleep(650);
    if (id !== state.run) return {};
    sfx.pull();
    let total = 0;
    const names = [];
    const detail = [];
    pulls.forEach((pl) => {
      const p = state.players[pl.i];
      p.pos = (p.pos + pl.dir + BOARD) % BOARD;     // hanya berpindah posisi, pos tujuan tidak dipicu
      const amount = Math.min(EVENT.rinneganPoints, p.score);
      if (amount) { changeScore(pl.i, -amount); changeScore(me, amount); total += amount; detail.push(p.name + ' −' + amount); }
      names.push(p.name);
    });
    render();
    await sleep(900);
    if (id !== state.run) return {};
    return {
      reopen: true,
      text: 'Rinnegan menarik ' + daftarNama(names) + ' sejauh 1 pos ke arah ' + NAMES[me] + '!',
      pts: total ? NAMES[me] + ' +' + total + ' · ' + detail.join(', ') : 'Poin tidak berubah (yang ditarik tidak punya poin)'
    };
  }

  async function eventPajak() {
    const loss = Math.min(EVENT.taxPoints, state.score);        // skor tidak bisa di bawah 0
    if (!loss) return { text: 'Kamu tidak punya poin, jadi tidak ada pajak yang harus dibayar.', pts: 'Poin tidak berubah' };
    addScore(-loss);
    sfx.bad();
    return { text: NAMES[state.turn] + ' harus membayar pajak ' + loss + ' poin.', pts: '−' + loss + ' poin' + (loss < EVENT.taxPoints ? ' (hanya punya ' + loss + ' poin)' : '') };
  }

  async function eventRezeki() {
    addScore(EVENT.luckyPoints);
    extraRoll = true;                                            // giliran tidak berpindah; rollDice membaca bendera ini
    sfx.good();
    return { text: 'Rezeki nomplok! Kamu mendapat tambahan poin dan boleh mengocok dadu sekali lagi.', pts: '+' + EVENT.luckyPoints + ' poin' };
  }

  // Semua pos kecuali START dan pos event (pos asal adalah pos event, jadi otomatis tidak terpilih)
  function teleportTargets() {
    const t = [];
    LAYOUT.forEach((type, i) => { if (type !== 'start' && type !== 'event') t.push(i); });
    return t;
  }

  async function eventTeleportasi(id) {
    const list = teleportTargets();
    const to = list[Math.floor(Math.random() * list.length)];
    closeEvent();                                   // kartu ditutup supaya perpindahan terlihat di papan
    await sleep(250);
    if (id !== state.run) return {};
    sfx.warp();
    const pc = ui[state.turn].piece;
    pc.classList.add('snap');                       // langsung pindah, bukan meluncur
    state.pos = to;
    render();
    void pc.offsetWidth;
    pc.classList.remove('snap', 'warp');
    void pc.offsetWidth;
    pc.classList.add('warp');
    setMessage('🌀 ' + NAMES[state.turn] + ' berteleportasi ke pos ' + to + ' (' + TITLES[LAYOUT[to]] + ').');
    await sleep(900);
    pc.classList.remove('warp');
    return { followUp: to };                        // pos tujuan dipicu: soal muncul, pos khusus memberi fakta, dst.
  }

  async function handleEvent(id) {
    const ev = await pickEventCard();               // pemain mengklik salah satu dari 3 kartu
    if (id !== state.run) return;
    await sleep(EVENT.revealDelay);                 // efek terjadi 0,5 detik setelah kartu dibuka
    if (id !== state.run) return;
    const res = (await ev.run(id)) || {};
    if (id !== state.run) return;
    if (res.text) {
      if (hasWon(cur())) res.text += ' Target ' + targetPoints() + ' poin tercapai!';
      if (res.reopen) openEvent();                  // efek yang terlihat di papan menutup kartu dulu; ringkasannya dibuka lagi
      showEventResult(res.text, res.pts);
      await waitEvNext();
      if (id !== state.run) return;
    }
    closeEvent();
    if (res.followUp != null) await handleCell(LAYOUT[res.followUp], id);
  }

  /* ================= POS FREE WILL ================= */
  // Pemain bebas memilih jenis pos yang diambil (mudah, sedang, sulit, event, khusus) tanpa berpindah dari pos Free Will.
  // Aturan jenis yang dipilih sama persis dengan pos aslinya (termasuk mundur jika jawaban salah).
  const FREE_CHOICES = [
    { type: 'mudah', nama: 'Soal mudah', ket: '+' + RULES.mudah.gain + ' / −' + RULES.mudah.loss + ' poin' },
    { type: 'sedang', nama: 'Soal sedang', ket: '+' + RULES.sedang.gain + ' / −' + RULES.sedang.loss + ' poin' },
    { type: 'sulit', nama: 'Soal sulit', ket: '+' + RULES.sulit.gain + ' / −' + RULES.sulit.loss + ' poin' },
    { type: 'event', nama: 'Pos event', ket: 'Pilih 1 dari 3 kartu' },
    { type: 'khusus', nama: 'Pos khusus', ket: '+' + FACT_POINTS + ' poin dan fakta' }
  ];

  function pickFreeWill() {
    return new Promise((resolve) => {
      const com = !!cur().com;
      el.fwBadge.textContent = NAMES[state.turn] + (com ? ' (Com)' : '') + ' · Free Will';
      el.fwBtns.textContent = '';
      const btns = [];
      FREE_CHOICES.forEach((o) => {
        const b = mk('button', 'fw-btn t-' + o.type);
        b.type = 'button';
        b.appendChild(mk('b', null, o.nama));
        b.appendChild(mk('small', null, o.ket));
        b.addEventListener('click', () => {
          btns.forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('dim'); });
          b.classList.add('on');
          sfx.select();
          resolve(o.type);
        });
        el.fwBtns.appendChild(b);
        btns.push(b);
      });
      el.freePick.hidden = false;
      document.body.classList.add('modal-open');
      el.freeBox.classList.toggle('com-turn', com);   // giliran com: pilihan tidak bisa diketuk pemain
      el.freeBox.focus();
      if (com) {                                      // com lebih suka soal sulit (poin terbesar)
        const run = state.run;
        const r = Math.random();
        const t = r < 0.55 ? 'sulit' : r < 0.75 ? 'sedang' : r < 0.9 ? 'event' : 'khusus';
        const choice = btns[FREE_CHOICES.findIndex((o) => o.type === t)];
        setTimeout(() => { if (run === state.run && choice.isConnected && !choice.disabled) choice.click(); }, COM.pickMs);
      }
    });
  }

  async function handleFreeWill(id) {
    sfx.bonus();
    const choice = await pickFreeWill();
    if (id !== state.run) return;
    await sleep(450);                               // pilihan sempat terlihat sebelum jendela ditutup
    if (id !== state.run) return;
    el.freePick.hidden = true;
    el.freeBox.classList.remove('com-turn');
    document.body.classList.remove('modal-open');
    await sleep(150);
    if (id !== state.run) return;
    await handleCell(choice, id);                   // bidak tetap di pos Free Will
  }

  /* ================= MODE TRUE EXPLORER: BELI / AMBIL ALIH POS ================= */
  // Alur saat bidak berhenti di pos soal yang bisa dimiliki:
  // 1) pos milik pemain lain  -> bayar sewa kepada pemiliknya
  // 2) soal tetap muncul seperti biasa
  // 3) jawaban benar dan poin cukup -> boleh membeli pos kosong atau mengambil alih pos milik pemain lain
  // Tiap bidak berhenti di pos yang SUDAH dibeli (siapa pun pemainnya): sewa +upgradeRent dan ambil alih +upgradeTakeover,
  // muncul rumah; setelah hotelAt kali berubah jadi hotel. Kenaikan dihitung setelah urusan pos itu selesai.
  async function handleProperty(type, id) {
    const pos = state.pos;
    const landedOwned = !!propOf(pos) && owners[pos] !== -1;
    await handlePropertyCore(type, id);
    if (id !== state.run || !landedOwned || state.players.some(hasWon)) return;
    upgradeProperty(pos);
    await sleep(500);
  }

  function upgradeProperty(pos) {
    if (levels[pos] >= PROPERTY.hotelAt) return;
    levels[pos]++;
    paintOwners();
    cells[pos].classList.add('bought');
    setTimeout(() => cells[pos].classList.remove('bought'), 1000);
    const t = tierOf(pos);
    const hotel = levels[pos] >= PROPERTY.hotelAt;
    sfx.bonus();
    skillNote(state.turn, 'investasi', (hotel ? '🏨 Pos ' + pos + ' menjadi hotel!' : '🏠 Pos ' + pos + ' naik level ' + levels[pos] + '.') + ' Sewa ' + t.rent + ' · ambil alih ' + t.takeover + ' poin');
  }

  async function handlePropertyCore(type, id) {
    const pos = state.pos;
    const tier = tierOf(pos);
    if (!tier) return handleQuestion(type, id);        // mis. pos Free Will: bukan pos yang bisa dimiliki
    const me = state.turn;
    const owner = owners[pos];

    if (owner !== -1 && owner !== me && !skillLincah(me)) {   // 1) sewa (Si Lincah bisa membebaskannya)
      const papa = cur().skill === 'anakpapa' && Math.random() < SKILL.papaChance;   // Si Anak Papa: sewa dibayarin papa
      const pay = papa ? tier.rent : Math.min(tier.rent, state.score);    // tidak bisa membayar lebih dari poin yang dimiliki
      if (!papa) changeScore(me, -pay);
      changeScore(owner, pay);
      if (papa) { sfx.bonus(); skillNote(me, 'anakpapa', 'Si Anak Papa: sewa ' + pay + ' poin dibayarin papa ' + NAMES[me] + '!'); } else sfx.bad();
      showInfo('prop', 'Sewa Pos', 'Pos ' + pos + ' milik ' + NAMES[owner],
        papa ? 'Papa ' + NAMES[me] + ' membayar sewa ' + pay + ' poin kepada ' + NAMES[owner] + '. Poin ' + NAMES[me] + ' tidak berkurang.'
          : NAMES[me] + ' membayar sewa ' + pay + ' poin kepada ' + NAMES[owner] + '.' + (pay < tier.rent ? ' (hanya punya ' + pay + ' poin)' : ''),
        ['effects', 'pajak']);
      await waitNext();
      if (id !== state.run) return;
      closeModal();
      if (state.players.some(hasWon)) return;          // pemilik mencapai target dari sewa: permainan selesai
      await sleep(200);
    }

    // Si Mafia: undian peluang beli gratis (hanya untuk pos kosong); baru dihitung terpakai jika benar-benar membeli
    const mafia = owners[pos] === -1 && cur().skill === 'mafia' && Math.random() < SKILL.mafiaChance;
    // harga untuk pemain yang sedang giliran: Si Kikir melipatgandakan biaya ambil alih
    const priceFor = (prev) => (prev === -1 ? (mafia ? 0 : tier.price) : tier.takeover * skillKikirMul(prev, me));

    // petunjuk di kartu jawaban benar: apakah pos ini bisa dibeli / diambil alih
    const hint = () => {
      if (owners[pos] === me) return '';
      const take = owners[pos] !== -1;
      const price = priceFor(owners[pos]);
      if (mafia) return 'Si Mafia aktif! Kamu bisa membeli pos ini GRATIS.';
      const verb = take ? 'mengambil alih' : 'membeli';
      return state.score >= price ? 'Kamu bisa ' + verb + ' pos ini seharga ' + price + ' poin.' : 'Poinmu belum cukup untuk ' + verb + ' pos ini (butuh ' + price + ' poin).';
    };
    const ok = await handleQuestion(type, id, hint);   // 2) soal
    if (id !== state.run || ok !== true) return;       // salah / waktu habis: tidak ada pembelian
    if (state.players.some(hasWon)) return;            // target tercapai: permainan selesai

    const prev = owners[pos];                          // 3) beli / ambil alih
    if (prev === me) return;                           // pos sendiri: tidak ada yang bisa dibeli
    const take = prev !== -1;
    const kikirX = take ? skillKikirMul(prev, me) : 1;
    const price = priceFor(prev);
    if (state.score < price) return;
    await sleep(200);
    if (id !== state.run) return;
    const yes = await offerProperty(pos, tier, prev, price, mafia ? 'Si Mafia: GRATIS!' : (kikirX > 1 ? 'Si Kikir: biaya ' + kikirX + 'x lipat' : ''));
    if (id !== state.run) return;
    await sleep(350);                                  // pilihan sempat terlihat sebelum jendela ditutup
    if (id !== state.run) return;
    el.propPick.hidden = true;
    el.propBox.classList.remove('com-turn');
    document.body.classList.remove('modal-open');
    if (!yes) return;
    changeScore(me, -price);
    if (take && PROPERTY.takeoverToOwner) changeScore(prev, price);
    owners[pos] = me;
    if (mafia) skillSpend(me, 'mafia', 'Si Mafia: ' + NAMES[me] + ' membeli Pos ' + pos + ' gratis!');
    if (kikirX > 1) skillSpend(prev, 'kikir', 'Si Kikir: ' + NAMES[prev] + ' menerima ' + price + ' poin (' + kikirX + 'x lipat) dari ' + NAMES[me]);
    paintOwners();
    cells[pos].classList.add('bought');
    setTimeout(() => cells[pos].classList.remove('bought'), 1000);
    sfx.bonus();
    setMessage((take ? '🔄 ' + NAMES[me] + ' mengambil alih Pos ' + pos + ' dari ' + NAMES[prev] + '!' : '🏠 ' + NAMES[me] + ' membeli Pos ' + pos + '!'));
    await sleep(600);
  }

  // Jendela tawaran: Promise berisi true (beli / ambil alih) atau false (lewati). Giliran com memutuskan sendiri.
  function offerProperty(pos, tier, prev, price, note) {
    return new Promise((resolve) => {
      const me = state.turn;
      const com = !!cur().com;
      const take = prev !== -1;
      el.propBadge.textContent = NAMES[me] + (com ? ' (Com)' : '') + ' · ' + (take ? 'Ambil Alih' : 'Beli Pos');
      el.propTitle.textContent = (take ? 'Ambil alih Pos ' : 'Beli Pos ') + pos + '?';
      el.propInfo.textContent = '';
      const row = (label, value, cls) => {
        const d = mk('div', cls || null);
        d.appendChild(mk('span', null, label));
        d.appendChild(mk('b', null, value));
        el.propInfo.appendChild(d);
      };
      row('Poinmu sekarang', state.score + ' poin');
      row(take ? 'Biaya ambil alih' + (PROPERTY.takeoverToOwner ? ' (dibayar ke ' + NAMES[prev] + ')' : '') : 'Harga beli', price + ' poin', 'hl');
      if (note) row('Efek skill', note, 'hl');
      row('Sewa jika pemain lain singgah', tier.rent + ' poin');
      el.propBtns.textContent = '';
      const yes = mk('button', 'btn primary big', (take ? 'Ambil Alih' : 'Beli') + ' · ' + (price ? price + ' poin' : 'GRATIS'));
      const no = mk('button', 'btn ghost big', 'Lewati');
      yes.type = 'button';
      no.type = 'button';
      const choose = (v) => {
        yes.disabled = true;
        no.disabled = true;
        (v ? no : yes).classList.add('dim');
        sfx.select();
        resolve(v);
      };
      yes.addEventListener('click', () => choose(true));
      no.addEventListener('click', () => choose(false));
      el.propBtns.appendChild(yes);
      el.propBtns.appendChild(no);
      el.propPick.hidden = false;
      document.body.classList.add('modal-open');
      el.propBox.classList.toggle('com-turn', com);    // giliran com: tombol tidak bisa diketuk pemain
      el.propBox.focus();
      if (com) {
        const run = state.run;
        const want = Math.random() < (take ? PROPERTY.comTakeover : PROPERTY.comBuy);
        setTimeout(() => { if (run === state.run && yes.isConnected && !yes.disabled) (want ? yes : no).click(); }, COM.pickMs);
      }
    });
  }

  async function handleCell(type, id) {
    if (type === 'freewill') return handleFreeWill(id);
    if (RULES[type]) return isEx() ? handleProperty(type, id) : handleQuestion(type, id);

    if (type === 'event') return handleEvent(id);

    if (type === 'khusus') {
      addScore(FACT_POINTS);
      sfx.bonus();
      showInfo('khusus', 'Pos Khusus', 'Tahukah kamu?',
        nextFact() + ' (+' + FACT_POINTS + ' poin)' + (hasWon(cur()) ? ' Target ' + targetPoints() + ' poin tercapai!' : ''));
      await waitNext();
      if (id !== state.run) return;
      closeModal();
    }
  }

  // Menentukan pemain berikutnya. Pemain yang tertahan macet (skip > 0) dilewati dan hitungannya berkurang.
  // Mengembalikan nama pemain yang dilewati.
  function nextTurn() {
    const skipped = [];
    const n = state.players.length;
    let t = state.turn;
    for (;;) {
      t = (t + 1) % n;
      const p = state.players[t];
      if (p.out) continue;
      if (p.skip > 0) { p.skip--; skipped.push(p.name); } else break;
    }
    state.turn = t;
    return skipped;
  }

  const comPaused = () => document.hidden || document.documentElement.classList.contains('tegak');

  // Giliran com: kocok dadu otomatis (tombol dadu dikunci supaya tidak bisa ditekan pemain)
  function autoPlay() {
    if (!cur().com || state.busy || el.gameView.hidden || !el.win.hidden) return;
    const id = state.run;
    el.rollBtn.disabled = true;
    const attempt = () => {
      if (id !== state.run || state.busy || !cur().com || el.gameView.hidden) return;
      if (comPaused()) { setTimeout(attempt, 500); return; }
      rollDice(true);
    };
    setTimeout(attempt, COM.rollMs);
  }

  async function rollDice(auto) {
    if (state.busy || (cur().com && auto !== true)) return;
    const id = state.run;
    state.busy = true;
    el.rollBtn.disabled = true;
    bgm.start();                   // pengaman: tidak berpengaruh jika musik sudah berjalan
    skillFirstRoll();              // Si Privilese: poin saat roll pertama
    setMessage('Dadu berputar…');

    const v = await animateDice(id);
    if (!v || id !== state.run) return;
    el.diceText.textContent = v;
    setMessage(NAMES[state.turn] + ': dadu menunjukkan ' + v + '. Bidak maju ' + v + ' langkah.');
    camera.setFollow(true);        // kamera zoom mendekat ke bidak yang akan jalan
    await sleep(450);
    const startPos = state.pos;
    await moveSteps(v, id);
    if (id !== state.run) return;
    skillThief(startPos, v);       // Si Pencuri: lawan yang dilewati
    const landedOwner = isEx() ? owners[state.pos] : -1;     // pemilik pos tempat bidak berhenti (untuk Si Anak Ghoib)
    if (winnerIndex() === -1) await handleCell(LAYOUT[state.pos], id);   // jika skill sudah membuat ada yang mencapai target, soal tidak perlu muncul
    if (id !== state.run) return;
    if (landedOwner !== -1 && landedOwner !== state.turn && winnerIndex() === -1) await skillGhoib(id);   // Si Anak Ghoib: teleportasi
    if (id !== state.run) return;
    const champ = winnerIndex();
    if (champ !== -1) {            // target tercapai: jendela permainan berakhir muncul 0,5 detik setelah klik Lanjut
      await sleep(500);
      if (id !== state.run) return;
      showWin(champ);
      return;
    }

    camera.setFollow(false);       // giliran selesai: kamera kembali melihat seluruh papan
    if (isSurv() && !watching && !humanAlive()) {   // semua pemain manusia gugur, tinggal Com
      render();
      const watch = await askConfirm('Semua pemain manusia sudah gugur dan tinggal Com yang bertahan. Mau melihat jalannya permainan sampai selesai, atau dihentikan?', 'Lihat permainan', 'Hentikan');
      if (id !== state.run) return;
      if (!watch) { clearSave(); goHome(); return; }
      watching = true;
    }
    const again = extraRoll && !cur().out;       // kartu Rezeki: pemain yang sama mengocok lagi
    extraRoll = false;
    const prevTurn = state.turn;
    const skipped = again ? [] : nextTurn();
    let inflated = false;
    if (!again && state.turn <= prevTurn) {     // giliran kembali ke awal = satu putaran selesai (semua mode)
      roundNo++;
      if (isSurv() && roundNo % SURVIVOR_INFLATE_EVERY === 0) {
        costMul *= SURVIVOR_INFLATE_MUL;
        inflated = true;
        paintOwners();
        sfx.bonus();
        skillNote(-1, 'investasi', '📈 Investasi berhasil! Semua harga sewa dan ambil alih dikali ' + SURVIVOR_INFLATE_MUL + ' (sekarang ×' + costMul + ')');
      }
    }
    render();
    saveGame();                    // giliran selesai: posisi, skor, dan giliran tersimpan
    state.busy = false;
    el.rollBtn.disabled = !!cur().com || watching;
    const prompt = cur().com ? ' (Com) sedang bermain…' : '. Kocok dadu!';
    let msg = again ? '🍀 ' + NAMES[state.turn] + ' mendapat kesempatan kocok dadu lagi!' : 'Giliran ' + NAMES[state.turn] + prompt;
    if (inflated) msg = '📈 Putaran ' + roundNo + ' selesai: sewa dan ambil alih dikali ' + SURVIVOR_INFLATE_MUL + '! ' + msg;
    if (skipped.length) msg = '🚧 ' + daftarNama(skipped) + ' terjebak macet dan melewatkan giliran. ' + msg;
    setMessage(msg);
    autoPlay();
  }

  function showWin(w) {
    if (w == null) w = state.turn;
    camera.setFollow(false);
    clearSave();
    bgm.stop();
    sfx.win();
    setMessage(isSurv() ? '🏆 ' + NAMES[w] + ' bertahan sampai akhir!' : NAMES[w] + ' mencapai ' + targetPoints() + ' poin!');
    el.winText.textContent = isSurv() ? NAMES[w] + ' menjadi satu-satunya pemain yang bertahan dan memenangkan mode Survivor.' : NAMES[w] + ' lebih dulu mencapai ' + targetPoints() + ' poin dan memenangkan ' + JOURNEYS[journey].nama + '.';
    const rows = [['Skor akhir', 'score'], ['Soal dijawab', 'answered'], ['Jawaban benar', 'correct'], ['Jawaban salah', 'wrong']];
    if (isEx()) rows.push(['Pos dimiliki', (p, i) => owners.filter((o) => o === i).length]);
    el.winResult.textContent = '';
    const head = el.winResult.insertRow();
    head.appendChild(document.createElement('th'));
    state.players.forEach((p, i) => {
      const th = document.createElement('th');
      th.textContent = p.name;   // textContent: nama buatan pemain aman dari HTML
      if (i === w) th.className = 'winner';
      head.appendChild(th);
    });
    rows.forEach((r) => {
      const tr = el.winResult.insertRow();
      tr.insertCell().textContent = r[0];
      state.players.forEach((p, i) => { tr.insertCell().textContent = typeof r[1] === 'function' ? r[1](p, i) : p[r[1]]; });
    });
    el.win.hidden = false;
    document.body.classList.add('modal-open');
    el.againBtn.focus();
  }

  // reset()       -> permainan baru
  // reset(saved)  -> lanjutkan dari data hasil loadGame()
  function reset(saved) {
    state.run++;
    el.skillFeed.textContent = '';
    camera.setFollow(false);
    state.players = saved ? saved.players : config.players.map((p) => newPlayer(p.name, p.char, p.com));
    owners = saved ? saved.owners.slice() : Array.from({ length: BOARD }, () => -1);   // pos baru belum dimiliki siapa pun
    levels = saved ? saved.levels.slice() : Array.from({ length: BOARD }, () => 0);
    NAMES.length = 0;
    state.players.forEach((p) => NAMES.push(p.name));
    state.players.forEach((p) => { if (!saved && isSurv()) { p.score = SURVIVOR_START; p.out = false; } });   // Survivor: semua mulai dengan 50 poin
    watching = false;
    costMul = saved ? saved.costMul : 1;
    roundNo = saved ? saved.roundNo : 0;
    state.turn = saved ? saved.turn : 0;
    if (saved && isSurv() && !humanAlive()) watching = true;
    extraRoll = false;
    state.busy = false;
    el.rollBtn.disabled = !!cur().com || watching;
    el.dice.classList.remove('rolling');
    el.diceText.textContent = '-';
    el.nextBtn.onclick = null;
    el.win.hidden = true;
    closeModal();
    bgm.start((MAPS[mapKey] || {}).bgm || 'game');   // lagu sesuai map, mulai saat permainan dimulai (Mulai Main / Lanjutkan / Main Lagi)
    showFace(1);
    // bidak langsung diletakkan di posisinya (tanpa meluncur dari pojok)
    ui.forEach((u) => u.piece.classList.add('snap'));
    render();
    paintOwners();
    void el.board.offsetWidth;
    ui.forEach((u) => u.piece.classList.remove('snap'));
    if (saved) {
      setMessage('Permainan dilanjutkan. Giliran ' + NAMES[state.turn] + (cur().com ? ' (Com).' : '. Kocok dadu!'));
    } else {
      clearSave();
      setMessage(NAMES[0] + ' mulai! Tekan "Kocok Dadu".');
    }
    if (!saved && isEx()) { startSkillPick(state.run); return; }   // True Explorer: pilih skill dulu
    autoPlay();
  }

  /* ================= SKILL PEMAIN (True Explorer) ================= */
  // Label skill di kartu pemain
  function paintSkill(i) {
    const u = ui[i];
    const s = SKILLS[state.players[i].skill];
    u.sk.hidden = !s;
    if (!s) { u.skShown = null; return; }
    if (u.skShown !== s.id) {
      Assets.fill(u.skIco, 'effects', 'skill_' + s.id);
      u.skName.textContent = s.nama;
      u.sk.title = s.nama + ': ' + s.ket;
      u.skShown = s.id;
    }
  }

  // Notifikasi kecil (kiri atas, di bawah kartu pemain 1). Tidak menghentikan permainan dan tidak perlu diklik.
  function skillNote(i, skillId, text) {
    const n = mk('div', 'skill-note');
    const ico = mk('span', 'sn-ico');
    Assets.fill(ico, 'effects', skillId === 'investasi' ? 'investasi' : 'skill_' + skillId);
    n.appendChild(ico);
    n.appendChild(mk('span', null, text));
    el.skillFeed.style.top = (el.playersBox.offsetHeight + 8) + 'px';
    el.skillFeed.appendChild(n);
    while (el.skillFeed.children.length > 4) el.skillFeed.firstChild.remove();
    setTimeout(() => n.classList.add('out'), SKILL.noteMs);
    setTimeout(() => n.remove(), SKILL.noteMs + 400);
    const chip = ui[i] && ui[i].sk;
    if (chip) { chip.classList.remove('fire'); void chip.offsetWidth; chip.classList.add('fire'); }
  }

  // Si Privilese: poin saat pertama kali pemain itu mengocok dadu (sekali per permainan)
  function skillFirstRoll() {
    const p = cur();
    if (p.skill === 'orangbaek' && !p.priv) {          // Si Orang Baek: pemain lain mendapat poin
      p.priv = true;
      state.players.forEach((q, i) => { if (i !== state.turn && !q.out) changeScore(i, SKILL.baekPoints); });
      sfx.bonus();
      skillNote(state.turn, 'orangbaek', 'Si Orang Baek: ' + p.name + ' membagi +' + SKILL.baekPoints + ' poin ke semua pemain lain');
      return;
    }
    if (p.skill !== 'privilese' || p.priv) return;
    p.priv = true;
    addScore(SKILL.privilegePoints);
    sfx.bonus();
    skillNote(state.turn, 'privilese', 'Si Privilese: ' + p.name + ' +' + SKILL.privilegePoints + ' poin');
  }

  // Si Pengusaha: dipanggil tiap langkah maju yang berakhir di START (melewati / menginjak START)
  function skillPassStart() {
    const p = cur();
    if (p.skill !== 'pengusaha') return;
    addScore(SKILL.businessPoints);
    sfx.bonus();
    skillNote(state.turn, 'pengusaha', 'Si Pengusaha: ' + p.name + ' melewati START, +' + SKILL.businessPoints + ' poin');
  }

  // Mencatat 1x pemakaian efek skill bertuan terbatas (Si Mafia, Si Kikir). Jika jatah habis, skill hilang dari pemain.
  function skillSpend(i, skillId, text) {
    const p = state.players[i];
    if (!p || p.skill !== skillId) return;
    p.used = (p.used || 0) + 1;
    sfx.bonus();
    const left = SKILLS[skillId].max - p.used;
    skillNote(i, skillId, text + (left > 0 ? ' (sisa ' + left + 'x)' : ' (jatah habis, skill hilang)'));
    if (left <= 0) { p.skill = null; p.used = 0; paintSkill(i); }
  }

  // Si Lincah: true jika sewa pos lawan digratiskan kali ini (peluang, tanpa batas jumlah)
  function skillLincah(i) {
    const p = state.players[i];
    if (p.skill !== 'lincah' || Math.random() >= SKILL.lincahChance) return false;
    sfx.bonus();
    skillNote(i, 'lincah', 'Si Lincah: ' + p.name + ' bebas sewa!');
    return true;
  }

  // Si Kikir: pengali biaya ambil alih bagi pemain "me" atas pos milik "owner" (1 jika tidak berlaku)
  function skillKikirMul(owner, me) {
    const p = state.players[owner];
    return owner !== me && p && p.skill === 'kikir' ? SKILL.kikirMultiplier : 1;
  }

  // Si Teliti: hitung jawaban benar beruntun. Mengembalikan teks tambahan untuk kartu jawaban (kosong jika tidak ada bonus).
  function skillTeliti(correct) {
    const p = cur();
    if (p.skill !== 'teliti') return '';
    if (!correct) { p.streak = 0; return ''; }
    p.streak = (p.streak || 0) + 1;
    if (p.streak < SKILL.telitiStreak) return '';
    p.streak = 0;
    addScore(SKILL.telitiPoints);
    skillNote(state.turn, 'teliti', 'Si Teliti: ' + p.name + ' benar ' + SKILL.telitiStreak + 'x beruntun, +' + SKILL.telitiPoints + ' poin');
    return ' 🔍 Si Teliti: ' + SKILL.telitiStreak + 'x benar beruntun, bonus +' + SKILL.telitiPoints + ' poin!';
  }

  // Si Anak Ghoib: setelah singgah di pos lawan (sewa / ambil alih selesai), peluang teleportasi ke pos Free Will.
  // Setelah tiba, pos Free Will diproses seperti biasa (pemain memilih jenis pos).
  async function skillGhoib(id) {
    const p = cur();
    const fw = LAYOUT.indexOf('freewill');
    if (p.skill !== 'anakghoib' || fw < 0 || p.pos === fw || Math.random() >= SKILL.ghoibChance) return;
    skillNote(state.turn, 'anakghoib', 'Si Anak Ghoib: ' + p.name + ' menghilang ke pos Free Will!');
    sfx.bonus();
    setMessage('👻 ' + p.name + ' teleportasi ke pos Free Will!');
    await sleep(500);
    if (id !== state.run) return;
    p.pos = fw;
    render();
    await sleep(600);
    if (id !== state.run) return;
    await handleCell('freewill', id);
  }

  // Si Pencuri: setelah bidak selesai maju v langkah dari startPos. Satu undian peluang per kocokan; jika aktif,
  // SEMUA lawan yang dilewati diambil poinnya (mis. melewati 2 lawan = 2 lawan diambil).
  function skillThief(startPos, v) {
    const me = state.turn;
    const p = state.players[me];
    if (p.skill !== 'pencuri') return;
    const passed = [];
    state.players.forEach((q, i) => {
      if (i === me || q.out) return;
      const off = (q.pos - startPos + BOARD) % BOARD;       // jarak lawan di depan bidak (papan berputar)
      if (off >= 1 && (SKILL.thiefIncludeLanding ? off <= v : off < v)) passed.push(i);
    });
    if (!passed.length || Math.random() >= SKILL.thiefChance) return;
    let total = 0;
    const detail = [];
    passed.forEach((i) => {
      const amount = Math.min(SKILL.thiefPoints, state.players[i].score);   // tidak bisa mencuri lebih dari yang dimiliki
      if (!amount) return;
      changeScore(i, -amount);
      changeScore(me, amount);
      total += amount;
      detail.push(state.players[i].name + ' −' + amount);
    });
    sfx.steal();
    skillNote(me, 'pencuri', total
      ? 'Si Pencuri: ' + p.name + ' +' + total + ' poin (' + detail.join(', ') + ')'
      : 'Si Pencuri aktif, tetapi lawan yang dilewati tidak punya poin');
  }

  // Jendela pilih skill: Promise berisi skill yang dipilih pemain ke-i. Kartu dibuka satu per satu, urutan acak.
  function pickSkill(i, run) {
    return new Promise((resolve) => {
      const p = state.players[i];
      const deck = shuffle(Object.keys(SKILLS)).slice(0, SKILL.cards).map((k) => SKILLS[k]);
      el.skBadge.textContent = p.name + (p.com ? ' (Com)' : '') + ' · Pilih Skill';
      el.skHint.hidden = false;
      el.skResult.hidden = true;
      const taken = state.players.filter((q) => q.skill).map((q) => q.name + ': ' + SKILLS[q.skill].emoji + ' ' + SKILLS[q.skill].nama);
      el.skTaken.textContent = taken.length ? 'Sudah memilih: ' + taken.join(' · ') : '';
      el.skCards.textContent = '';
      const btns = [];
      deck.forEach((s, n) => {
        const b = mk('button', 'evc');
        b.type = 'button';
        b.setAttribute('aria-label', 'Kartu ' + (n + 1) + ', ketuk untuk membuka');
        const inner = mk('span', 'evc-inner');
        const back = mk('span', 'evc-face evc-back');
        back.appendChild(mk('b', 'evc-q', '?'));
        back.appendChild(mk('small', null, 'Kartu ' + (n + 1)));
        const front = mk('span', 'evc-face evc-front');
        const ico = mk('span', 'evc-ico');
        Assets.fill(ico, 'effects', 'skill_' + s.id);
        front.appendChild(ico);
        front.appendChild(mk('b', 'evc-name', s.nama));
        front.appendChild(mk('small', null, s.ket));
        inner.appendChild(back);
        inner.appendChild(front);
        b.appendChild(inner);
        b.addEventListener('click', () => {
          btns.forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('dim'); });
          b.classList.add('open');
          b.setAttribute('aria-label', 'Kartu ' + s.nama);
          el.skHint.hidden = true;
          sfx.flip();
          el.skResult.textContent = p.name + ' mendapat skill ' + s.nama + '. ' + s.ket;
          el.skResult.hidden = false;
          setTimeout(() => resolve(s), SKILL.revealMs);
        });
        el.skCards.appendChild(b);
        btns.push(b);
      });
      el.skillPick.hidden = false;
      document.body.classList.add('modal-open');
      el.skillBox.classList.toggle('com-turn', !!p.com);   // giliran com: kartu tidak bisa diketuk pemain
      el.skillBox.focus();
      if (p.com) {                                          // com membuka satu kartu secara acak
        const choice = btns[Math.floor(Math.random() * btns.length)];
        setTimeout(() => { if (run === state.run && choice.isConnected && !choice.disabled) choice.click(); }, COM.pickMs);
      }
    });
  }

  // Awal permainan baru di True Explorer: semua pemain (urutan giliran) memilih skill, lalu permainan dimulai
  async function startSkillPick(run) {
    state.busy = true;
    el.rollBtn.disabled = true;
    setMessage('Pilih skill dulu! Pemain memilih 1 kartu secara bergiliran.');
    await sleep(500);
    for (let i = 0; i < state.players.length; i++) {
      if (run !== state.run) return;
      const s = await pickSkill(i, run);
      if (run !== state.run) return;
      state.players[i].skill = s.id;
      paintSkill(i);
    }
    if (run !== state.run) return;
    closeModal();
    state.busy = false;
    el.rollBtn.disabled = !!cur().com;
    render();
    setMessage(NAMES[state.turn] + ' mulai! ' + (cur().com ? '(Com sedang bermain…)' : 'Tekan "Kocok Dadu".'));
    autoPlay();
  }

  /* ================= KAMERA (siap dikembangkan: zoom, geser, fokus ke bidak) ================= */
  const camera = {
    zoom: 1, x: 0, y: 0,
    follow: false,          // true = kamera otomatis mengikuti bidak yang sedang jalan
    followZoom: 1.6,        // makin besar = makin dekat (coba 1.3 - 2.0)
    bgZoom: 1,              // seberapa kuat latar belakang ikut zoom (1 = sama dengan papan, 0 = tidak zoom)
    bgPan: 0.35,            // seberapa jauh latar ikut bergeser dibanding papan (efek parallax; 0 = diam di tengah)
    apply() {
      const stage = document.getElementById('stage');
      const s = stage.style;
      s.setProperty('--zoom', this.zoom);
      s.setProperty('--panx', this.x + 'px');
      s.setProperty('--pany', this.y + 'px');
      // Latar belakang ikut zoom dan bergeser lebih pelan dari papan. Geserannya dibatasi supaya tepi gambar
      // tidak terlihat: titik pusat 50% / 52%, jadi batas geser = (zoom - 1) x jarak dari pusat ke tepi.
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const bz = 1 + (this.zoom - 1) * this.bgZoom;
      const lim = Math.max(0, bz - 1);
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      s.setProperty('--bgz', bz);
      s.setProperty('--bgx', clamp(this.x * this.bgPan, -lim * 0.5 * w, lim * 0.5 * w) + 'px');
      s.setProperty('--bgy', clamp(this.y * this.bgPan, -lim * 0.48 * h, lim * 0.52 * h) + 'px');
    },
    set(zoom, x, y) { this.zoom = zoom; this.x = x || 0; this.y = y || 0; this.apply(); },
    reset() { this.set(1, 0, 0); },
    // Geser kamera supaya pos ke-i berada di titik pusat papan. Menghitung ulang rumus transform CSS:
    // rotate(45deg) -> scaleY(--sy) -> scale(zoom) -> translate(pan)
    focusTile(i, zoom) {
      const c = coord(i);
      const w = el.board.offsetWidth;
      const u = ((c[0] - 0.5) / 11 - 0.5) * w;      // posisi pos di dalam papan (sebelum diputar)
      const v = ((c[1] - 0.5) / 11 - 0.5) * w;
      const sy = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sy')) || 0.58;
      const z = zoom || (this.follow ? this.followZoom : this.zoom);
      const k = Math.SQRT1_2;
      this.set(z, -((u - v) * k) * z, -((u + v) * k * sy) * z);
    },
    setFollow(on) {
      this.follow = !!on;
      document.getElementById('stage').classList.toggle('follow', this.follow);
      if (this.follow) this.focusTile(state.pos); else this.reset();
    }
  };

  /* ================= KONFIRMASI (pengganti window.confirm) ================= */
  function askConfirm(text, yesLabel, noLabel) {
    return new Promise((resolve) => {
      el.confirmText.textContent = text;
      el.confirmYes.textContent = yesLabel || 'Ya';
      el.confirmNo.textContent = noLabel || 'Batal';
      el.confirmBox.hidden = false;
      el.confirmNo.focus();
      const done = (v) => {
        el.confirmBox.hidden = true;
        el.confirmYes.onclick = null;
        el.confirmNo.onclick = null;
        resolve(v);
      };
      el.confirmYes.onclick = () => done(true);
      el.confirmNo.onclick = () => done(false);
    });
  }

  /* ================= MENU UTAMA ================= */
  let config = null;   // pengaturan permainan yang sedang berjalan: { journey, diff, subject, players: [{ name, char }] }

  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  function loadSetup() {
    const s = {
      count: 2, journey: DEFAULT_JOURNEY, diff: DEFAULT_DIFF, subject: Soal.list[0].id, map: DEFAULT_MAP, dice: DEFAULT_DICE, mode: DEFAULT_MODE,
      players: Array.from({ length: MAX_PLAYERS }, (_, i) => ({ name: '', char: CHARS[i % CHARS.length], com: false }))
    };
    try {
      const d = JSON.parse(localStorage.getItem(SETUP_KEY) || 'null');
      if (d) {
        if (d.count >= 1 && d.count <= MAX_PLAYERS) s.count = Math.floor(d.count);
        s.journey = journeyOf(d.journey);
        s.diff = diffOf(d.diff);
        s.map = mapOf(d.map);
        s.dice = diceOf(d.dice);
        s.mode = modeOf(d.mode);
        if (Soal.list.some((x) => x.id === d.subject)) s.subject = d.subject;
        if (Array.isArray(d.players)) {
          d.players.slice(0, MAX_PLAYERS).forEach((p, i) => {
            if (!p) return;
            s.players[i].name = String(p.name || '').slice(0, NAME_MAX);
            if (CHARS.indexOf(p.char) !== -1) s.players[i].char = p.char;
            s.players[i].com = i > 0 && !!p.com;   // pemain 1 selalu player
          });
        }
      }
    } catch (e) { /* abaikan */ }
    const used = [];   // pastikan tiap slot punya karakter berbeda
    s.players.forEach((p) => {
      if (used.indexOf(p.char) !== -1) p.char = CHARS.find((c) => used.indexOf(c) === -1) || p.char;
      used.push(p.char);
    });
    return s;
  }
  const setup = loadSetup();

  function saveSetup() {
    try { localStorage.setItem(SETUP_KEY, JSON.stringify(setup)); } catch (e) { /* abaikan */ }
  }

  const rowsUi = [];   // { preview, buttons: [{ key, btn }] } untuk tiap baris pemain di menu

  function buildRows() {
    el.setupRows.textContent = '';
    rowsUi.length = 0;
    for (let i = 0; i < setup.count; i++) {
      const row = mk('div', 'prow p' + i);
      const top = mk('div', 'prow-top');
      const preview = mk('span', 'prow-ico');
      const nameBox = mk('div', 'prow-name');
      const label = mk('label', null, 'Pemain ' + (i + 1));
      label.htmlFor = 'pname' + i;
      const input = mk('input');
      input.type = 'text';
      input.id = 'pname' + i;
      input.maxLength = NAME_MAX;
      input.placeholder = (i > 0 && setup.players[i].com ? 'Com ' : 'Pemain ') + (i + 1);
      input.autocomplete = 'off';
      input.value = setup.players[i].name;
      input.addEventListener('input', () => { setup.players[i].name = input.value; });
      nameBox.appendChild(label);
      nameBox.appendChild(input);
      top.appendChild(preview);
      top.appendChild(nameBox);

      // jenis pemain: Player atau Com (pemain 1 selalu Player)
      const type = mk('div', 'ptype');
      type.setAttribute('role', 'group');
      type.setAttribute('aria-label', 'Jenis Pemain ' + (i + 1));
      const bPlayer = mk('button', 'ptype-btn', 'Player');
      const bCom = mk('button', 'ptype-btn', 'Com');
      bPlayer.type = 'button';
      bCom.type = 'button';
      if (i === 0) bCom.disabled = true;
      const setType = (com) => {
        setup.players[i].com = com;
        input.placeholder = (com ? 'Com ' : 'Pemain ') + (i + 1);
        refreshTypes();
      };
      bPlayer.addEventListener('click', () => setType(false));
      bCom.addEventListener('click', () => setType(true));
      type.appendChild(bPlayer);
      type.appendChild(bCom);
      const head = mk('div', 'prow-head');   // label + pilihan Player/Com dalam satu baris, supaya tinggi baris tidak bertambah
      nameBox.insertBefore(head, label);
      head.appendChild(label);
      head.appendChild(type);

      const pick = mk('div', 'chars');
      pick.setAttribute('role', 'group');
      pick.setAttribute('aria-label', 'Pilih karakter Pemain ' + (i + 1));
      const buttons = [];
      CHARS.forEach((key) => {
        const b = mk('button', 'char-btn');
        b.type = 'button';
        const nm = Assets.config.characters[key].label || key;
        b.title = nm;
        b.setAttribute('aria-label', nm);
        const ic = mk('span');
        Assets.fill(ic, 'characters', key);
        b.appendChild(ic);
        b.addEventListener('click', () => { setup.players[i].char = key; refreshChars(); });
        pick.appendChild(b);
        buttons.push({ key: key, btn: b });
      });
      row.appendChild(top);
      row.appendChild(pick);
      el.setupRows.appendChild(row);
      rowsUi.push({ preview: preview, buttons: buttons, shown: null, bPlayer: bPlayer, bCom: bCom });
    }
    refreshChars();
    refreshTypes();
  }

  function refreshTypes() {
    rowsUi.forEach((r, i) => {
      const com = i > 0 && !!setup.players[i].com;
      r.bPlayer.setAttribute('aria-pressed', String(!com));
      r.bCom.setAttribute('aria-pressed', String(com));
    });
  }

  // Karakter yang sudah dipakai pemain lain dimatikan, jadi tidak ada dua pemain dengan bidak sama
  function refreshChars() {
    rowsUi.forEach((r, i) => {
      const mine = setup.players[i].char;
      r.buttons.forEach((o) => {
        const taken = setup.players.some((p, j) => j !== i && j < setup.count && p.char === o.key);
        o.btn.disabled = taken;
        o.btn.classList.toggle('on', o.key === mine);
        o.btn.setAttribute('aria-pressed', String(o.key === mine));
      });
      if (r.shown !== mine) { Assets.fill(r.preview, 'characters', mine); r.shown = mine; }
    });
  }

  function refreshOptions() {
    el.mapBtns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === setup.map)));
    el.diceBtns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === setup.dice)));
  }

  // Kartu pilihan map dan dadu di menu halaman 2: dibuat otomatis dari Assets.config.maps / diceSets
  function buildOptions() {
    el.mapBtns.textContent = '';
    Object.keys(MAPS).forEach((key) => {
      const m = MAPS[key];
      const b = mk('button', 'opt-card');
      b.type = 'button';
      b.dataset.v = key;
      b.title = m.nama;
      b.setAttribute('aria-label', 'Map ' + m.nama);
      const prev = mk('span', 'map-prev');
      Assets.mapStyle(prev, key);
      prev.appendChild(mk('span', 'map-emo', m.emoji || ''));
      b.appendChild(prev);
      b.appendChild(mk('b', null, m.nama));
      el.mapBtns.appendChild(b);
    });
    el.diceBtns.textContent = '';
    Object.keys(DICE_SETS).forEach((key) => {
      const d = DICE_SETS[key];
      const b = mk('button', 'opt-card');
      b.type = 'button';
      b.dataset.v = key;
      b.title = d.nama;
      b.setAttribute('aria-label', 'Dadu ' + d.nama);
      const prev = mk('span', 'dice dprev');
      styleDice(prev, key);
      const pp = [];
      for (let i = 0; i < 9; i++) { const pip = mk('span', 'pip'); prev.appendChild(pip); pp.push(pip); }
      FACES[5].forEach((i) => pp[i].classList.add('on'));
      Assets.probeUrl(Assets.faceUrl(key, 5)).then((u) => {     // jika gambar muka dadu sudah ada, pratinjau memakainya
        if (!u) return;
        prev.classList.add('img-face');
        prev.style.backgroundImage = 'url("' + u + '")';
      });
      b.appendChild(prev);
      b.appendChild(mk('b', null, d.nama));
      el.diceBtns.appendChild(b);
    });
  }

  // Mendengarkan suara dadu yang dipilih di menu (beberapa kocokan lalu berhenti)
  function previewDice(key) {
    const sfxSet = DICE_SFX[(DICE_SETS[key] || {}).sfx] || DICE_SFX.klasik;
    [0, 90, 180].forEach((ms) => setTimeout(sfxSet.roll, ms));
    setTimeout(sfxSet.land, 300);
  }

  // Halaman menu: 1 = pelajaran/perjalanan/kesulitan, 2 = pemain/map/dadu, 0 = tidak ada (sedang bermain)
  function showStep(n) {
    el.home.hidden = n !== 1;
    el.setupView.hidden = n !== 2;
    window.scrollTo(0, 0);
  }

  function refreshSeg() {
    el.countBtns.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(+b.dataset.v === setup.count));
      b.disabled = setup.mode === 'survivor' && +b.dataset.v < SURVIVOR_MIN_PLAYERS;   // Survivor: minimal 2 pemain
    });
    el.journeyBtns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === setup.journey)));
    el.diffBtns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === setup.diff)));
  }

  // Tombol pilihan mode (halaman 2): dibuat otomatis dari daftar MODES
  function buildModes() {
    el.modeBtns.textContent = '';
    Object.keys(MODES).forEach((key) => {
      const m = MODES[key];
      const b = mk('button', 'mode-btn');
      b.type = 'button';
      b.dataset.v = key;
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(mk('span', 'mode-ico', m.emoji));
      b.appendChild(mk('b', 'mode-name', m.nama));
      el.modeBtns.appendChild(b);
    });
  }

  function refreshMode() {
    el.modeBtns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === setup.mode)));
    const m = MODES[modeOf(setup.mode)];
    el.modeDesc.textContent = m.emoji + ' ' + m.nama + ': ' + m.ket;   // deskripsi hanya untuk mode yang dipilih
  }

  // Tombol pilihan pelajaran: dibuat otomatis dari Soal.list (file di folder soal/)
  function buildSubjects() {
    el.subjectBtns.textContent = '';
    Soal.list.forEach((m) => {
      const b = mk('button', 'subj-btn');
      b.type = 'button';
      b.dataset.id = m.id;
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(mk('span', 'subj-ico', m.ikon));
      b.appendChild(mk('span', null, m.nama));
      b.appendChild(mk('small', null, m.soal.length + ' soal'));
      if (m.deskripsi) b.title = m.deskripsi;
      el.subjectBtns.appendChild(b);
    });
  }

  function refreshSubject() {
    el.subjectBtns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === setup.subject)));
    const m = subjectById(setup.subject);
    el.subjectCurIco.textContent = m.ikon;
    el.subjectCurName.textContent = m.nama;
    el.subjectCurCount.textContent = m.soal.length + ' soal';
    el.subjectInfo.textContent = (m.deskripsi ? m.deskripsi + ' · ' : '') +
      'Mudah ' + m.count.mudah + ' · Sedang ' + m.count.sedang + ' · Sulit ' + m.count.sulit +
      (m.warn.length ? ' · Perhatian: ' + m.warn.join('; ') : '');
  }

  // Jendela pop up pilih pelajaran
  function openSubjectPick() {
    el.subjectPick.hidden = false;
    const on = el.subjectBtns.querySelector('[aria-pressed="true"]') || el.subjectClose;
    on.focus({ preventScroll: true });
    on.scrollIntoView({ block: 'nearest' });
  }
  function closeSubjectPick() {
    if (el.subjectPick.hidden) return;
    el.subjectPick.hidden = true;
    el.subjectOpen.focus({ preventScroll: true });
  }

  /* ================= PETUNJUK BERMAIN (pop up) ================= */
  // Isi petunjuk dibuat dari angka-angka pengaturan di atas (poin, timer, target, kartu event), jadi otomatis ikut berubah
  // kalau pengaturan itu diubah.
  const helpRow = (icon, title, text, cls) => {
    const r = mk('div', 'h-row' + (cls ? ' ' + cls : ''));
    r.appendChild(icon);
    const t = mk('span');
    t.appendChild(mk('b', null, title));
    if (text) t.appendChild(mk('small', null, text));
    r.appendChild(t);
    return r;
  };
  const helpIcon = (group, key, tile) => {
    const sw = mk('span', 'h-sw' + (tile ? ' t-' + tile : ''));
    Assets.fill(sw, group, key);
    return sw;
  };
  const helpGrid = (rows) => { const g = mk('div', 'h-grid'); rows.forEach((r) => g.appendChild(r)); return g; };

  const HELP_TABS = [
    {
      id: 'cara', nama: 'Cara Bermain',
      draw(box) {
        const ol = mk('ol', 'h-steps');
        [
          'Pemain bergantian mengocok dadu. Bidak maju sebanyak angka dadu mengikuti petak di papan.',
          'Bidak berhenti di sebuah pos. Apa yang terjadi tergantung jenis pos (lihat tab "Pos dan Efeknya").',
          'Di pos soal, pilih jawaban sebelum waktu habis. Jawaban benar menambah poin. Jawaban salah atau waktu habis mengurangi poin dan membuat bidak mundur ' + BACK_STEPS + ' langkah.',
          'Papan berputar terus tanpa garis finish. Pemain yang lebih dulu mencapai target poin perjalanan menang.',
          'Pemain komputer (Com) bermain sendiri dan menjawab benar dengan peluang sekitar ' + Math.round(COM.accuracy * 100) + '%.'
        ].forEach((t) => ol.appendChild(mk('li', null, t)));
        box.appendChild(ol);
      }
    },
    {
      id: 'menu', nama: 'Pilihan Menu',
      draw(box) {
        const ico = (t) => mk('span', 'h-sw', t);
        box.appendChild(mk('h3', null, 'Halaman 1'));
        box.appendChild(helpGrid([
          helpRow(ico('📚'), 'Pelajaran', 'Pilih kumpulan soal yang dimainkan. Tiap pelajaran punya soal mudah, sedang, dan sulit.'),
          helpRow(ico('🧭'), 'Perjalanan', Object.keys(JOURNEYS).map((k) => JOURNEYS[k].nama + ' ' + JOURNEYS[k].target + ' poin').join(' · ') + '. Makin besar target, makin panjang permainan.'),
          helpRow(ico('⏱️'), 'Tingkat kesulitan', 'Mengatur timer menjawab: ' + Object.keys(DIFFICULTY).map((k) => DIFFICULTY[k].nama + ' ' + (DIFFICULTY[k].detik ? DIFFICULTY[k].detik + ' detik' : 'tanpa timer')).join(' · ') + '.')
        ]));
        box.appendChild(mk('h3', null, 'Halaman 2'));
        box.appendChild(helpGrid([
          helpRow(ico('👥'), 'Pemain dan karakter', '1 sampai ' + MAX_PLAYERS + ' pemain. Isi nama dan pilih karakter; tiap pemain memakai karakter yang berbeda.'),
          helpRow(ico('🤖'), 'Bermain dengan komputer', 'Pilih "Com" pada pemain 2 sampai ' + MAX_PLAYERS + '. Pemain 1 selalu manusia.'),
          helpRow(ico('🏙️'), 'Mode permainan', 'Mode Klasik untuk anak SD. True Explorer: beli pos dengan poin seperti monopoli, cocok untuk kelas atas dan guru. Survivor: aturan True Explorer, semua mulai 50 poin, poin habis = gugur, pemain terakhir yang bertahan menang (minimal 2 pemain).'),
          helpRow(ico('🗺️'), 'Map', 'Mengubah latar belakang papan dan musik permainan.'),
          helpRow(ico('🎲'), 'Dadu', 'Mengubah tampilan dadu dan suara saat dadu dikocok.')
        ]));
      }
    },
    {
      id: 'mode', nama: 'Mode Permainan',
      draw(box) {
        const ico = (t) => mk('span', 'h-sw', t);
        box.appendChild(helpGrid(Object.keys(MODES).map((k) => helpRow(ico(MODES[k].emoji), MODES[k].nama, MODES[k].ket))));
        box.appendChild(mk('h3', null, 'Aturan True Explorer'));
        const ol = mk('ol', 'h-steps');
        [
          'Poin dipakai sebagai uang. Hanya pos soal (mudah, sedang, sulit) yang bisa dimiliki; START, event, pos khusus, dan Free Will tidak bisa dibeli.',
          'Pos milik pemain lain: bidak yang singgah membayar sewa kepada pemiliknya, lalu soal tetap muncul seperti biasa.',
          'Jawab soal dengan benar dan poin cukup, maka kamu boleh membeli pos kosong atau mengambil alih pos milik pemain lain' + (PROPERTY.takeoverToOwner ? ' (biayanya dibayar ke pemilik lama)' : '') + '.',
          'Setiap bidak (siapa pun) berhenti di pos yang sudah dibeli, sewa pos naik ' + PROPERTY.upgradeRent + ' poin dan biaya ambil alih naik ' + PROPERTY.upgradeTakeover + ' poin, lalu muncul rumah. Pada kunjungan ke-' + PROPERTY.hotelAt + ' rumah berubah menjadi hotel (level maksimal).',
          'Hasil investasi: setiap bidak maju melewati atau berhenti di pos miliknya sendiri, pemilik mendapat ' + PROPERTY.investPoints + ' poin.',
          'Pos yang dimiliki berubah menjadi warna pemiliknya. Pemain pertama yang mencapai target poin menang; poin dari sewa dan ambil alih ikut dihitung.'
        ].forEach((t) => ol.appendChild(mk('li', null, t)));
        box.appendChild(ol);
        box.appendChild(mk('h3', null, 'Harga pos'));
        box.appendChild(helpGrid(PROPERTY.tiers.map((t) => helpRow(mk('span', 'h-sw', '🏠'), 'Pos ' + t.from + ' - ' + t.to,
          'Beli ' + t.price + ' poin · Sewa ' + t.rent + ' poin · Ambil alih ' + t.takeover + ' poin'))));
        box.appendChild(mk('h3', null, 'Skill pemain'));
        box.appendChild(mk('p', null, 'Sebelum kocokan pertama, tiap pemain memilih 1 dari ' + SKILL.cards + ' kartu skill acak secara bergiliran. Skill dipakai sepanjang permainan dan terlihat semua pemain. Saat skill aktif, hanya muncul notifikasi kecil di kiri atas.'));
        box.appendChild(helpGrid(Object.keys(SKILLS).map((k) => helpRow(helpIcon('effects', 'skill_' + k), SKILLS[k].nama, SKILLS[k].ket, 'h-ev'))));
      }
    },
    {
      id: 'pos', nama: 'Pos dan Efeknya',
      draw(box) {
        const gl = (k) => '+' + RULES[k].gain + ' poin jika benar, −' + RULES[k].loss + ' poin dan mundur ' + BACK_STEPS + ' langkah jika salah atau waktu habis.';
        box.appendChild(helpGrid([
          helpRow(helpIcon('tiles', 'start', 'start'), 'START', 'Titik awal. Papan berputar, jadi bidak melewati START lagi setelah satu putaran.'),
          helpRow(helpIcon('tiles', 'mudah', 'mudah'), 'Soal mudah', gl('mudah')),
          helpRow(helpIcon('tiles', 'sedang', 'sedang'), 'Soal sedang', gl('sedang')),
          helpRow(helpIcon('tiles', 'sulit', 'sulit'), 'Soal sulit', gl('sulit')),
          helpRow(helpIcon('tiles', 'khusus', 'khusus'), 'Pos khusus', '+' + FACT_POINTS + ' poin dan satu fakta menarik.'),
          helpRow(helpIcon('tiles', 'freewill', 'freewill'), 'Free Will', 'Pilih sendiri jenis pos yang mau diambil, tanpa berpindah tempat.'),
          helpRow(helpIcon('tiles', 'event', 'event'), 'Pos event', 'Pilih 1 dari ' + EVENT.cards + ' kartu tertutup. Isi kartu baru terlihat setelah dibuka.')
        ]));
        box.appendChild(mk('h3', null, 'Kartu di pos event'));
        box.appendChild(helpGrid(EVENTS.map((ev) => helpRow(helpIcon('effects', ev.id), ev.nama, ev.ket, 'h-ev'))));
        box.appendChild(mk('p', 'h-note', 'Poin tidak pernah di bawah 0. Pemain yang mencapai target poin perjalanan langsung menang.'));
      }
    }
  ];

  let helpOpener = null;

  function showHelpTab(id) {
    el.helpTabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.id === id)));
    const tab = HELP_TABS.find((t) => t.id === id) || HELP_TABS[0];
    el.helpBody.textContent = '';
    tab.draw(el.helpBody);
    el.helpBody.scrollTop = 0;
  }

  function buildHelp() {
    el.helpTabs.textContent = '';
    HELP_TABS.forEach((t) => {
      const b = mk('button', 'tab-btn', t.nama);
      b.type = 'button';
      b.dataset.id = t.id;
      b.setAttribute('role', 'tab');
      b.addEventListener('click', () => showHelpTab(t.id));
      el.helpTabs.appendChild(b);
    });
    showHelpTab(HELP_TABS[0].id);
  }

  function openHelp(e) {
    helpOpener = e && e.currentTarget ? e.currentTarget : null;
    showHelpTab(HELP_TABS[0].id);
    el.helpPick.hidden = false;
    el.helpClose.focus({ preventScroll: true });
  }
  function closeHelp() {
    if (el.helpPick.hidden) return;
    el.helpPick.hidden = true;
    if (helpOpener && helpOpener.isConnected) helpOpener.focus({ preventScroll: true });
  }

  function refreshHome() {
    const saved = loadGame();
    el.continueBox.hidden = !saved;
    if (saved) {
      const lead = saved.players.map((p) => p.name).join(', ');
      el.continueInfo.textContent = 'Permainan tersimpan: ' + lead + ' · ' + MODES[saved.mode].nama + ' · ' + JOURNEYS[saved.journey].nama + ' · ' + DIFFICULTY[saved.diff].nama + ' · ' + subjectById(saved.subject).nama;
    }
  }

  // Kartu pemain di atas papan + bidak di papan, dibuat sesuai daftar pemain
  function buildPlayers(roster) {
    ui.forEach((u) => { u.card.remove(); u.piece.remove(); });
    ui.length = 0;
    el.playersBox.className = 'players n' + roster.length;
    roster.forEach((p, i) => {
      const card = mk('div', 'player p' + i);
      const pname = mk('span', 'pname');
      const ico = mk('span');
      Assets.fill(ico, 'characters', p.char);
      const goal = mk('small', 'goal');
      pname.appendChild(ico);
      pname.appendChild(mk('span', null, ' ' + p.name + ' '));
      pname.appendChild(goal);
      const info = mk('span', 'pinfo');
      const pos = mk('b', null, 'START');
      const score = mk('b', null, '0');
      const scoreWrap = mk('span', null, 'Skor ');
      scoreWrap.appendChild(score);
      info.appendChild(pos);
      info.appendChild(scoreWrap);
      const bar = mk('div', 'bar');
      const fill = mk('i');
      bar.appendChild(fill);
      const sk = mk('span', 'pskill');          // label skill (muncul setelah pemain memilih skill)
      const skIco = mk('span', 'sk-ico');
      const skName = mk('span', 'sk-name');
      sk.hidden = true;
      sk.appendChild(skIco);
      sk.appendChild(skName);
      card.appendChild(pname);
      card.appendChild(sk);
      card.appendChild(info);
      card.appendChild(bar);
      el.playersBox.appendChild(card);

      const piece = mk('div', 'piece p' + i);
      const face = mk('span');
      Assets.fill(face, 'characters', p.char);
      piece.appendChild(face);
      el.board.appendChild(piece);
      ui.push({ card: card, pos: pos, score: score, goal: goal, bar: fill, piece: piece, sk: sk, skIco: skIco, skName: skName, skShown: null });
    });
  }

  // cfg = { journey, diff, subject, players: [{ name, char }] }, saved = data hasil loadGame() (opsional, untuk melanjutkan)
  function startGame(cfg, saved) {
    config = { journey: journeyOf(cfg.journey), diff: diffOf(cfg.diff), subject: cfg.subject, map: mapOf(cfg.map), dice: diceOf(cfg.dice), mode: modeOf(cfg.mode), players: cfg.players.map((p) => ({ name: p.name, char: p.char, com: !!p.com })) };
    journey = config.journey;
    mode = config.mode;
    diff = config.diff;
    subject = subjectById(config.subject);
    queues.mudah = []; queues.sedang = []; queues.sulit = []; factQueue = [];
    applyMap(config.map);
    applyDice(config.dice);
    buildPlayers(config.players);
    showStep(0);
    el.gameView.hidden = false;
    window.scrollTo(0, 0);
    reset(saved);
  }

  async function startFromSetup() {
    if (loadGame() && !(await askConfirm('Ada permainan tersimpan. Memulai permainan baru akan menimpanya. Lanjutkan?', 'Mulai baru'))) return;
    if (setup.mode === 'survivor' && setup.count < SURVIVOR_MIN_PLAYERS) { setup.count = SURVIVOR_MIN_PLAYERS; buildRows(); refreshSeg(); }
    const players = [];
    for (let i = 0; i < setup.count; i++) {
      const com = i > 0 && !!setup.players[i].com;
      let name = cleanName(setup.players[i].name, i, com);
      if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        name = name.slice(0, NAME_MAX - 2) + ' ' + (i + 1);   // nama kembar dibedakan dengan nomor
      }
      players.push({ name: name, char: setup.players[i].char, com: com });
    }
    saveSetup();
    startGame({ journey: setup.journey, diff: setup.diff, subject: setup.subject, map: setup.map, dice: setup.dice, mode: setup.mode, players: players });
  }

  function goHome() {
    state.run++;                    // menghentikan alur permainan yang masih berjalan
    state.busy = false;
    camera.setFollow(false);
    el.nextBtn.onclick = null;
    el.dice.classList.remove('rolling');
    el.win.hidden = true;
    closeModal();
    bgm.start('menu');             // kembali ke menu: musik menu yang santai
    el.gameView.hidden = true;
    showStep(1);
    refreshHome();
    window.scrollTo(0, 0);
  }

  /* ================= MULAI ================= */
  Assets.init();
  buildBoard();
  buildDice();
  camera.reset();
  applyMap(setup.map);
  applyDice(setup.dice);
  buildRows();
  buildSubjects();
  buildOptions();
  buildHelp();
  refreshSubject();
  buildModes();
  refreshSeg();
  refreshMode();
  refreshOptions();
  refreshHome();
  // untuk uji di konsol, mis. JIPS.camera.set(1.5, 0, 40) atau JIPS.camera.setFollow(true)
  window.JIPS = { changeScore: changeScore, camera: camera, state: state, Assets: Assets, setup: setup, bgm: bgm, save: saveGame, clearSave: clearSave, skills: { SKILL: SKILL, SKILLS: SKILLS, teliti: skillTeliti, spend: skillSpend, ghoib: skillGhoib, lincah: skillLincah, kikirMul: skillKikirMul, thief: skillThief, passStart: skillPassStart, firstRoll: skillFirstRoll } };

  el.countBtns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setup.count = +b.dataset.v;
    buildRows();
    refreshSeg();
  });
  el.journeyBtns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setup.journey = journeyOf(b.dataset.v);
    refreshSeg();
  });
  el.diffBtns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setup.diff = diffOf(b.dataset.v);
    refreshSeg();
  });
  el.subjectBtns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setup.subject = b.dataset.id;
    refreshSubject();
    closeSubjectPick();
  });
  el.modeBtns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setup.mode = modeOf(b.dataset.v);
    if (setup.mode === 'survivor' && setup.count < SURVIVOR_MIN_PLAYERS) { setup.count = SURVIVOR_MIN_PLAYERS; buildRows(); }
    refreshSeg();
    refreshMode();
  });
  el.toSetupBtn.addEventListener('click', () => showStep(2));
  el.backBtn.addEventListener('click', () => showStep(1));
  el.mapBtns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setup.map = mapOf(b.dataset.v);
    refreshOptions();
  });
  el.diceBtns.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setup.dice = diceOf(b.dataset.v);
    refreshOptions();
    previewDice(setup.dice);
  });
  document.querySelectorAll('[data-help]').forEach((b) => b.addEventListener('click', openHelp));
  el.helpClose.addEventListener('click', closeHelp);
  el.helpPick.addEventListener('click', (e) => { if (e.target === el.helpPick) closeHelp(); });   // ketuk area gelap = tutup
  el.subjectOpen.addEventListener('click', openSubjectPick);
  el.subjectClose.addEventListener('click', closeSubjectPick);
  el.subjectPick.addEventListener('click', (e) => { if (e.target === el.subjectPick) closeSubjectPick(); });   // ketuk area gelap = tutup
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSubjectPick(); closeHelp(); } });
  el.startBtn.addEventListener('click', startFromSetup);
  el.continueBtn.addEventListener('click', () => {
    const saved = loadGame();
    if (saved) startGame(saved, saved);
  });
  el.menuBtn.addEventListener('click', () => {
    askConfirm('Kembali ke menu? Permainan tersimpan sampai giliran terakhir yang selesai.', 'Ke menu').then((ok) => { if (ok) goHome(); });
  });
  el.winMenuBtn.addEventListener('click', goHome);
  el.rollBtn.addEventListener('click', rollDice);
  el.restartBtn.addEventListener('click', () => reset());
  el.againBtn.addEventListener('click', () => reset());
  const soundBtns = document.querySelectorAll('[data-sound]');   // tombol suara di menu dan di permainan
  soundBtns.forEach((b) => b.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn) { if (bgm.wanted) bgm.start(); } else bgm.halt();
    soundBtns.forEach((x) => {
      x.setAttribute('aria-pressed', String(soundOn));
      x.setAttribute('aria-label', soundOn ? 'Matikan suara' : 'Nyalakan suara');
    });
    if (soundOn) sfx.click();
  }));

  // efek suara tombol di menu utama dan di kotak konfirmasi
  function menuSfx(e) {
    const b = e.target.closest && e.target.closest('button');
    if (!b || b.disabled || b.hasAttribute('data-sound')) return;   // tombol suara punya efek sendiri
    if (el.diceBtns.contains(b)) return;                             // kartu dadu memutar suara dadu yang dipilih (previewDice)
    if (b === el.startBtn || b === el.continueBtn) sfx.start();
    else if (b.matches('.seg-btn, .subj-btn, .char-btn, .ptype-btn, .opt-card, .tab-btn, .mode-btn')) sfx.select();
    else sfx.click();
  }
  el.home.addEventListener('click', menuSfx);
  el.setupView.addEventListener('click', menuSfx);
  el.helpPick.addEventListener('click', menuSfx);
  el.confirmBox.addEventListener('click', menuSfx);
  el.subjectPick.addEventListener('click', menuSfx);

  // layar pembuka: satu ketukan membuka izin suara browser, lalu musik menu langsung berbunyi
  const splash = document.getElementById('splash');
  if (splash) {
    const closeSplash = (e) => {
      if (e.target.closest && e.target.closest('[data-fs]')) return;   // tombol layar penuh tidak menutup layar pembuka
      splash.removeEventListener('click', closeSplash);
      splash.classList.add('out');
      bgm.start('menu');
      sfx.start();
      setTimeout(() => { splash.hidden = true; }, 450);
    };
    splash.addEventListener('click', closeSplash);
  }

  // browser baru mengizinkan suara setelah layar disentuh: musik menu mulai pada sentuhan pertama
  document.addEventListener('pointerdown', () => {
    if (el.gameView.hidden && !bgm.wanted) bgm.start('menu');
  }, { once: true });
})();
