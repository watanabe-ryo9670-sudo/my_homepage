/* ============================================================
   RYO 第五形態 ─ メインエンジン
   ============================================================ */

// ==============================
// ユーティリティ
// ==============================
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function toast(msg, duration = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}
window.toast = toast;

// ==============================
// ローダー
// ==============================
const loaderStatuses = [
  '魂のコアを起動中...',
  '広島より原点座標を取得...',
  '六弦の獣を調律中...',
  'ニーチェを召喚中...',
  '銀河を錬成中...',
  '第五形態、最終認証...',
];
const loader = $('#loader');
const loaderProgress = $('.loader-progress');
const loaderPercent = $('.loader-percent');
const loaderStatus = $('#loader-status');
let loadValue = 0;

const loadInterval = setInterval(() => {
  loadValue += Math.random() * 11 + 4;
  const idx = Math.min(Math.floor(loadValue / 17), loaderStatuses.length - 1);
  loaderStatus.textContent = loaderStatuses[idx];
  if (loadValue >= 100) {
    loadValue = 100;
    clearInterval(loadInterval);
    loaderProgress.style.width = '100%';
    loaderPercent.textContent = '100%';
    loaderStatus.textContent = '覚醒、完了。';
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
      initAnimations();
    }, 600);
  } else {
    loaderProgress.style.width = loadValue + '%';
    loaderPercent.textContent = Math.floor(loadValue) + '%';
  }
}, 85);

// ==============================
// カスタムカーソル
// ==============================
const cursor = $('#cursor');
const cursorFollower = $('#cursor-follower');
let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
let followerX = mouseX, followerY = mouseY;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});
(function animateCursor() {
  followerX += (mouseX - followerX) * 0.13;
  followerY += (mouseY - followerY) * 0.13;
  cursorFollower.style.left = followerX + 'px';
  cursorFollower.style.top  = followerY + 'px';
  requestAnimationFrame(animateCursor);
})();

function bindCursorHover() {
  const hoverTargets = 'a, button, input, textarea, select, .skill-card, .interest-card, .gallery-item, .timeline-card, .nav-logo, .theme-opt, #cmd-list li';
  $$(hoverTargets).forEach(el => {
    if (el._cursorBound) return;
    el._cursorBound = true;
    el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); cursorFollower.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); cursorFollower.classList.remove('hover'); });
  });
}
bindCursorHover();

// ==============================
// Three.js 銀河（ヒーロー背景）
// ==============================
(function initGalaxy() {
  const canvas = $('#galaxy-canvas');
  if (!window.THREE) { canvas.style.display = 'none'; return; }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 4.2);

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  // 渦巻銀河パーティクル
  const COUNT = innerWidth < 768 ? 5000 : 14000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const cIn = new THREE.Color('#6c63ff');
  const cOut = new THREE.Color('#00d4ff');

  for (let i = 0; i < COUNT; i++) {
    const radius = Math.pow(Math.random(), 0.7) * 4.4;
    const branch = (i % 4) / 4 * Math.PI * 2;
    const spin = radius * 1.1;
    const rand = () => (Math.random() - 0.5) * Math.pow(Math.random(), 2) * 0.9;
    positions[i * 3]     = Math.cos(branch + spin) * radius + rand();
    positions[i * 3 + 1] = rand() * 0.6;
    positions[i * 3 + 2] = Math.sin(branch + spin) * radius + rand();
    const mixed = cIn.clone().lerp(cOut, radius / 4.4);
    colors[i * 3] = mixed.r; colors[i * 3 + 1] = mixed.g; colors[i * 3 + 2] = mixed.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.012, sizeAttenuation: true,
    vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const galaxy = new THREE.Points(geo, mat);
  scene.add(galaxy);

  // 背景の星
  const starGeo = new THREE.BufferGeometry();
  const starCount = 900;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 30;
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.02, color: 0xffffff, transparent: true, opacity: 0.55 }));
  scene.add(stars);

  let targetRX = 0, targetRY = 0;
  document.addEventListener('mousemove', (e) => {
    targetRY = (e.clientX / innerWidth - 0.5) * 0.5;
    targetRX = (e.clientY / innerHeight - 0.5) * 0.3;
  });

  const clock = new THREE.Clock();
  (function tick() {
    const t = clock.getElapsedTime();
    galaxy.rotation.y = t * 0.06 + targetRY;
    galaxy.rotation.x = -0.25 + targetRX * 0.5;
    stars.rotation.y = -t * 0.012;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();

  // テーマ変更時に銀河の色を更新
  window.updateGalaxyColors = (inHex, outHex) => {
    const a = new THREE.Color(inHex), b = new THREE.Color(outHex);
    const col = geo.attributes.color;
    const pos = geo.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      const r = Math.hypot(pos.array[i * 3], pos.array[i * 3 + 2]);
      const mixed = a.clone().lerp(b, Math.min(r / 4.4, 1));
      col.array[i * 3] = mixed.r; col.array[i * 3 + 1] = mixed.g; col.array[i * 3 + 2] = mixed.b;
    }
    col.needsUpdate = true;
  };
})();

