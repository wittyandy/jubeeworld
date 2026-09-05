"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startPanel = document.querySelector("#startPanel");
const messagePanel = document.querySelector("#messagePanel");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const soundButton = document.querySelector("#soundButton");
const messageEyebrow = document.querySelector("#messageEyebrow");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");

const W = canvas.width;
const H = canvas.height;
const GRAVITY = 0.72;
const TOTAL_STAGES = 10;
const keys = { left: false, right: false, jump: false };

let state = "start";
let currentStage = 0;
let worldWidth = 2600;
let cameraX = 0;
let score = 0;
let lives = 3;
let bonesCollected = 0;
let platforms = [];
let bones = [];
let apples = [];
let enemies = [];
let stageBanner = 0;
let autoAdvanceTimer;
let lastTime = 0;
let lastUpTap = -Infinity;
let soundOn = true;
let audioContext;
let musicTimer;
let musicStep = 0;

const STAGES = [
  { name: "Sunny Start", theme: "meadow", width: 2500, gaps: [[690, 82], [1510, 88]], enemies: 4, bones: 6 },
  { name: "Daisy Dash", theme: "meadow", width: 2750, gaps: [[570, 88], [1240, 98], [2050, 92]], enemies: 5, bones: 6 },
  { name: "Raccoon Crossing", theme: "meadow", width: 3000, gaps: [[620, 98], [1370, 105], [2210, 102]], enemies: 6, bones: 7 },
  { name: "Hilltop Hurry", theme: "meadow", width: 3200, gaps: [[510, 105], [1120, 110], [1850, 105], [2580, 112]], enemies: 7, bones: 7 },
  { name: "Amber Trail", theme: "autumn", width: 3400, gaps: [[600, 110], [1280, 115], [1990, 118], [2780, 112]], enemies: 8, bones: 8 },
  { name: "Ivy Introduction", theme: "autumn", width: 3600, gaps: [[520, 112], [1090, 120], [1740, 118], [2440, 125], [3090, 112]], enemies: 9, bones: 8 },
  { name: "Falling Leaves", theme: "autumn", width: 3800, gaps: [[610, 118], [1320, 128], [2010, 122], [2700, 132], [3340, 116]], enemies: 10, bones: 9 },
  { name: "Moonlit Mischief", theme: "moonlit", width: 4000, gaps: [[520, 122], [1130, 130], [1810, 135], [2520, 128], [3210, 138]], enemies: 11, bones: 9 },
  { name: "Firefly Flight", theme: "moonlit", width: 4250, gaps: [[600, 128], [1220, 138], [1900, 132], [2590, 142], [3310, 136], [3860, 124]], enemies: 12, bones: 10 },
  { name: "Garden Grand Finale", theme: "moonlit", width: 4500, gaps: [[510, 132], [1080, 142], [1690, 138], [2320, 148], [2960, 142], [3580, 150], [4120, 126]], enemies: 14, bones: 10 }
];

const palettes = {
  meadow: { soilTop: "#8e5a32", soilBottom: "#5f3825", grass: "#55b94f", grassLight: "#8ddd68", edge: "#335e2d" },
  autumn: { soilTop: "#8b5431", soilBottom: "#513021", grass: "#d78a2d", grassLight: "#f3bd4d", edge: "#6b3c24" },
  moonlit: { soilTop: "#4c4b78", soilBottom: "#252746", grass: "#478c73", grassLight: "#78c69a", edge: "#253d48" }
};

const player = {
  x: 80, y: 380, w: 72, h: 68, vx: 0, vy: 0,
  grounded: false, facing: 1, invincible: 0,
  animTime: 0, landingTimer: 0, highJumpUsed: false,
  spawnX: 80, spawnY: 380, big: false, bigTimer: 0, growthPulse: 0
};

