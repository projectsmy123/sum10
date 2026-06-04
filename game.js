(() => {
  'use strict';

  const STORAGE_KEY = 'additionOf10LeaderboardDomV5';
  const MAX_MISSES = 5;
  const MAX_MISTAKES = 5;
  const CORRECT_POINTS = 1000;
  const COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
  const CORRECT_PAIRS = [
    [0, 10], [1, 9], [2, 8], [3, 7], [4, 6], [5, 5],
    [6, 4], [7, 3], [8, 2], [9, 1], [10, 0]
  ];

  const AVATARS = [
    { key: 'boy-red-sunglasses', label: 'Hero Boy', src: 'assets/avatars/boy-red-sunglasses.png', type: 'boy' },
    { key: 'boy-yellow-hoodie', label: 'Nitro Boy', src: 'assets/avatars/boy-yellow-hoodie.png', type: 'boy' },
    { key: 'boy-blue-sunglasses', label: 'Star Hero', src: 'assets/avatars/boy-blue-sunglasses.png', type: 'boy' },
    { key: 'girl-pink-dress', label: 'Sky Girl', src: 'assets/avatars/girl-pink-dress.png', type: 'girl' },
    { key: 'girl-blue-dress', label: 'Magic Girl', src: 'assets/avatars/girl-blue-dress.png', type: 'girl' },
    { key: 'girl-starry-outfit', label: 'Heart Heroine', src: 'assets/avatars/girl-starry-outfit.png', type: 'girl' }
  ];

  const screens = {
    start: document.getElementById('start-screen'),
    tutorial: document.getElementById('tutorial-screen'),
    leaderboard: document.getElementById('leaderboard-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen')
  };

  const els = {
    form: document.getElementById('player-form'),
    name: document.getElementById('player-name'),
    school: document.getElementById('player-school'),
    grade: document.getElementById('player-grade'),
    avatarOptions: document.getElementById('avatar-options'),
    bondList: document.getElementById('bond-list'),
    tutorialStart: document.getElementById('tutorial-start-button'),
    voiceToggle: document.getElementById('voice-toggle'),
    sfxToggle: document.getElementById('sfx-toggle'),
    leaderboardList: document.getElementById('leaderboard-list'),
    leaderboardMessage: document.getElementById('leaderboard-message'),
    finalLeaderboardList: document.getElementById('final-leaderboard-list'),
    world: document.getElementById('game-world'),
    balloonLayer: document.getElementById('balloon-layer'),
    effectLayer: document.getElementById('effect-layer'),
    countdown: document.getElementById('countdown'),
    centerMessage: document.getElementById('center-message'),
    score: document.getElementById('score-value'),
    level: document.getElementById('level-value'),
    misses: document.getElementById('misses-value'),
    mistakes: document.getElementById('mistakes-value'),
    leftDino: document.getElementById('left-dino'),
    rightDino: document.getElementById('right-dino'),
    avatarCursor: document.getElementById('avatar-cursor'),
    finalScore: document.getElementById('final-score'),
    finalAvatar: document.getElementById('final-avatar'),
    achievements: document.getElementById('achievement-list'),
    playAgain: document.getElementById('play-again-button')
  };

  const state = {
    player: null,
    selectedAvatarKey: AVATARS[0].key,
    running: false,
    ending: false,
    score: 0,
    misses: 0,
    mistakes: 0,
    combo: 0,
    bestCombo: 0,
    level: 1,
    elapsed: 0,
    lastTime: 0,
    spawnTimer: 0,
    nextId: 1,
    balloons: [],
    correctQueue: [],
    animationFrame: 0,
    voiceOn: true,
    sfxOn: true,
    audioContext: null,
    lastPraiseAt: 0,
    lastDinoVoiceAt: 0,
    introTimer: 0,
    cursorX: 0,
    cursorY: 0,
    heroDashTimer: 0,
    prevCursorX: 0,
    prevCursorY: 0,
    firebaseReady: false,
    firebaseError: '',
    db: null,
    onlineLeaderboard: [],
    currentHighlightId: null,
    leaderboardUnsubscribe: null
  };

  function showScreen(name) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[name].classList.add('active');
    if (name !== 'game') {
      els.avatarCursor.classList.add('hidden');
    }
  }

  function cleanText(value, fallback = '') {
    return String(value || fallback)
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getAvatarConfig(key) {
    return AVATARS.find(avatar => avatar.key === key) || AVATARS[0];
  }

  function avatarMarkup(key, name = 'Name') {
    const config = getAvatarConfig(key);
    const displayName = cleanText(name, 'Name');
    return `
      <div class="kid-avatar image-avatar ${config.type || ''} ${config.key}" aria-hidden="true">
        <div class="hero-cape"></div>
        <img src="${config.src}" alt="" loading="eager" draggable="false" />
        <div class="shirt-name">${escapeHtml(displayName)}</div>
      </div>
    `;
  }

  function renderAvatarOptions() {
    els.avatarOptions.innerHTML = '';
    const name = cleanText(els.name.value, 'Name');

    AVATARS.forEach(config => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `avatar-choice${config.key === state.selectedAvatarKey ? ' selected' : ''}`;
      button.setAttribute('aria-label', `Choose ${config.label}`);
      button.dataset.avatarKey = config.key;
      button.innerHTML = `${avatarMarkup(config.key, name)}<small>${config.label}</small>`;
      button.addEventListener('click', () => {
        state.selectedAvatarKey = config.key;
        renderAvatarOptions();
      });
      els.avatarOptions.appendChild(button);
    });
  }

  function renderBondList() {
    els.bondList.innerHTML = '';
    CORRECT_PAIRS.forEach(([a, b]) => {
      const chip = document.createElement('div');
      chip.className = 'bond-chip';
      chip.textContent = `${a} + ${b}`;
      els.bondList.appendChild(chip);
    });
  }

  function isFirebaseConfigReady() {
    return Boolean(
      FIREBASE_CONFIG &&
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.projectId &&
      !String(FIREBASE_CONFIG.apiKey).includes('PASTE_') &&
      !String(FIREBASE_CONFIG.projectId).includes('PASTE_')
    );
  }

  function initFirebaseLeaderboard() {
    if (!isFirebaseConfigReady()) {
      state.firebaseReady = false;
      state.firebaseError = 'Firebase config is inserted, but Firebase is not ready yet. Using local leaderboard.';
      state.onlineLeaderboard = getLocalLeaderboard();
      return;
    }

    if (!window.firebase || !window.firebase.firestore) {
      state.firebaseReady = false;
      state.firebaseError = 'Firebase SDK did not load. Using local leaderboard.';
      state.onlineLeaderboard = getLocalLeaderboard();
      return;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(FIREBASE_CONFIG);
      }
      state.db = window.firebase.firestore();
      state.firebaseReady = true;
      state.firebaseError = '';
      startLeaderboardListener();
    } catch (error) {
      state.firebaseReady = false;
      state.firebaseError = 'Firebase could not start. Using local leaderboard.';
      state.onlineLeaderboard = getLocalLeaderboard();
      console.warn('Firebase init error:', error);
    }
  }

  function startLeaderboardListener() {
    if (!state.firebaseReady || !state.db) return;
    if (state.leaderboardUnsubscribe) state.leaderboardUnsubscribe();

    state.leaderboardUnsubscribe = state.db
      .collection(FIREBASE_COLLECTION)
      .orderBy('score', 'desc')
      .limit(10)
      .onSnapshot(snapshot => {
        state.onlineLeaderboard = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          rank: index + 1,
          ...doc.data()
        }));

        renderLeaderboard(els.leaderboardList, state.currentHighlightId);
        renderLeaderboard(els.finalLeaderboardList, state.currentHighlightId);
      }, error => {
        state.firebaseReady = false;
        state.firebaseError = 'Could not read Firebase leaderboard. Using local leaderboard.';
        state.onlineLeaderboard = getLocalLeaderboard();
        renderLeaderboard(els.leaderboardList, state.currentHighlightId);
        renderLeaderboard(els.finalLeaderboardList, state.currentHighlightId);
        console.warn('Leaderboard listener error:', error);
      });
  }

  function getLocalLeaderboard() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveLocalLeaderboard(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 10)));
  }

  function getLeaderboard() {
    if (state.firebaseReady) return state.onlineLeaderboard || [];
    return getLocalLeaderboard();
  }

  function saveLocalScore(entry) {
    const list = getLocalLeaderboard();
    list.push(entry);
    list.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
    saveLocalLeaderboard(list);
    state.onlineLeaderboard = list.slice(0, 10);
    return entry.id;
  }

  async function addScoreToLeaderboard() {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: state.player.name,
      school: state.player.school,
      grade: state.player.grade,
      avatarKey: state.player.avatarKey,
      score: Number(state.score || 0),
      bestCombo: Number(state.bestCombo || 0),
      level: Number(state.level || 1),
      mistakes: Number(state.mistakes || 0),
      misses: Number(state.misses || 0),
      createdAtLocal: new Date().toISOString()
    };

    if (!state.firebaseReady || !state.db) {
      return saveLocalScore(entry);
    }

    try {
      const docRef = await state.db.collection(FIREBASE_COLLECTION).add({
        name: entry.name,
        school: entry.school,
        grade: entry.grade,
        avatarKey: entry.avatarKey,
        score: entry.score,
        bestCombo: entry.bestCombo,
        level: entry.level,
        mistakes: entry.mistakes,
        misses: entry.misses,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        createdAtLocal: entry.createdAtLocal
      });
      return docRef.id;
    } catch (error) {
      console.warn('Firebase score save error:', error);
      state.firebaseError = 'Could not save to Firebase. Saved locally instead.';
      return saveLocalScore(entry);
    }
  }

  function renderLeaderboard(container, highlightId = null) {
    if (!container) return;
    const list = getLeaderboard();
    container.innerHTML = '';

    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-leaderboard';
      empty.textContent = state.firebaseReady
        ? 'No online scores yet. Be the first champion!'
        : 'No local scores yet. Be the first champion!';
      container.appendChild(empty);
      return;
    }

    list.slice(0, 10).forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = `leaderboard-row${entry.id === highlightId ? ' highlight' : ''}`;
      row.innerHTML = `
        <div>#${index + 1}</div>
        <div>${avatarMarkup(entry.avatarKey || AVATARS[0].key, entry.name || 'Name')}</div>
        <div>${escapeHtml(entry.name || 'Player')}<small>${escapeHtml(entry.school || 'School')} · ${escapeHtml(entry.grade || 'Grade')}</small></div>
        <div class="points">${Number(entry.score || 0).toLocaleString()}</div>
      `;
      container.appendChild(row);
    });
  }

  function updateLeaderboardStatusText() {
    const mode = state.firebaseReady ? 'Online leaderboard is live.' : state.firebaseError || 'Using local leaderboard.';
    if (els.leaderboardMessage) {
      els.leaderboardMessage.textContent = `${mode} Game starts soon...`;
    }
  }

  function updateHUD() {
    els.score.textContent = state.score.toLocaleString();
    els.level.textContent = String(state.level);
    els.misses.textContent = iconMeter(state.misses, '🦖');
    els.mistakes.textContent = iconMeter(state.mistakes, '💔');
  }

  function iconMeter(count, icon) {
    const filled = Math.max(0, Math.min(5, count));
    return `${Array(filled).fill(icon).join(' ')}${filled ? ' ' : ''}${Array(5 - filled).fill('⚪').join(' ')}`;
  }

  function initAudio() {
    if (!state.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        state.audioContext = new AudioCtx();
      }
    }
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }
  }

  function playTone(type) {
    if (!state.sfxOn || !state.audioContext) return;

    const ctx = state.audioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    const settings = {
      correct: { start: 720, end: 980, duration: 0.12, volume: 0.055, wave: 'sine' },
      wrong: { start: 180, end: 120, duration: 0.16, volume: 0.05, wave: 'square' },
      countdown: { start: 520, end: 520, duration: 0.1, volume: 0.045, wave: 'sine' },
      dino: { start: 80, end: 42, duration: 0.32, volume: 0.075, wave: 'sawtooth' },
      dinoNibble: { start: 115, end: 72, duration: 0.13, volume: 0.052, wave: 'square' },
      gameover: { start: 240, end: 110, duration: 0.32, volume: 0.055, wave: 'square' }
    }[type] || { start: 500, end: 500, duration: 0.1, volume: 0.04, wave: 'sine' };

    oscillator.type = settings.wave;
    oscillator.frequency.setValueAtTime(settings.start, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, settings.end), now + settings.duration);
    gain.gain.setValueAtTime(settings.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + settings.duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + settings.duration + 0.03);
  }

  function speak(text, options = {}) {
    if (!state.voiceOn || !('speechSynthesis' in window)) return;

    const now = performance.now();
    if (options.kind === 'praise' && now - state.lastPraiseAt < 850) return;
    if (options.kind === 'dino' && now - state.lastDinoVoiceAt < 500) return;
    if (options.kind === 'praise') state.lastPraiseAt = now;
    if (options.kind === 'dino') state.lastDinoVoiceAt = now;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.03;
    utterance.pitch = options.pitch || 1.22;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  function startIntro() {
    showScreen('leaderboard');
    renderLeaderboard(els.leaderboardList);
    updateLeaderboardStatusText();

    window.clearTimeout(state.introTimer);
    state.introTimer = window.setTimeout(() => {
      showScreen('game');
      resetGame();
      runCountdown();
    }, 5000);
  }

  function runCountdown() {
    const steps = ['3', '2', '1', 'GO!'];
    let index = 0;
    els.countdown.classList.remove('hidden');
    els.avatarCursor.classList.remove('hidden');
    setAvatarCursorToCenter();

    function nextStep() {
      const word = steps[index];
      els.countdown.textContent = word;
      els.countdown.style.animation = 'none';
      void els.countdown.offsetWidth;
      els.countdown.style.animation = '';

      playTone('countdown');
      speak(word === 'GO!' ? 'go' : word, { rate: 0.95, pitch: 1.25 });

      index += 1;
      if (index < steps.length) {
        window.setTimeout(nextStep, 850);
      } else {
        window.setTimeout(() => {
          els.countdown.classList.add('hidden');
          beginGameLoop();
        }, 650);
      }
    }

    nextStep();
  }

  function resetGame() {
    state.running = false;
    state.ending = false;
    state.score = 0;
    state.misses = 0;
    state.mistakes = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.level = 1;
    state.elapsed = 0;
    state.lastTime = 0;
    state.spawnTimer = 0;
    state.nextId = 1;
    state.balloons = [];
    state.correctQueue = [];
    state.lastPraiseAt = 0;
    state.lastDinoVoiceAt = 0;
    state.cursorX = 0;
    state.cursorY = 0;
    state.prevCursorX = 0;
    state.prevCursorY = 0;
    clearLayers();
    updateHUD();
    els.avatarCursor.innerHTML = avatarMarkup(state.player.avatarKey, state.player.name);
  }

  function clearLayers() {
    els.balloonLayer.innerHTML = '';
    els.effectLayer.innerHTML = '';
  }

  function beginGameLoop() {
    state.running = true;
    state.lastTime = performance.now();
    state.spawnTimer = 9999;
    state.animationFrame = requestAnimationFrame(tick);
  }

  function tick(timestamp) {
    if (!state.running) return;

    const dt = Math.min(0.04, (timestamp - state.lastTime) / 1000 || 0.016);
    state.lastTime = timestamp;
    state.elapsed += dt;

    const newLevel = Math.floor(state.elapsed / 30) + 1;
    if (newLevel !== state.level) {
      state.level = newLevel;
      updateHUD();
      showCenterMessage(`Level ${state.level}!`, 1000);
    }

    state.spawnTimer += dt * 1000;
    const interval = getSpawnInterval();
    if (state.spawnTimer >= interval) {
      state.spawnTimer = 0;
      spawnBalloon();
    }

    updateBalloons(dt);
    state.animationFrame = requestAnimationFrame(tick);
  }

  function getSpawnInterval() {
    return Math.max(430, 1320 - (state.level - 1) * 135);
  }

  function getBaseSpeed() {
    return 68 + (state.level - 1) * 23;
  }

  function spawnBalloon() {
    const rect = els.world.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const size = width <= 620 ? { w: 82, h: 102 } : { w: 94, h: 116 };
    const isCorrect = Math.random() < Math.min(0.54, 0.36 + state.level * 0.025);
    const pair = isCorrect ? nextCorrectPair() : randomWrongPair();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x = randomInt(12, Math.max(12, Math.floor(width - size.w - 12)));
    const y = -size.h - randomInt(0, 120);
    const id = state.nextId++;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = `balloon ${color}`;
    el.setAttribute('aria-label', `${pair[0]} plus ${pair[1]}`);
    el.innerHTML = `<span class="sum">${pair[0]} + ${pair[1]}</span>`;

    const chaos = 22 + state.level * 5;
    const balloon = {
      id,
      el,
      pair,
      x,
      y,
      width: size.w,
      height: size.h,
      speed: getBaseSpeed() + randomInt(0, 42),
      vx: randomInt(-35, 35),
      vyNoise: 0,
      chaos,
      wobble: randomInt(-16, 16),
      wobbleVelocity: randomInt(-90, 90),
      scalePulse: 1 + Math.random() * 0.04,
      isCorrect,
      active: true
    };

    renderBalloonPosition(balloon);

    el.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      handleBalloonTap(id);
    }, { passive: false });

    state.balloons.push(balloon);
    els.balloonLayer.appendChild(el);
  }

  function nextCorrectPair() {
    if (!state.correctQueue.length) {
      state.correctQueue = shuffle(CORRECT_PAIRS.map(pair => pair.slice()));
    }
    return state.correctQueue.pop();
  }

  function randomWrongPair() {
    const targets = [5, 6, 7, 8, 9, 11, 12, 13, 14, 15];
    for (let i = 0; i < 80; i += 1) {
      const target = targets[Math.floor(Math.random() * targets.length)];
      const a = randomInt(0, 10);
      const b = target - a;
      if (b >= 0 && b <= 10 && a + b !== 10) return [a, b];
    }
    return [4, 5];
  }

  function updateBalloons(dt) {
    const bottom = els.world.clientHeight || window.innerHeight;
    const width = els.world.clientWidth || window.innerWidth;

    for (let i = state.balloons.length - 1; i >= 0; i -= 1) {
      const balloon = state.balloons[i];
      if (!balloon.active) continue;

      // Brownian-style motion: many tiny random impulses with soft damping.
      // The balloon still falls, but the horizontal path is chaotic and unpredictable.
      const randomPushX = (Math.random() - 0.5) * balloon.chaos * 90 * dt;
      const randomPushY = (Math.random() - 0.5) * balloon.chaos * 24 * dt;
      balloon.vx = (balloon.vx + randomPushX) * 0.982;
      balloon.vyNoise = (balloon.vyNoise + randomPushY) * 0.94;

      const maxVX = 58 + state.level * 16;
      balloon.vx = Math.max(-maxVX, Math.min(maxVX, balloon.vx));
      balloon.vyNoise = Math.max(-28, Math.min(34, balloon.vyNoise));

      balloon.x += balloon.vx * dt;
      balloon.y += (balloon.speed + balloon.vyNoise) * dt;

      // Gentle rotational jitter makes the motion feel more chaotic without hurting tapping.
      balloon.wobbleVelocity = (balloon.wobbleVelocity + (Math.random() - 0.5) * 240 * dt) * 0.95;
      balloon.wobble += balloon.wobbleVelocity * dt;
      balloon.wobble = Math.max(-22, Math.min(22, balloon.wobble));

      if (balloon.x < 8) {
        balloon.x = 8;
        balloon.vx = Math.abs(balloon.vx) * 0.92;
      }
      if (balloon.x + balloon.width > width - 8) {
        balloon.x = width - balloon.width - 8;
        balloon.vx = -Math.abs(balloon.vx) * 0.92;
      }

      renderBalloonPosition(balloon);

      if (balloon.y + balloon.height >= bottom - 7) {
        state.balloons.splice(i, 1);
        balloon.active = false;
        if (balloon.isCorrect) {
          swallowCorrectBalloon(balloon);
        } else {
          safeRemove(balloon.el);
        }
      }
    }
  }

  function renderBalloonPosition(balloon) {
    const scale = balloon.scalePulse || 1;
    balloon.el.style.setProperty('--x', `${balloon.x}px`);
    balloon.el.style.setProperty('--y', `${balloon.y}px`);
    balloon.el.style.transform = `translate3d(${balloon.x}px, ${balloon.y}px, 0) rotate(${balloon.wobble || 0}deg) scale(${scale})`;
  }

  function handleBalloonTap(id) {
    if (!state.running) return;

    const index = state.balloons.findIndex(balloon => balloon.id === id);
    if (index < 0) return;

    const balloon = state.balloons[index];
    if (!balloon.active) return;

    balloon.active = false;
    state.balloons.splice(index, 1);
    balloon.el.style.pointerEvents = 'none';

    const centerX = balloon.x + balloon.width / 2;
    const centerY = balloon.y + balloon.height / 2;

    animateHeroPoke(centerX, centerY, () => {
      popAndRemove(balloon.el, balloon.x, balloon.y);
      if (balloon.isCorrect) {
        handleCorrectTap(centerX, centerY);
      } else {
        handleWrongTap(centerX, centerY);
      }
    });
  }


  function animateHeroPoke(targetX, targetY, callback) {
    const startX = state.cursorX || targetX;
    const startY = state.cursorY || targetY;

    const cursorRect = els.avatarCursor.getBoundingClientRect();
    const avatarWidth = cursorRect.width || 86;
    const avatarHeight = cursorRect.height || 112;

    // Position the actual pointed finger of the avatar image onto the balloon.
    const dashX = targetX - avatarWidth * 0.70;
    const dashY = targetY - avatarHeight * 0.24;

    els.avatarCursor.classList.add('dashing');
    moveAvatarCursor(dashX, dashY);
    createNitroFlames(dashX + avatarWidth * 0.20, dashY + avatarHeight * 0.78, true);

    window.clearTimeout(state.heroDashTimer);
    state.heroDashTimer = window.setTimeout(() => {
      createPrickEffect(targetX, targetY);
      callback();
      window.setTimeout(() => {
        moveAvatarCursor(startX, startY);
        els.avatarCursor.classList.remove('dashing');
      }, 100);
    }, 120);
  }

  function handleCorrectTap(x, y) {
    const earned = CORRECT_POINTS;
    state.score += earned;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);

    createHearts(x, y);
    createSparkles(x, y);
    createFloatingText(`+${earned}`, x, y - 10);
    playTone('correct');
    updateHUD();

    if (state.combo === 3) showCenterMessage('Combo x3!', 900);
    if (state.combo === 5) showCenterMessage('Math Hero!', 900);
    if (state.combo === 10) showCenterMessage('Super Star!', 1000);

    speak(`Well done ${state.player.name}`, { kind: 'praise', rate: 1.04, pitch: 1.28 });
  }

  function handleWrongTap(x, y) {
    state.combo = 0;
    state.mistakes += 1;

    createThumbsDown(x, y);
    playTone('wrong');
    updateHUD();

    if (state.mistakes >= MAX_MISTAKES) {
      endGame();
    }
  }

  function swallowCorrectBalloon(balloon) {
    if (!state.running) return;

    state.combo = 0;
    state.misses += 1;
    updateHUD();

    const centerX = balloon.x + balloon.width / 2;
    const worldWidth = els.world.clientWidth || window.innerWidth;
    const dino = centerX < worldWidth / 2 ? els.leftDino : els.rightDino;
    const mouth = getDinoMouthPoint(dino);

    balloon.el.style.pointerEvents = 'none';
    balloon.el.style.zIndex = '42';
    balloon.el.classList.add('being-eaten');
    balloon.el.style.setProperty('--eat-x', `${mouth.x - balloon.width / 2}px`);
    balloon.el.style.setProperty('--eat-y', `${mouth.y - balloon.height / 2}px`);
    balloon.el.style.setProperty('--eat-rotate', `${dino === els.leftDino ? 34 : -34}deg`);
    window.setTimeout(() => safeRemove(balloon.el), 620);

    startDinoChew(dino, mouth.x, mouth.y);

    if (state.misses >= MAX_MISSES) {
      window.setTimeout(endGame, 720);
    }
  }

  function getDinoMouthPoint(dino) {
    const dinoRect = dino.getBoundingClientRect();
    const worldRect = els.world.getBoundingClientRect();
    const isLeftDino = dino === els.leftDino;
    return {
      x: dinoRect.left - worldRect.left + dinoRect.width * (isLeftDino ? 0.82 : 0.18),
      y: dinoRect.top - worldRect.top + dinoRect.height * 0.52
    };
  }

  function startDinoChew(dino, x, y) {
    dino.classList.remove('chew');
    void dino.offsetWidth;
    dino.classList.add('chew');
    window.setTimeout(() => dino.classList.remove('chew'), 1450);

    createChewBits(x, y);
    playTone('dino');
    funnyYummyVoice();
  }

  function funnyYummyVoice() {
    if (state.voiceOn && 'speechSynthesis' in window) {
      const now = performance.now();
      if (now - state.lastDinoVoiceAt > 520) {
        state.lastDinoVoiceAt = now;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Yum yum yummy!');
        utterance.rate = 0.72;
        utterance.pitch = 0.48;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      }
    }

    // Extra comic low-bounce tones make the “yummy” moment funny even if speech voices differ by device.
    if (state.sfxOn) {
      window.setTimeout(() => playTone('dinoNibble'), 110);
      window.setTimeout(() => playTone('dinoNibble'), 260);
      window.setTimeout(() => playTone('dinoNibble'), 410);
    }
  }

  function popAndRemove(el, x, y) {
    el.style.setProperty('--x', `${x}px`);
    el.style.setProperty('--y', `${y}px`);
    el.classList.add('pop');
    window.setTimeout(() => safeRemove(el), 190);
  }

  function safeRemove(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function createHearts(x, y) {
    const hearts = ['💖', '💗', '💓', '💕', '💝', '💞', '💖', '💗', '💓', '💕'];
    hearts.forEach((heart, index) => {
      const node = document.createElement('div');
      node.className = 'heart';
      node.textContent = heart;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.setProperty('--dx', `${randomInt(-120, 120)}px`);
      node.style.setProperty('--dy', `${randomInt(-150, 30)}px`);
      node.style.setProperty('--rot', `${randomInt(-160, 160)}deg`);
      node.style.animationDelay = `${index * 18}ms`;
      els.effectLayer.appendChild(node);
      window.setTimeout(() => safeRemove(node), 1000);
    });
  }

  function createSparkles(x, y) {
    const sparkles = ['✨', '⭐', '✨', '🌟', '✨', '⭐'];
    sparkles.forEach((sparkle, index) => {
      const node = document.createElement('div');
      node.className = 'sparkle';
      node.textContent = sparkle;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.setProperty('--dx', `${randomInt(-95, 95)}px`);
      node.style.setProperty('--dy', `${randomInt(-120, 25)}px`);
      node.style.setProperty('--rot', `${randomInt(-120, 120)}deg`);
      node.style.animationDelay = `${index * 16}ms`;
      els.effectLayer.appendChild(node);
      window.setTimeout(() => safeRemove(node), 900);
    });
  }

  function createThumbsDown(x, y) {
    const node = document.createElement('div');
    node.className = 'thumb';
    node.textContent = '👎';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    els.effectLayer.appendChild(node);
    window.setTimeout(() => safeRemove(node), 900);
  }

  function createChewBits(x, y) {
    const bits = ['🍬', '💥', '✨', '🍭', '✨', '🍬', '😋'];
    bits.forEach((text, index) => {
      const node = document.createElement('div');
      node.className = 'bite';
      node.textContent = text;
      node.style.left = `${x + randomInt(-24, 24)}px`;
      node.style.top = `${y + randomInt(-18, 20)}px`;
      node.style.setProperty('--dx', `${randomInt(-70, 70)}px`);
      node.style.setProperty('--dy', `${randomInt(-80, 35)}px`);
      node.style.animationDelay = `${index * 38}ms`;
      els.effectLayer.appendChild(node);
      window.setTimeout(() => safeRemove(node), 980);
    });
  }

  function createFloatingText(text, x, y) {
    const node = document.createElement('div');
    node.className = 'float-text';
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    els.effectLayer.appendChild(node);
    window.setTimeout(() => safeRemove(node), 950);
  }

  function createNitroFlames(x, y, boost = false) {
    const bursts = boost ? 8 : 4;
    const offsets = [
      { x: -22, y: 18 }, { x: -5, y: 24 }, { x: -27, y: 8 }, { x: -10, y: 12 },
      { x: -18, y: 28 }, { x: 0, y: 30 }, { x: -24, y: 16 }, { x: -7, y: 18 }
    ];

    for (let i = 0; i < bursts; i += 1) {
      const flame = document.createElement('div');
      flame.className = `nitro-flame${boost ? ' boost' : ''}`;
      const off = offsets[i];
      flame.style.left = `${x + off.x + randomInt(-4, 4)}px`;
      flame.style.top = `${y + off.y + randomInt(-4, 4)}px`;
      flame.style.setProperty('--fx', `${randomInt(-34, 20)}px`);
      flame.style.setProperty('--fy', `${randomInt(18, 70)}px`);
      flame.style.setProperty('--scale', `${boost ? 1.25 + Math.random() * 0.5 : 0.95 + Math.random() * 0.35}`);
      flame.style.setProperty('--hue', `${randomInt(-18, 18)}deg`);
      els.effectLayer.appendChild(flame);
      window.setTimeout(() => safeRemove(flame), boost ? 650 : 520);
    }

    const glow = document.createElement('div');
    glow.className = `nitro-glow${boost ? ' boost' : ''}`;
    glow.style.left = `${x - 12}px`;
    glow.style.top = `${y + 18}px`;
    els.effectLayer.appendChild(glow);
    window.setTimeout(() => safeRemove(glow), boost ? 340 : 260);
  }

  function createPrickEffect(x, y) {
    const node = document.createElement('div');
    node.className = 'prick-effect';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerHTML = `
      <span class="impact-ring"></span>
      <span class="spark-a">✦</span>
      <span class="spark-b">✦</span>
      <span class="spark-c">✦</span>
      <span class="pop-text">PRICK!</span>
    `;
    els.effectLayer.appendChild(node);
    window.setTimeout(() => safeRemove(node), 420);
  }

  function showCenterMessage(text, duration = 1200) {
    els.centerMessage.textContent = text;
    els.centerMessage.classList.remove('hidden');
    window.clearTimeout(showCenterMessage.timer);
    showCenterMessage.timer = window.setTimeout(() => {
      els.centerMessage.classList.add('hidden');
    }, duration);
  }

  async function endGame() {
    if (!state.running || state.ending) return;

    state.ending = true;
    state.running = false;
    cancelAnimationFrame(state.animationFrame);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    playTone('gameover');

    state.balloons.forEach(balloon => safeRemove(balloon.el));
    state.balloons = [];
    els.avatarCursor.classList.add('hidden');

    const highlightId = await addScoreToLeaderboard();
    state.currentHighlightId = highlightId;
    els.finalScore.textContent = state.score.toLocaleString();
    els.finalAvatar.innerHTML = avatarMarkup(state.player.avatarKey, state.player.name);
    renderAchievements();
    renderLeaderboard(els.finalLeaderboardList, highlightId);
    showScreen('gameOver');
  }

  function renderAchievements() {
    const badges = [];

    if (state.score >= 10000) badges.push('🎈 10 Balloon Hero');
    if (state.mistakes === 0) badges.push('💎 No Mistakes');
    if (state.bestCombo >= 5) badges.push('🔥 Combo Master');
    if (state.level >= 3) badges.push('⚡ Fast Tapper');
    if (!badges.length) badges.push('⭐ Addition Star');

    els.achievements.innerHTML = '';
    badges.forEach(text => {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = text;
      els.achievements.appendChild(badge);
    });
  }

  function setAvatarCursorToCenter() {
    const width = els.world.clientWidth || window.innerWidth;
    const height = els.world.clientHeight || window.innerHeight;
    moveAvatarCursor(width / 2, height - 120);
  }

  function moveAvatarCursor(x, y) {
    const dx = x - (state.cursorX || x);
    const dy = y - (state.cursorY || y);
    state.prevCursorX = state.cursorX;
    state.prevCursorY = state.cursorY;
    state.cursorX = x;
    state.cursorY = y;
    els.avatarCursor.style.left = `${x}px`;
    els.avatarCursor.style.top = `${y}px`;

    if (state.running && els.avatarCursor && !els.avatarCursor.classList.contains('hidden')) {
      const distance = Math.hypot(dx, dy);
      if (distance > 10) {
        createNitroFlames(x, y, distance > 38);
      }
    }
  }

  function handlePointerMove(event) {
    const rect = els.world.getBoundingClientRect();
    moveAvatarCursor(event.clientX - rect.left, event.clientY - rect.top);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  els.voiceToggle.addEventListener('click', () => {
    state.voiceOn = !state.voiceOn;
    els.voiceToggle.textContent = `Voice: ${state.voiceOn ? 'On' : 'Off'}`;
    els.voiceToggle.setAttribute('aria-pressed', String(state.voiceOn));
    if (!state.voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  els.sfxToggle.addEventListener('click', () => {
    state.sfxOn = !state.sfxOn;
    els.sfxToggle.textContent = `SFX: ${state.sfxOn ? 'On' : 'Off'}`;
    els.sfxToggle.setAttribute('aria-pressed', String(state.sfxOn));
    initAudio();
  });

  els.name.addEventListener('input', renderAvatarOptions);

  els.form.addEventListener('submit', event => {
    event.preventDefault();
    initAudio();

    state.player = {
      name: cleanText(els.name.value, 'Player'),
      school: cleanText(els.school.value, 'School'),
      grade: cleanText(els.grade.value, 'Grade'),
      avatarKey: state.selectedAvatarKey
    };

    showScreen('tutorial');
  });

  els.tutorialStart.addEventListener('click', () => {
    initAudio();
    startIntro();
  });

  els.playAgain.addEventListener('click', () => {
    resetSoftState();
    showScreen('start');
  });

  function resetSoftState() {
    window.clearTimeout(state.introTimer);
    cancelAnimationFrame(state.animationFrame);
    state.running = false;
    state.balloons.forEach(balloon => safeRemove(balloon.el));
    state.balloons = [];
    clearLayers();
    window.clearTimeout(state.heroDashTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  els.world.addEventListener('pointermove', handlePointerMove, { passive: true });
  els.world.addEventListener('pointerdown', handlePointerMove, { passive: true, capture: true });

  window.addEventListener('blur', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  window.addEventListener('resize', () => {
    const width = els.world.clientWidth || window.innerWidth;
    state.balloons.forEach(balloon => {
      balloon.x = Math.min(Math.max(8, balloon.x), Math.max(8, width - balloon.width - 8));
      renderBalloonPosition(balloon);
    });
    setAvatarCursorToCenter();
  });

  initFirebaseLeaderboard();
  renderAvatarOptions();
  renderBondList();
  renderLeaderboard(els.leaderboardList);
  updateLeaderboardStatusText();
  updateHUD();
})();