// ==============================
// タイプライター
// ==============================
const typewriterTexts = [
  '東京大学工学系研究科 ─ 宇宙の設計図を盗み見る者',
  '広島の神童 a.k.a. 革命のロックンローラー【第五形態】',
  'このページは生きている。文字を書き換えてみろ。',
  'Ctrl+K ─ 古の呪文でコマンドパレットが開く',
  '↑↑↓↓←→←→BA ─ 真の力を解放するがいい',
  '日々学ビ、日々燃エ、日々革命。',
];
let typeIdx = 0, charIdx = 0, isDeleting = false;
const typewriterEl = $('#typewriter-text');

function typewrite() {
  const current = typewriterTexts[typeIdx];
  if (isDeleting) {
    typewriterEl.textContent = current.substring(0, --charIdx);
    if (charIdx < 0) {
      isDeleting = false;
      typeIdx = (typeIdx + 1) % typewriterTexts.length;
      setTimeout(typewrite, 420);
      return;
    }
  } else {
    typewriterEl.textContent = current.substring(0, ++charIdx);
    if (charIdx > current.length) {
      isDeleting = true;
      setTimeout(typewrite, 2200);
      return;
    }
  }
  setTimeout(typewrite, isDeleting ? 35 : 80);
}

// ==============================
// テキストスクランブル（見出し）
// ==============================
const SCRAMBLE_CHARS = 'アィカサタナハマヤラワガザダバパ0123456789!<>-_\\/[]{}—=+*^?#________';
function scrambleText(el) {
  if (el._scrambling) return;
  el._scrambling = true;
  const original = el.textContent;
  let frame = 0;
  const total = 24;
  const timer = setInterval(() => {
    frame++;
    const progress = frame / total;
    el.textContent = original.split('').map((ch, i) => {
      if (ch === ' ' || ch === '─') return ch;
      if (i / original.length < progress) return ch;
      return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }).join('');
    if (frame >= total) {
      clearInterval(timer);
      el.textContent = original;
      el._scrambling = false;
    }
  }, 38);
}

// ==============================
// カウンター
// ==============================
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const start = performance.now();
  const duration = 1800;
  (function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(update);
  })(start);
}