function loadSprite(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function loadFrames(folder, count) {
  return Array.from({ length: count }, (_, i) => loadSprite(`assets/${folder}/frame-${i}.png`));
}

const jubeeSprites = loadFrames("jubee-v2", 12);
const enemySprites = {
  squirrel: loadFrames("squirrel-v2", 8),
  raccoon: loadFrames("raccoon", 8),
  ivy: loadFrames("ivy", 8)
};
const boneSprites = loadFrames("bone", 6);
const appleSprites = loadFrames("apple", 6);
const backgroundSprites = {
  meadow: loadSprite("assets/backgrounds/meadow.jpg"),
  autumn: loadSprite("assets/backgrounds/autumn.jpg"),
  moonlit: loadSprite("assets/backgrounds/moonlit.jpg")
};

function pointInGap(x, gaps) {
  return gaps.some(([start, width]) => x > start - 20 && x < start + width + 20);
}

function nearestSafeGroundX(target, gaps) {
  let x = Math.max(160, Math.min(worldWidth - 260, target));
  for (const [start, width] of gaps) {
    if (x > start - 50 && x < start + width + 50) x = start + width + 75;
  }
  return Math.min(x, worldWidth - 260);
}

function getFinishGate() {
  return { x: worldWidth - 96, y: 338, w: 46, h: 120 };
}

function buildStage(index) {
  const spec = STAGES[index];
  worldWidth = spec.width;
  platforms = [];
  bones = [];
  apples = [];
  enemies = [];

  let cursor = 0;
  for (const [gapX, gapWidth] of spec.gaps) {
    platforms.push({ x: cursor, y: 458, w: gapX - cursor, h: 82, ground: true });
    cursor = gapX + gapWidth;
  }
  platforms.push({ x: cursor, y: 458, w: worldWidth - cursor, h: 82, ground: true });

  const raised = [];
  const spacing = Math.max(285, 390 - index * 10);
  for (let x = 330, i = 0; x < worldWidth - 300; x += spacing, i += 1) {
    if (pointInGap(x + 80, spec.gaps)) x += 110;
    const tier = (i + index) % Math.min(3, 2 + Math.floor(index / 3));
    const y = 365 - tier * 43;
    const width = Math.max(135, 180 - index * 3 + (i % 2) * 18);
    const platform = { x, y, w: width, h: 25, ground: false };
    raised.push(platform);
    platforms.push(platform);
  }

  const boneCandidates = [
    ...raised.map((p, i) => ({ x: p.x + p.w / 2, y: p.y - 48, rank: i * 2 })),
    ...Array.from({ length: spec.bones + 4 }, (_, i) => {
      const target = 270 + i * ((worldWidth - 540) / (spec.bones + 3));
      return { x: nearestSafeGroundX(target, spec.gaps), y: 402, rank: i * 2 + 1 };
    })
  ].sort((a, b) => a.x - b.x || a.rank - b.rank);

  for (let i = 0; i < spec.bones; i += 1) {
    const candidate = boneCandidates[Math.floor(i * boneCandidates.length / spec.bones)];
    bones.push({ x: candidate.x, y: candidate.y, collected: false, phase: i * 0.9 });
  }

  const applePlatform = raised[Math.min(raised.length - 1, Math.floor(raised.length * 0.48))];
  if (applePlatform) {
    apples.push({
      x: applePlatform.x + applePlatform.w / 2,
      y: applePlatform.y - 52,
      eaten: false,
      phase: index * 0.7
    });
  }

  const unlockedTypes = index < 2
    ? ["squirrel"]
    : index < 5
      ? ["squirrel", "raccoon"]
      : ["squirrel", "raccoon", "ivy"];

  for (let i = 0; i < spec.enemies; i += 1) {
    const type = unlockedTypes[(i + index) % unlockedTypes.length];
    const useRaised = i % 4 === 2 && raised.length > 0;
    let surface;
    if (useRaised) {
      surface = raised[(i * 3 + index) % raised.length];
    } else {
      const target = 430 + i * ((worldWidth - 760) / Math.max(1, spec.enemies - 1));
      const x = nearestSafeGroundX(target, spec.gaps);
      surface = { x: x - 75, y: 458, w: 150 };
    }

    const w = type === "ivy" ? 58 : type === "raccoon" ? 66 : 62;
    const h = type === "ivy" ? 58 : 50;
    const x = Math.max(surface.x + 8, Math.min(surface.x + surface.w - w - 8, surface.x + surface.w / 2 - w / 2));
    const speedBase = type === "raccoon" ? 1.65 : type === "squirrel" ? 1.2 : 0;
    const direction = i % 2 === 0 ? 1 : -1;
    enemies.push({
      type, x, y: surface.y - h, w, h,
      min: surface.x + 5,
      max: Math.max(surface.x + 6, surface.x + surface.w - w - 5),
      vx: speedBase * (1 + index * 0.055) * direction,
      animTime: i * 7,
      alive: true,
      defeatedTimer: 0
    });
  }
}

function resetPlayer() {
  Object.assign(player, {
    x: 80, y: 380, vx: 0, vy: 0, grounded: false,
    facing: 1, invincible: 0, animTime: 0, landingTimer: 0,
    highJumpUsed: false, spawnX: 80, spawnY: 380,
    big: false, bigTimer: 0, growthPulse: 0
  });
  cameraX = 0;
  lastUpTap = -Infinity;
}

function loadStage(index) {
  stopAutoAdvance();
  currentStage = index;
  lives = 3;
  bonesCollected = 0;
  buildStage(index);
  resetPlayer();
  stageBanner = 145;
  state = "playing";
  Object.assign(keys, { left: false, right: false, jump: false });
  startPanel.classList.add("hidden");
  messagePanel.classList.add("hidden");
  canvas.focus();
  startMusic();
}

function startCampaign() {
  score = 0;
  loadStage(0);
  playSfx("start");
}

function showResult(kind) {
  stopAutoAdvance();
  stopMusic();
  messagePanel.classList.remove("hidden");

  if (kind === "stage") {
    state = "stageClear";
    messageEyebrow.textContent = `STAGE ${currentStage + 1} COMPLETE`;
    messageTitle.textContent = "Great run, Jubee!";
    const boneSummary = bonesCollected === bones.length
      ? `All ${bones.length} bones collected—500-point bonus!`
      : `${bonesCollected} of ${bones.length} bones collected.`;
    messageText.textContent = `${boneSummary} Next: Stage ${currentStage + 2} — ${STAGES[currentStage + 1].name}. Continuing automatically…`;
    restartButton.textContent = "Next Stage";
    playSfx("stageComplete");
    const completedStage = currentStage;
    autoAdvanceTimer = window.setTimeout(() => {
      if (state === "stageClear" && currentStage === completedStage) loadStage(completedStage + 1);
    }, 2200);
  } else if (kind === "won") {
    state = "won";
    messageEyebrow.textContent = "ALL 10 STAGES COMPLETE";
    messageTitle.textContent = "Jubee made it home!";
    messageText.textContent = `You finished the whole adventure with ${score} points.`;
    restartButton.textContent = "Play Again";
    playFanfare();
  } else {
    state = "lost";
    messageEyebrow.textContent = "TRY AGAIN";
    messageTitle.textContent = "The garden gang got Jubee";
    messageText.textContent = `You reached Stage ${currentStage + 1} and scored ${score} points.`;
    restartButton.textContent = "Restart Adventure";
  }
}

function finishStage() {
  if (bonesCollected === bones.length) score += 500;
  if (currentStage === TOTAL_STAGES - 1) showResult("won");
  else showResult("stage");
}

function handleResultButton() {
  stopAutoAdvance();
  if (state === "stageClear" && currentStage < TOTAL_STAGES - 1) loadStage(currentStage + 1);
  else if (state === "won" || state === "lost") startCampaign();
}

function stopAutoAdvance() {
  if (autoAdvanceTimer) window.clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = undefined;
}

function hitPlayer() {
  if (player.invincible > 0 || state !== "playing") return;
  lives -= 1;
  playSfx("hurt");
  if (lives <= 0) {
    showResult("lost");
    return;
  }
  Object.assign(player, {
    x: player.spawnX,
    y: player.spawnY,
    vx: 0,
    vy: -5,
    invincible: 110
  });
}

function ensureAudio() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  } catch (_) {
    return null;
  }
}