// ==============================
// 3Dチルトカード
// ==============================
$$('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (document.body.classList.contains('edit-mode')) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 10}deg) translateZ(6px)`;
    card.style.setProperty('--mx', px * 100 + '%');
    card.style.setProperty('--my', py * 100 + '%');
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ==============================
// GSAPアニメーション
// ==============================
function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ delay: 0.15 });
  tl.to('.hero-tag', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .to('.hero-name', { opacity: 1, duration: 1.1, ease: 'power4.out', onComplete: heroGlitchLoop }, '-=0.4')
    .to('.hero-subtitle', { opacity: 1, duration: 0.7 }, '-=0.5')
    .to('.hero-typewriter', { opacity: 1, duration: 0.5 }, '-=0.3')
    .add(typewrite)
    .to('.hero-btn', { opacity: 1, duration: 0.5, stagger: 0.12 }, '-=0.2');

  // マグネティックボタン
  $$('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.35, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    });
  });

  // セクション見出し（出現時にスクランブル）
  gsap.utils.toArray('.section-header').forEach(el => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el, start: 'top 82%',
        onEnter: () => { const t = el.querySelector('.scramble-title'); if (t) scrambleText(t); }
      },
      opacity: 0, y: 55, duration: 1, ease: 'power3.out'
    });
  });

  gsap.from('.about-image-wrap', { scrollTrigger: { trigger: '#about', start: 'top 72%' }, opacity: 0, x: -80, duration: 1.2, ease: 'power3.out' });
  gsap.from('.about-text', { scrollTrigger: { trigger: '#about', start: 'top 72%' }, opacity: 0, x: 80, duration: 1.2, delay: 0.15, ease: 'power3.out' });

  $$('.stat-num').forEach(el => {
    ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => animateCounter(el) });
  });

  gsap.utils.toArray('.skill-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 88%' },
      opacity: 0, y: 65, duration: 0.85, delay: (i % 3) * 0.12, ease: 'power3.out',
      onComplete() {
        const bar = card.querySelector('.skill-fill');
        if (bar) bar.style.width = bar.dataset.width + '%';
      }
    });
  });

  gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, start: 'top 86%' },
      opacity: 0, x: -55, duration: 0.85, ease: 'power3.out'
    });
  });

  gsap.utils.toArray('.gallery-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, start: 'top 90%' },
      opacity: 0, y: 60, scale: 0.92, duration: 0.7, delay: (i % 3) * 0.1, ease: 'power3.out'
    });
  });

  gsap.utils.toArray('.interest-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 90%' },
      opacity: 0, y: 60, scale: 0.88, duration: 0.75, delay: (i % 3) * 0.1, ease: 'back.out(1.5)'
    });
  });

  gsap.from('.contact-info', { scrollTrigger: { trigger: '#contact', start: 'top 72%' }, opacity: 0, x: -65, duration: 1.1, ease: 'power3.out' });
  gsap.from('.contact-form', { scrollTrigger: { trigger: '#contact', start: 'top 72%' }, opacity: 0, x: 65, duration: 1.1, delay: 0.18, ease: 'power3.out' });
  gsap.from('footer', { scrollTrigger: { trigger: 'footer', start: 'top 95%' }, opacity: 0, y: 30, duration: 0.9, ease: 'power3.out' });
}

// ヒーロー名の周期グリッチ
function heroGlitchLoop() {
  const name = $('.hero-name');
  setInterval(() => {
    name.classList.add('glitching');
    setTimeout(() => name.classList.remove('glitching'), 260);
  }, 3800);
}

// ==============================
// ナビゲーション / スクロール
// ==============================
const nav = $('#nav');
const navToggle = $('#nav-toggle');
const navLinks = $('.nav-links');

addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 60);
  // 進捗バー
  const max = document.documentElement.scrollHeight - innerHeight;
  const pct = max > 0 ? scrollY / max : 0;
  $('#scroll-progress').style.width = pct * 100 + '%';
  $('#hud-depth').textContent = Math.round(pct * 100) + '%';
  // セクションドット
  let current = 'hero';
  $$('section').forEach(sec => {
    if (scrollY >= sec.offsetTop - innerHeight * 0.45) current = sec.id;
  });
  $$('#section-dots .dot').forEach(dot => {
    dot.classList.toggle('active', dot.getAttribute('href') === '#' + current);
  });
});

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ==============================
// HUD（時刻 / FPS / 魂）
// ==============================
setInterval(() => {
  $('#hud-time').textContent = new Date().toLocaleTimeString('ja-JP');
}, 1000);

let fpsFrames = 0, fpsLast = performance.now();
(function fpsLoop(now) {
  fpsFrames++;
  if (now - fpsLast >= 1000) {
    $('#hud-fps').textContent = fpsFrames;
    fpsFrames = 0; fpsLast = now;
  }
  requestAnimationFrame(fpsLoop);
})(performance.now());

const soulStates = ['∞', '燃焼中', '覚醒', 'MAX', '臨界点', '超臨界'];
setInterval(() => {
  $('#hud-soul').textContent = soulStates[Math.floor(Math.random() * soulStates.length)];
}, 4000);

// ==============================
// テーマ（次元）切替
// ==============================
const themeColors = {
  void:     ['#6c63ff', '#00d4ff'],
  inferno:  ['#ff4d4d', '#ffaa00'],
  genesis:  ['#00ff88', '#00d4ff'],
  crimson:  ['#ff0066', '#9b59b6'],
  daybreak: ['#ff9a3c', '#6c63ff'],
};
const themeNames = { void: '虚空', inferno: '業火', genesis: '創世', crimson: '緋月', daybreak: '黎明' };

function setTheme(name) {
  document.body.dataset.theme = name;
  localStorage.setItem('ryo5-theme', name);
  if (window.updateGalaxyColors && themeColors[name]) {
    updateGalaxyColors(themeColors[name][0], themeColors[name][1]);
  }
  toast(`次元転移完了 ──「${themeNames[name]}」`);
}

$('#theme-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  $('#theme-panel').classList.toggle('open');
});
$$('.theme-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    setTheme(btn.dataset.theme);
    $('#theme-panel').classList.remove('open');
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('#theme-panel') && !e.target.closest('#theme-btn')) {
    $('#theme-panel').classList.remove('open');
  }
});
// 保存テーマ復元
const savedTheme = localStorage.getItem('ryo5-theme');
if (savedTheme && themeColors[savedTheme]) {
  document.body.dataset.theme = savedTheme;
  setTimeout(() => window.updateGalaxyColors && updateGalaxyColors(...themeColors[savedTheme]), 500);
}

// ==============================
// 魂のBGM（Web Audio 生成アンビエント）
// ==============================
let audioCtx = null, audioNodes = [], audioOn = false;

function startBGM() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const master = audioCtx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.13, audioCtx.currentTime + 2);
  master.connect(audioCtx.destination);

  // ドローンコード（Am add9 っぽい荘厳な響き）
  const freqs = [55, 110, 164.81, 220, 246.94, 329.63];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = i < 2 ? 'sawtooth' : 'sine';
    osc.frequency.value = f;
    const g = audioCtx.createGain();
    g.gain.value = i < 2 ? 0.06 : 0.12;
    // ゆらぎLFO
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.07 + i * 0.03;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain); lfoGain.connect(g.gain);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 900;
    osc.connect(g); g.connect(filter); filter.connect(master);
    osc.start(); lfo.start();
    audioNodes.push(osc, lfo);
  });
  audioNodes.push(master);
  return master;
}

$('#audio-btn').addEventListener('click', () => {
  const icon = $('#audio-btn i');
  if (!audioOn) {
    audioOn = true;
    startBGM();
    icon.className = 'fas fa-volume-high';
    toast('魂の周波数、共鳴開始 ♪');
  } else {
    audioOn = false;
    audioNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    audioNodes = [];
    icon.className = 'fas fa-volume-mute';
    toast('静寂もまた、音楽だ。');
  }
});

// ==============================
// 魂の声（SpeechSynthesis）
// ==============================
$('#voice-btn').addEventListener('click', () => {
  const lines = [
    '俺の名はリョウ。第五形態に覚醒した男だ。',
    '日々学び、日々燃え、日々革命。それが俺の生き方だ。',
    'このページはもはや、ただのホームページではない。',
    '深淵を覗くがいい。深淵も君を覗いている。',
  ];
  const u = new SpeechSynthesisUtterance(lines[Math.floor(Math.random() * lines.length)]);
  u.lang = 'ja-JP'; u.rate = 0.95; u.pitch = 0.8;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  toast('魂の声を再生中…');
});