function playTone(frequency, duration, type = "sine", volume = 0.05, delay = 0) {
  if (!soundOn) return;
  try {
    const audio = ensureAudio();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const startsAt = audio.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, startsAt);
    gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, startsAt + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration);
  } catch (_) { /* Sound is optional. */ }
}

function playSweep(startFrequency, endFrequency, duration, type = "sine", volume = 0.05, delay = 0) {
  if (!soundOn) return;
  try {
    const audio = ensureAudio();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const startsAt = audio.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, startsAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startsAt + duration);
    gain.gain.setValueAtTime(0.001, startsAt);
    gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startsAt + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration);
  } catch (_) { /* Sound is optional. */ }
}

function playNoise(duration = 0.08, volume = 0.02, filterFrequency = 1200, delay = 0) {
  if (!soundOn) return;
  try {
    const audio = ensureAudio();
    if (!audio) return;
    const length = Math.floor(audio.sampleRate * duration);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const startsAt = audio.currentTime + delay;
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = filterFrequency;
    gain.gain.setValueAtTime(volume, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startsAt + duration);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(startsAt);
  } catch (_) { /* Sound is optional. */ }
}

function playSfx(name) {
  if (name === "jump") {
    playSweep(250, 520, 0.13, "triangle", 0.055);
    playTone(660, 0.06, "sine", 0.025, 0.07);
  } else if (name === "highJump") {
    playSweep(330, 980, 0.22, "triangle", 0.06);
    playTone(1175, 0.12, "sine", 0.035, 0.13);
  } else if (name === "bone") {
    playTone(784, 0.12, "sine", 0.055);
    playTone(1047, 0.16, "triangle", 0.045, 0.06);
    playTone(1319, 0.18, "sine", 0.025, 0.12);
  } else if (name === "stomp") {
    playNoise(0.08, 0.035, 700);
    playSweep(180, 75, 0.13, "square", 0.05);
    playTone(440, 0.1, "triangle", 0.045, 0.06);
  } else if (name === "apple") {
    playSweep(180, 720, 0.42, "triangle", 0.065);
    [392, 523, 659, 784].forEach((note, i) => playTone(note, 0.24, i % 2 ? "triangle" : "sine", 0.045, i * 0.075));
    playNoise(0.18, 0.014, 2600, 0.12);
  } else if (name === "shrink") {
    playSweep(760, 220, 0.34, "triangle", 0.05);
    playTone(196, 0.22, "sine", 0.04, 0.18);
    playNoise(0.12, 0.01, 1100, 0.12);
  } else if (name === "stageComplete") {
    playNoise(0.08, 0.025, 220, 0.01);
    [523, 659, 784, 1047].forEach((note, i) => {
      playTone(note, 0.3, "triangle", 0.06, i * 0.11);
      playTone(note / 2, 0.35, "sine", 0.025, i * 0.11);
    });
    playNoise(0.22, 0.012, 3300, 0.36);
  } else if (name === "hurt") {
    playSweep(310, 90, 0.28, "sawtooth", 0.055);
    playNoise(0.12, 0.025, 450);
  } else if (name === "start") {
    [392, 523, 659].forEach((note, i) => playTone(note, 0.16, "triangle", 0.05, i * 0.07));
  }
}