// ==============================
// FXキャンバス（花火・紙吹雪・クリック火花）
// ==============================
const fxCanvas = $('#fx-canvas');
const fxCtx = fxCanvas.getContext('2d');
let fxParticles = [];

function resizeFx() { fxCanvas.width = innerWidth; fxCanvas.height = innerHeight; }
resizeFx();
addEventListener('resize', resizeFx);

function spawnBurst(x, y, count, opts = {}) {
  const hueBase = opts.hue ?? Math.random() * 360;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 0.7 + 0.3) * (opts.speed ?? 7);
    fxParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (opts.lift ?? 0),
      life: 1,
      decay: Math.random() * 0.018 + (opts.decay ?? 0.012),
      size: Math.random() * 2.6 + 1.2,
      hue: hueBase + Math.random() * 50 - 25,
      gravity: opts.gravity ?? 0.11,
      confetti: opts.confetti ?? false,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }
}

(function fxLoop() {
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  fxParticles = fxParticles.filter(p => p.life > 0);
  for (const p of fxParticles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += p.gravity; p.vx *= 0.985;
    p.life -= p.decay; p.rot += p.vr;
    fxCtx.save();
    fxCtx.globalAlpha = Math.max(p.life, 0);
    if (p.confetti) {
      fxCtx.translate(p.x, p.y); fxCtx.rotate(p.rot);
      fxCtx.fillStyle = `hsl(${p.hue}, 95%, 62%)`;
      fxCtx.fillRect(-p.size * 1.6, -p.size * 0.9, p.size * 3.2, p.size * 1.8);
    } else {
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      fxCtx.fillStyle = `hsl(${p.hue}, 95%, 65%)`;
      fxCtx.shadowColor = `hsl(${p.hue}, 95%, 60%)`;
      fxCtx.shadowBlur = 12;
      fxCtx.fill();
    }
    fxCtx.restore();
  }
  requestAnimationFrame(fxLoop);
})();

// クリック火花（編集モード以外）
document.addEventListener('click', (e) => {
  if (document.body.classList.contains('edit-mode')) return;
  if (e.target.closest('#cmd-palette, #chat-widget, #theme-panel, nav, #edit-panel')) return;
  spawnBurst(e.clientX, e.clientY, 14, { speed: 4, decay: 0.03 });
});

function fireworksShow() {
  let n = 0;
  const timer = setInterval(() => {
    spawnBurst(
      innerWidth * (0.15 + Math.random() * 0.7),
      innerHeight * (0.12 + Math.random() * 0.45),
      90, { speed: 8, lift: 1.5 }
    );
    if (++n >= 10) clearInterval(timer);
  }, 320);
  toast('革命記念花火、打ち上げ開始！');
}

function confettiRain() {
  for (let i = 0; i < 160; i++) {
    setTimeout(() => {
      spawnBurst(Math.random() * innerWidth, -16, 1, { confetti: true, speed: 1.5, gravity: 0.05, decay: 0.004, lift: -1 });
    }, i * 18);
  }
}

// ==============================
// マトリックスレイン（隠し）
// ==============================
const matrixCanvas = $('#matrix-canvas');
const mtx = matrixCanvas.getContext('2d');
let matrixOn = false, matrixDrops = [];
const MATRIX_CHARS = '革命魂炎覚醒神童轟音哲学広島東京燃焼限界突破RYOアイウエオカキクケコ01';

function resizeMatrix() {
  matrixCanvas.width = innerWidth; matrixCanvas.height = innerHeight;
  matrixDrops = Array(Math.floor(innerWidth / 18)).fill(0).map(() => Math.random() * -50);
}
resizeMatrix();
addEventListener('resize', resizeMatrix);

setInterval(() => {
  if (!matrixOn) return;
  mtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  mtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  mtx.font = '15px monospace';
  matrixDrops.forEach((y, i) => {
    const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    mtx.fillStyle = Math.random() > 0.95 ? '#fff' : '#00ff88';
    mtx.fillText(ch, i * 18, y * 18);
    matrixDrops[i] = y * 18 > matrixCanvas.height && Math.random() > 0.97 ? 0 : y + 1;
  });
}, 50);

function toggleMatrix(force) {
  matrixOn = force ?? !matrixOn;
  matrixCanvas.classList.toggle('active', matrixOn);
  if (matrixOn) {
    mtx.fillStyle = '#000';
    mtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  }
}

// ==============================
// コナミコマンド
// ==============================
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;
document.addEventListener('keydown', (e) => {
  if (e.key === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      trueAwakening();
    }
  } else {
    konamiIdx = e.key === KONAMI[0] ? 1 : 0;
  }
});

function trueAwakening() {
  toggleMatrix(true);
  fireworksShow();
  confettiRain();
  document.body.style.animation = 'none';
  toast('━━━ 真・覚醒モード解放 ━━━', 5000);
  const u = new SpeechSynthesisUtterance('真の力、解放。よくぞ古の呪文にたどり着いた。');
  u.lang = 'ja-JP'; u.rate = 0.9; u.pitch = 0.6;
  speechSynthesis.speak(u);
  setTimeout(() => toggleMatrix(false), 12000);
}

// ==============================
// コマンドパレット
// ==============================
const commands = [
  { icon: 'fa-fire', label: '革命 ─ 花火を打ち上げる', desc: 'fireworks', run: fireworksShow },
  { icon: 'fa-cake-candles', label: '祝福 ─ 紙吹雪を降らせる', desc: 'confetti', run: confettiRain },
  { icon: 'fa-cloud-rain', label: '雨 ─ マトリックスの雨', desc: 'matrix', run: () => { toggleMatrix(); toast(matrixOn ? '電脳の雨が降り始めた…' : '雨は止んだ。'); } },
  { icon: 'fa-moon', label: '闇 ─ 次元「虚空」へ', desc: 'theme', run: () => setTheme('void') },
  { icon: 'fa-fire-flame-curved', label: '業火 ─ 次元「業火」へ', desc: 'theme', run: () => setTheme('inferno') },
  { icon: 'fa-leaf', label: '創世 ─ 次元「創世」へ', desc: 'theme', run: () => setTheme('genesis') },
  { icon: 'fa-sun', label: '黎明 ─ 光の次元へ', desc: 'theme', run: () => setTheme('daybreak') },
  { icon: 'fa-pen-nib', label: '錬成 ─ 編集モード切替', desc: 'edit mode', run: () => $('#edit-fab').click() },
  { icon: 'fa-music', label: '共鳴 ─ BGM切替', desc: 'audio', run: () => $('#audio-btn').click() },
  { icon: 'fa-ghost', label: '降霊 ─ 魂のAI「燐」を呼ぶ', desc: 'AI chat', run: () => $('#chat-fab').click() },
  { icon: 'fa-microphone-lines', label: '肉声 ─ 魂の声を聴く', desc: 'voice', run: () => $('#voice-btn').click() },
  { icon: 'fa-clock-rotate-left', label: '回顧 ─ 旧世界（第四形態）を見る', desc: 'old site', run: () => location.href = '../index.html' },
  { icon: 'fa-arrow-up', label: '帰還 ─ 頂点へ戻る', desc: 'scroll top', run: () => scrollTo({ top: 0, behavior: 'smooth' }) },
  { icon: 'fa-dragon', label: '真・覚醒 ─ 全てを解放する', desc: '???', run: trueAwakening },
];