function playFanfare() {
  [523, 659, 784, 1047].forEach((note, i) => {
    playTone(note, 0.28, "triangle", 0.055, i * 0.1);
    playTone(note / 2, 0.34, "sine", 0.026, i * 0.1);
  });
  playNoise(0.24, 0.012, 3200, 0.31);
}

const musicThemes = {
  meadow: {
    lead: [523, 659, 784, 659, 587, 698, 880, 698, 659, 784, 988, 784, 587, 698, 880, 784],
    bass: [131, 147, 165, 147],
    wave: "triangle"
  },
  autumn: {
    lead: [440, 523, 659, 523, 494, 587, 698, 587, 440, 554, 659, 554, 392, 494, 587, 494],
    bass: [110, 123, 131, 98],
    wave: "sine"
  },
  moonlit: {
    lead: [392, 494, 587, 494, 440, 523, 659, 523, 349, 440, 587, 440, 392, 494, 659, 587],
    bass: [98, 110, 123, 92],
    wave: "triangle"
  }
};

function playMusicBeat() {
  if (!soundOn || state !== "playing") return;
  const theme = musicThemes[STAGES[currentStage].theme];
  const note = theme.lead[musicStep % theme.lead.length];
  playTone(note, 0.19, theme.wave, 0.019);
  if (musicStep % 2 === 0) playTone(note / 2, 0.22, "sine", 0.009);
  if (musicStep % 4 === 0) {
    playTone(theme.bass[(musicStep / 4) % theme.bass.length], 0.34, "sine", 0.03);
    playNoise(0.045, 0.013, 170, 0.01);
  } else if (musicStep % 4 === 2) {
    playNoise(0.065, 0.009, 1800);
  }
  musicStep += 1;
}

function startMusic() {
  stopMusic();
  if (!soundOn) return;
  musicStep = currentStage * 2;
  ensureAudio();
  playMusicBeat();
  musicTimer = window.setInterval(playMusicBeat, Math.max(175, 215 - currentStage * 3));
}

function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = undefined;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;
}

function triggerHighJump() {
  if (state === "playing" && !player.grounded && player.vy < 0 && !player.highJumpUsed) {
    player.vy = -17.2;
    player.highJumpUsed = true;
    playSfx("highJump");
  }
}