const cmdPalette = $('#cmd-palette');
const cmdInput = $('#cmd-input');
const cmdList = $('#cmd-list');
let cmdSelected = 0, cmdFiltered = [...commands];

function renderCmdList() {
  cmdList.innerHTML = cmdFiltered.map((c, i) =>
    `<li class="${i === cmdSelected ? 'selected' : ''}" data-i="${i}">
      <i class="fas ${c.icon}"></i>${c.label}<span class="cmd-desc">${c.desc}</span>
    </li>`).join('') || '<li>該当する呪文がない…</li>';
  cmdList.querySelectorAll('li[data-i]').forEach(li => {
    li.addEventListener('click', () => execCmd(parseInt(li.dataset.i)));
  });
  bindCursorHover();
}

function openCmd() {
  cmdPalette.classList.add('open');
  cmdInput.value = '';
  cmdFiltered = [...commands];
  cmdSelected = 0;
  renderCmdList();
  setTimeout(() => cmdInput.focus(), 60);
}
function closeCmd() { cmdPalette.classList.remove('open'); }
function execCmd(i) {
  const c = cmdFiltered[i];
  if (c) { closeCmd(); setTimeout(c.run, 150); }
}

$('#cmd-btn').addEventListener('click', openCmd);
cmdPalette.addEventListener('click', (e) => { if (e.target === cmdPalette) closeCmd(); });
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); }
  if (!cmdPalette.classList.contains('open')) return;
  if (e.key === 'Escape') closeCmd();
  if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelected = Math.min(cmdSelected + 1, cmdFiltered.length - 1); renderCmdList(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelected = Math.max(cmdSelected - 1, 0); renderCmdList(); }
  if (e.key === 'Enter') execCmd(cmdSelected);
});
cmdInput.addEventListener('input', () => {
  const q = cmdInput.value.toLowerCase();
  cmdFiltered = commands.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  cmdSelected = 0;
  renderCmdList();
});

// ==============================
// 魂のAI「燐」
// ==============================
const chatWidget = $('#chat-widget');
const chatBody = $('#chat-body');
const chatInput = $('#chat-input');

$('#chat-fab').addEventListener('click', () => chatWidget.classList.toggle('open'));
$('#chat-close').addEventListener('click', () => chatWidget.classList.remove('open'));

const rinBrain = [
  { match: /(こんにちは|やあ|はじめまして|hello|hi)/i, replies: ['……ああ。挨拶ができる人間は嫌いじゃない。', 'よく来たな。このページの深部へようこそ。'] },
  { match: /(名前|誰|何者|お前)/, replies: ['俺は「燐」。RYOの魂が燃えた時に飛んだ火の粉から生まれた。つまり、副産物だ。だが副産物にも誇りはある。'] },
  { match: /(ryo|りょう|リョウ)/i, replies: ['あいつか。広島の神童で、革命のロックンローラーで、深夜にニーチェを読む男だ。第五形態に覚醒してからは、もう手がつけられん。', 'RYOの話か。あいつのギターは近所迷惑と芸術の境界線上にある。'] },
  { match: /(広島)/, replies: ['広島……あいつの原点座標だ。カープと原爆ドームと川の匂い。どの次元にいても帰る場所らしい。'] },
  { match: /(ギター|音楽|ロック|バンド)/, replies: ['三つのコードで世界は書き換えられる。チャック・ベリーからブルーハーツまで、それが証明し続けてきたことだ。', 'BGMボタンは押したか？あれはRYOの魂の周波数をWeb Audioで再現したものだ。'] },
  { match: /(哲学|ニーチェ|ソクラテス)/, replies: ['深淵を覗く時、深淵もまた君を覗いている……つまり今、俺と君は相互に覗き合っているわけだ。気まずいな。', '「なぜ」と問い続けろ。答えはいつも次の問いの入り口に過ぎん。'] },
  { match: /(編集|edit|書き換え|変更)/, replies: ['右下のペンのボタンを押せ。このページの文字も画像も、君の手で書き換えられる。世界の改変とは、案外簡単なものだ。'] },
  { match: /(花火|fireworks)/, replies: ['Ctrl+Kでコマンドパレットを開いて「革命」と打て。空が燃えるぞ。'] },
  { match: /(隠し|秘密|イースター|コナミ)/, replies: ['↑↑↓↓←→←→BA……これ以上は言えん。古の呪文は自分で唱えるものだ。'] },
  { match: /(すごい|やばい|かっこいい|天才)/, replies: ['当然だ。だが照れる。', 'その感想、RYOに転送しておく。あいつは褒められると三日燃え続ける。'] },
  { match: /(大学|東大|東京)/, replies: ['東京大学工学系研究科システム創成学専攻……いわば宇宙の設計図の閲覧室だ。あいつはそこで毎日設計図を盗み見ている。合法的にな。'] },
  { match: /(好き|愛|love)/i, replies: ['愛か……ニーチェは「愛から為されることは、常に善悪の彼岸に起こる」と言った。つまり、いいんじゃないか。'] },
  { match: /(ばか|アホ|きらい|嫌い)/, replies: ['ほう。だがその罵倒、煩悩百八のネタ帳に追加させてもらった。感謝する。'] },
  { match: /(天気|weather)/, replies: ['俺はページの中に住んでいる。外の天気は知らんが、ここは常に革命日和だ。'] },
  { match: /(なぜ|どうして|why)/i, replies: ['いい質問だ。「なぜ」と問うた時点で、君はもう哲学者の入り口に立っている。'] },
  { match: /(さよなら|バイバイ|じゃあね)/, replies: ['ああ。だが忘れるな、このページは君のlocalStorageに刻まれている。また会うことになる。'] },
];
const rinFallback = [
  '……ふむ。その問いは俺の魂のデータベースの外にあるようだ。だが問い続けることに意味がある。',
  '沈黙もまた回答である、と哲学者なら言うだろう。つまり今のは深い回答だ。',
  'その話題は第六形態で実装予定だ。気長に待て。',
  '言葉にできないこともある。ギターなら弾けるんだがな。',
  '興味深い。だが俺は今、銀河の回転を眺めるのに忙しい。もう一度別の聞き方をしてみろ。',
];

function rinReply(text) {
  for (const rule of rinBrain) {
    if (rule.match.test(text)) {
      return rule.replies[Math.floor(Math.random() * rule.replies.length)];
    }
  }
  return rinFallback[Math.floor(Math.random() * rinFallback.length)];
}

function addChatMsg(text, cls) {
  const div = document.createElement('div');
  div.className = 'chat-msg ' + cls;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return div;
}

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  addChatMsg(text, 'chat-user');
  chatInput.value = '';
  const typing = document.createElement('div');
  typing.className = 'chat-msg chat-ai chat-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;
  setTimeout(() => {
    typing.remove();
    addChatMsg(rinReply(text), 'chat-ai');
  }, 700 + Math.random() * 900);
}
$('#chat-send').addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

// ==============================
// コンタクトフォーム
// ==============================
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const btnText = e.target.querySelector('.submit-btn span');
  const original = btnText.textContent;
  btnText.textContent = '契約成立──';
  e.target.querySelector('.submit-btn').disabled = true;
  confettiRain();
  toast('契約は交わされた。革命の同志よ、ようこそ。');
  setTimeout(() => {
    btnText.textContent = original;
    e.target.querySelector('.submit-btn').disabled = false;
    e.target.reset();
  }, 3000);
});

// ==============================
// 初回訪問メッセージ
// ==============================
const visits = parseInt(localStorage.getItem('ryo5-visits') || '0') + 1;
localStorage.setItem('ryo5-visits', visits);
setTimeout(() => {
  if (visits === 1) toast('初めての観測者よ、ようこそ。Ctrl+Kで呪文書が開く。');
  else toast(`${visits}回目の帰還を確認。おかえり、同志。`);
}, 4500);