function update(dt) {
  if (state !== "playing") return;
  const step = Math.min(dt / 16.67, 1.6);
  const wasGrounded = player.grounded;
  const previousBottom = player.y + player.h;

  const moveDirection = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (moveDirection !== 0) {
    player.facing = moveDirection;
    const desiredSpeed = moveDirection * 4.15;
    const response = player.grounded ? 0.13 : 0.065;
    player.vx += (desiredSpeed - player.vx) * response * step;
  } else {
    player.vx *= Math.pow(player.grounded ? 0.8 : 0.95, step);
  }
  player.vx = Math.max(-4.15, Math.min(4.15, player.vx));

  if (keys.jump && player.grounded) {
    player.vy = -13.7;
    player.grounded = false;
    player.landingTimer = 0;
    playSfx("jump");
  }

  player.vy += GRAVITY * step;
  player.x += player.vx * step;
  player.y += player.vy * step;
  player.x = Math.max(0, Math.min(worldWidth - player.w, player.x));
  player.grounded = false;

  for (const platform of platforms) {
    const nextBottom = player.y + player.h;
    const overlapsX = player.x + player.w - 14 > platform.x && player.x + 14 < platform.x + platform.w;
    if (overlapsX && player.vy >= 0 && previousBottom <= platform.y + 8 && nextBottom >= platform.y) {
      const landingSpeed = player.vy;
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
      player.highJumpUsed = false;
      if (!wasGrounded && landingSpeed > 5) player.landingTimer = 8;
    }
  }

  if (player.y > H + 120) hitPlayer();
  if (player.invincible > 0) player.invincible -= step;
  if (player.landingTimer > 0) player.landingTimer -= step;
  if (player.growthPulse > 0) player.growthPulse -= step;
  if (player.big) {
    player.bigTimer = Math.max(0, player.bigTimer - dt);
    if (player.bigTimer === 0) {
      player.big = false;
      player.growthPulse = 20;
      playSfx("shrink");
    }
  }
  player.animTime += step;

  for (const bone of bones) {
    bone.phase += 0.11 * step;
    if (!bone.collected && intersects(player, { x: bone.x - 19, y: bone.y - 19, w: 38, h: 38 })) {
      bone.collected = true;
      bonesCollected += 1;
      score += 100;
      playSfx("bone");
    }
  }

  for (const apple of apples) {
    apple.phase += 0.09 * step;
    if (!apple.eaten && intersects(player, { x: apple.x - 24, y: apple.y - 24, w: 48, h: 48 })) {
      apple.eaten = true;
      player.big = true;
      player.bigTimer = 5000;
      player.growthPulse = 28;
      score += 300;
      playSfx("apple");
    }
  }

  for (const enemy of enemies) {
    enemy.animTime += step;
    if (!enemy.alive) {
      enemy.defeatedTimer -= step;
      continue;
    }

    if (enemy.type !== "ivy") {
      enemy.x += enemy.vx * step;
      if (enemy.x <= enemy.min || enemy.x >= enemy.max) {
        enemy.x = Math.max(enemy.min, Math.min(enemy.max, enemy.x));
        enemy.vx *= -1;
      }
    }

    const playerHitbox = { x: player.x + 12, y: player.y + 8, w: player.w - 24, h: player.h - 10 };
    if (intersects(playerHitbox, enemy)) {
      const landedFromAbove = player.vy > 1 && previousBottom <= enemy.y + 18;
      if (landedFromAbove) {
        enemy.alive = false;
        enemy.defeatedTimer = 52;
        player.y = enemy.y - player.h;
        player.vy = -9.5;
        score += enemy.type === "ivy" ? 350 : enemy.type === "raccoon" ? 300 : 250;
        playSfx("stomp");
      } else {
        hitPlayer();
      }
    }
  }

  const finishGate = getFinishGate();
  if (intersects({ x: player.x + 8, y: player.y + 6, w: player.w - 16, h: player.h - 6 }, finishGate)) {
    finishStage();
  }

  if (player.grounded && player.x > player.spawnX + 500) {
    player.spawnX = player.x;
    player.spawnY = player.y;
  }

  const targetCamera = Math.max(0, Math.min(worldWidth - W, player.x - W * 0.36));
  cameraX += (targetCamera - cameraX) * 0.085 * step;
  stageBanner = Math.max(0, stageBanner - step);
}

function roundedRect(x, y, w, h, r, fill, stroke, lineWidth = 3) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawBackground() {
  const theme = STAGES[currentStage].theme;
  const image = backgroundSprites[theme];
  if (image.complete && image.naturalWidth) {
    const progress = worldWidth > W ? cameraX / (worldWidth - W) : 0;
    const sourceWidth = image.naturalWidth * 0.88;
    const sourceHeight = sourceWidth * H / W;
    const sourceX = (image.naturalWidth - sourceWidth) * progress;
    const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) * 0.5);
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, W, H);
  } else {
    const fallback = ctx.createLinearGradient(0, 0, 0, H);
    fallback.addColorStop(0, theme === "moonlit" ? "#243783" : "#83d7f7");
    fallback.addColorStop(1, theme === "autumn" ? "#f2a451" : "#dff6ff");
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, W, H);
  }

  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, "rgba(17,32,45,.02)");
  shade.addColorStop(1, "rgba(20,25,30,.16)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}

function drawPlatforms() {
  const palette = palettes[STAGES[currentStage].theme];
  for (const platform of platforms) {
    const soil = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.h);
    soil.addColorStop(0, palette.soilTop);
    soil.addColorStop(1, palette.soilBottom);
    roundedRect(platform.x, platform.y, platform.w, platform.h + 8, platform.ground ? 0 : 10, soil);

    ctx.save();
    ctx.beginPath();
    ctx.rect(platform.x, platform.y, platform.w, platform.h);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,.11)";
    ctx.lineWidth = 3;
    for (let x = platform.x - 20; x < platform.x + platform.w + 30; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, platform.y + 19);
      ctx.lineTo(x + 17, platform.y + 39);
      ctx.lineTo(x + 34, platform.y + 19);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = palette.grass;
    roundedRect(platform.x - 2, platform.y - 3, platform.w + 4, 16, platform.ground ? 0 : 8, palette.grass, palette.edge, 2);
    ctx.fillStyle = palette.grassLight;
    for (let x = platform.x + 4; x < platform.x + platform.w - 5; x += 24) {
      ctx.beginPath();
      ctx.ellipse(x + 7, platform.y + 2, 12, 5, -0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSprite(image, x, y, boxWidth, boxHeight, flip = false, squash = 1) {
  if (!image || !image.complete || !image.naturalWidth) return false;
  const scale = Math.min(boxWidth / image.naturalWidth, boxHeight / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale * squash;
  const left = x + (boxWidth - width) / 2;
  const top = y + boxHeight - height;
  ctx.save();
  if (flip) {
    ctx.translate(left + width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, top, width, height);
  } else {
    ctx.drawImage(image, left, top, width, height);
  }
  ctx.restore();
  return true;
}

function drawBone(bone) {
  const frame = Math.floor(bone.phase) % boneSprites.length;
  const image = boneSprites[frame];
  const bob = Math.sin(bone.phase * 0.72) * 5;
  if (drawSprite(image, bone.x - 25, bone.y - 27 + bob, 50, 50)) return;
  ctx.fillStyle = "#ffd34e";
  roundedRect(bone.x - 18, bone.y - 7 + bob, 36, 14, 7, "#ffd34e", "#7c4a29");
}

function drawApple(apple) {
  const frame = Math.floor(apple.phase) % appleSprites.length;
  const bob = Math.sin(apple.phase * 0.78) * 5;
  if (drawSprite(appleSprites[frame], apple.x - 29, apple.y - 31 + bob, 58, 58)) return;
  ctx.fillStyle = "#e9362b";
  ctx.beginPath();
  ctx.arc(apple.x, apple.y + bob, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(enemy) {
  if (!enemy.alive && enemy.defeatedTimer <= 0) return;
  const frames = enemySprites[enemy.type];
  const frame = enemy.alive
    ? Math.floor(enemy.animTime * (enemy.type === "ivy" ? 0.16 : 0.28)) % 6
    : 6 + Math.floor(enemy.defeatedTimer / 7) % 2;
  const image = frames[frame];
  const moving = enemy.type !== "ivy";
  const boxWidth = enemy.type === "ivy" ? 78 : enemy.type === "raccoon" ? 96 : 92;
  const boxHeight = enemy.alive ? (enemy.type === "ivy" ? 88 : 78) : 58;
  const bounce = enemy.alive ? Math.sin(enemy.animTime * 0.32) * 1.5 : 0;
  drawSprite(
    image,
    enemy.x + (enemy.w - boxWidth) / 2,
    enemy.y + enemy.h - boxHeight + 7 + bounce,
    boxWidth,
    boxHeight,
    moving && enemy.vx < 0
  );
}

function getJubeeFrame() {
  if (state === "won" || state === "stageClear") return 3;
  if (player.landingTimer > 0) return 8;
  if (!player.grounded) {
    if (player.vy < -7) return 5;
    if (player.vy < -1.5) return 9;
    if (player.vy < 4) return 10;
    return 11;
  }
  if (Math.abs(player.vx) > 0.65) {
    const runFrames = [4, 6];
    return runFrames[Math.floor(player.animTime / 14) % runFrames.length];
  }
  return Math.floor(player.animTime / 48) % 2;
}

function drawJubee() {
  if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) return;
  const frame = getJubeeFrame();
  const running = player.grounded && Math.abs(player.vx) > 0.65;
  const growth = player.big ? 1.38 : 1;
  const pulse = player.growthPulse > 0 ? 1 + Math.sin(player.growthPulse * 0.65) * 0.035 : 1;
  const spriteWidth = (running ? 132 : 122) * growth * pulse;
  const spriteHeight = (!player.grounded ? 120 : 112) * growth * pulse;
  const squash = player.landingTimer > 0 ? 0.9 + (8 - player.landingTimer) * 0.012 : 1;
  drawSprite(
    jubeeSprites[frame],
    player.x + (player.w - spriteWidth) / 2,
    player.y + player.h - spriteHeight + 7,
    spriteWidth,
    spriteHeight,
    player.facing < 0,
    squash
  );
}

function drawDoghouse() {
  const x = worldWidth - 250;
  const y = 340;
  ctx.fillStyle = "#b9543d";
  ctx.strokeStyle = "#5b3025";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 28, y + 30);
  ctx.lineTo(x + 70, y - 40);
  ctx.lineTo(x + 166, y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#dc7957";
  ctx.fillRect(x, y + 28, 138, 90);
  ctx.strokeRect(x, y + 28, 138, 90);
  ctx.fillStyle = "#4b2c23";
  ctx.beginPath();
  ctx.arc(x + 69, y + 78, 31, Math.PI, 0);
  ctx.lineTo(x + 100, y + 118);
  ctx.lineTo(x + 38, y + 118);
  ctx.closePath();
  ctx.fill();
  roundedRect(x + 20, y - 22, 98, 25, 12, "#fff3d3", "#5b3025");
  ctx.fillStyle = "#7b3d29";
  ctx.font = "900 17px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("JUBEE", x + 69, y - 4);
}

function drawFinishGate() {
  const gate = getFinishGate();
  const x = gate.x;
  const y = gate.y;
  ctx.save();
  ctx.fillStyle = "#6f432a";
  ctx.strokeStyle = "#3e271c";
  ctx.lineWidth = 3;
  roundedRect(x - 7, y - 12, 12, gate.h + 15, 4, "#765038", "#3e271c");
  roundedRect(x + gate.w - 5, y - 12, 12, gate.h + 15, 4, "#765038", "#3e271c");
  ctx.fillStyle = "#b97842";
  for (let i = 0; i < 4; i += 1) {
    const slatX = x + 4 + i * 10;
    ctx.beginPath();
    ctx.moveTo(slatX, y + 10);
    ctx.lineTo(slatX + 8, y);
    ctx.lineTo(slatX + 8, y + gate.h - 5);
    ctx.lineTo(slatX, y + gate.h - 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#8d572f";
  ctx.fillRect(x, y + 44, gate.w, 9);
  ctx.fillRect(x, y + 83, gate.w, 9);
  roundedRect(x - 14, y - 32, gate.w + 28, 25, 10, "#fff0bf", "#5b3025");
  ctx.fillStyle = "#7b3d29";
  ctx.font = "900 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("FINISH", x + gate.w / 2, y - 15);
  ctx.fillStyle = "#f0bf36";
  ctx.beginPath();
  ctx.arc(x + gate.w - 8, y + 67, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  roundedRect(16, 14, 230, 60, 18, "rgba(255,248,233,.94)", "#684532");
  ctx.font = "900 23px system-ui";
  ctx.textAlign = "left";
  ctx.fillStyle = "#c44737";
  ctx.fillText("♥".repeat(lives), 31, 51);
  ctx.fillStyle = "#3f271e";
  ctx.font = "800 17px system-ui";
  ctx.fillText(`🦴 ${bonesCollected}/${bones.length}`, 133, 50);

  roundedRect(W / 2 - 170, 14, 340, 60, 18, "rgba(255,248,233,.94)", "#684532");
  ctx.textAlign = "center";
  ctx.fillStyle = "#a85f26";
  ctx.font = "900 13px system-ui";
  ctx.fillText(`STAGE ${currentStage + 1} OF ${TOTAL_STAGES}`, W / 2, 37);
  ctx.fillStyle = "#3f271e";
  ctx.font = "900 18px system-ui";
  ctx.fillText(STAGES[currentStage].name, W / 2, 59);

  roundedRect(W - 178, 14, 162, 60, 18, "rgba(255,248,233,.94)", "#684532");
  ctx.textAlign = "center";
  ctx.fillStyle = "#3f271e";
  ctx.font = "800 17px system-ui";
  ctx.fillText(`Score ${score}`, W - 97, 50);

  if (player.big) {
    roundedRect(19, 82, 150, 34, 13, "rgba(255,248,233,.94)", "#a73427");
    ctx.textAlign = "center";
    ctx.fillStyle = "#a73427";
    ctx.font = "900 14px system-ui";
    ctx.fillText(`🍎 BIG JUBEE ${(player.bigTimer / 1000).toFixed(1)}s`, 94, 105);
  }

  if (stageBanner > 0) {
    const alpha = Math.min(1, stageBanner / 25);
    ctx.globalAlpha = alpha;
    roundedRect(W / 2 - 245, H / 2 - 68, 490, 125, 24, "rgba(49,39,31,.78)", "rgba(255,255,255,.9)");
    ctx.fillStyle = "#fff6df";
    ctx.font = "900 17px system-ui";
    ctx.fillText(`STAGE ${currentStage + 1}`, W / 2, H / 2 - 25);
    ctx.font = "900 31px system-ui";
    ctx.fillText(STAGES[currentStage].name, W / 2, H / 2 + 15);
    ctx.font = "700 14px system-ui";
    ctx.fillText(currentStage < 2 ? "Squirrels ahead!" : currentStage < 5 ? "Watch for speedy raccoons!" : "Every garden enemy is here!", W / 2, H / 2 + 43);
  }
  ctx.restore();
}

function draw() {
  drawBackground();
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlatforms();
  drawDoghouse();
  drawFinishGate();
  for (const bone of bones) if (!bone.collected) drawBone(bone);
  for (const apple of apples) if (!apple.eaten) drawApple(apple);
  for (const enemy of enemies) drawEnemy(enemy);
  drawJubee();
  ctx.restore();
  drawHUD();
}

function loop(time) {
  const dt = lastTime ? time - lastTime : 16.67;
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function setKey(code, down) {
  if (["ArrowLeft", "KeyA"].includes(code)) keys.left = down;
  if (["ArrowRight", "KeyD"].includes(code)) keys.right = down;
  if (["Space", "ArrowUp", "KeyW"].includes(code)) keys.jump = down;
}

window.addEventListener("keydown", event => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "ArrowUp" && !event.repeat) {
    const now = performance.now();
    if (now - lastUpTap <= 320) triggerHighJump();
    lastUpTap = now;
  }
  setKey(event.code, true);
});

window.addEventListener("keyup", event => setKey(event.code, false));

function bindHold(id, key) {
  const button = document.querySelector(id);
  let lastPress = -Infinity;
  const press = event => {
    event.preventDefault();
    if (key === "jump") {
      const now = performance.now();
      if (now - lastPress <= 320) triggerHighJump();
      lastPress = now;
    }
    keys[key] = true;
    button.classList.add("pressed");
  };
  const release = event => {
    event.preventDefault();
    keys[key] = false;
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

bindHold("#leftButton", "left");
bindHold("#rightButton", "right");
bindHold("#jumpButton", "jump");
startButton.addEventListener("click", startCampaign);
restartButton.addEventListener("click", handleResultButton);

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.textContent = `Sound: ${soundOn ? "On" : "Off"}`;
  soundButton.setAttribute("aria-label", `Turn sound ${soundOn ? "off" : "on"}`);
  if (soundOn) {
    playSfx("start");
    if (state === "playing") startMusic();
  } else {
    stopMusic();
  }
});

buildStage(0);
resetPlayer();
requestAnimationFrame(loop);
