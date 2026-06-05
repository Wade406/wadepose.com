// ============================================================
// STARSHIP EIGEN
// starship_eigen.js
// ============================================================
// TABLE OF CONTENTS
// ------------------------------------------------------------
// [CFG]     Configuration block
// [GLB]     Global state variables
// [CORE]    setup() and draw()
// [TRAN]    drawTransmission()   — intro screen
// [PLAY]    drawPlaying()        — main game loop
// [WIN]     drawRescued()        — win screen
// [DIE]     drawDead()           — game over screen
// [LOGIC]   resetGame, spawnAsteroid, spawnPortal, buildRockVerts
// [DRAW]    drawStars, drawAsteroid, drawPortal, drawShipCursor, drawVignette
// [INIT]    initStars
// [INPUT]   mousePressed, windowResized
// ============================================================


// ===== [CFG] CONFIGURATION ==================================
const CONFIG = {
  gameDuration:   180,
  inertiaBlend:   0.75,
  numAsteroids:   14,
  anchorLimit:    6,
  asteroidSizes:  [18, 50, 170],
  driftDecay:     0.98,
  shipScale:      18,
  portalCountdown: 60,   // seconds before portal opens
};


// ===== [GLB] GLOBAL STATE ===================================
let phase = 'transmission';
let lastTime = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let shipX = 0;
let shipY = 0;
let driftX = 0;
let driftY = 0;
let offsetX = 0;
let offsetY = 0;
let mouseVelX = 0;
let mouseVelY = 0;
let stars = [];
let asteroids = [];
let anchorCount = 0;
let portal = null;
let portalTimer = 60;
let gameStartMillis = 0;
let rescueStartMillis = 0;
let lastInputTime = 0;


// ===== [CORE] p5 SETUP AND DRAW =============================
function setup() {
  createCanvas(windowWidth, windowHeight);
  initStars();
  noCursor();
  lastInputTime = millis();
}

function draw() {
  background(0);
  drawStars();
  drawVignette();

  if      (phase === 'transmission') drawTransmission();
  else if (phase === 'playing')      drawPlaying();
  else if (phase === 'rescued')      drawRescued();
  else if (phase === 'dead')         drawDead();
  else if (phase === 'closed')       drawClosed();
}


// ===== [TRAN] TRANSMISSION SCREEN ===========================
function drawTransmission() {
  let cx = width / 2;
  let cy = height / 2;

  let blink = frameCount % 60 < 30;

  // header
  fill(0, 255, 80);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(11);
  text('DIMENSIONAL TRANSIT AUTHORITY — EMERGENCY CHANNEL 144', cx, cy - 220);

  // divider
  stroke(0, 255, 80, 80);
  strokeWeight(1);
  line(cx - 320, cy - 145, cx + 320, cy - 145);
  noStroke();

  // blinking queue message
  if (blink) {
    fill(0, 255, 80);
    textSize(40);
    text('▶ TRANSMISSION IN QUEUE', cx, cy - 270);
  }

  // body text
  fill(0, 200, 60);
  textSize(15);
  textAlign(LEFT, TOP);
  let margin = cx - 300;
  let ty = cy - 88;
  let lines = [
    'WARNING: Dropping out of dimensional transit.',
    'Coordinates compromised. Entry into unstable asteroid field probable.',
    '',
        'Mouse movement steers the vessel. Faster movement = more vector applied.',
    
    'Drift coefficient: ' + CONFIG.inertiaBlend.toFixed(2) + '  — correction will lag.',
    '',
    'FIRING PROTOCOL: Click to deploy temporal anchor on nearest asteroid.',
    'Anchored objects enter TIME DISSOCIATION — frozen in place.',
    'WARNING: Ship caught in dilation field will be pulled to collapse.',
    'Maximum simultaneous anchors: ' + CONFIG.anchorLimit,
    '',
    'RESCUE WINDOW: Jump coordinates arrive in ' + CONFIG.portalCountdown + ' seconds.',
    'Navigate to portal once it appears to escape the field.',
  ];

  for (let i = 0; i < lines.length; i++) {
    fill(lines[i].startsWith('WARNING') ||
         lines[i].startsWith('FIRING') ||
         lines[i].startsWith('RESCUE')
         ? color(0, 255, 80)
         : color(0, 180, 50));
    text(lines[i], margin, ty + i * 17);
  }

  // click prompt
  textAlign(CENTER, CENTER);
  let promptBlink = frameCount % 90 < 60;
  if (promptBlink) {
    fill(0, 255, 80);
    textSize(28);
    text('[ ACKNOWLEDGE ]  (left-click)', cx, cy + 240);
    textSize(20);
text('[ EJECT ]  (ESC)', cx, cy + 290);

textSize(15);
fill(0, 150, 60);
text('Starship Eigen developed by Wade Pose with lots of LLM help', cx, cy + 320

);
  }
}


// ===== [PLAY] PLAYING STATE =================================
function drawPlaying() {
  // ---- timer & portal spawn ----
  if (millis() - lastInputTime > 120000) {
  phase = 'transmission';
  return;
}
  let elapsed = (millis() - gameStartMillis) / 1000;
  portalTimer = max(0, CONFIG.portalCountdown - elapsed);

  if (portalTimer <= 0 && !portal) {
    spawnPortal();
  }

  // ---- asteroids eaten by portal ----
  if (portal) {
    asteroids = asteroids.filter(
      a => dist(a.x, a.y, portal.x, portal.y) > portal.radius + a.r
    );
  }

  // ---- draw world ----
  drawPortal();
  for (let i = 0; i < asteroids.length; i++) {
    drawAsteroid(asteroids[i]);
  }

  // ---- win check ----
  if (portal && dist(shipX, shipY, portal.x, portal.y) < portal.radius) {
    phase = 'rescued';
    return;
  }

  // ---- mouse velocity ----
  mouseVelX = mouseX - prevMouseX;
  mouseVelY = mouseY - prevMouseY;
  prevMouseX = mouseX;
  prevMouseY = mouseY;

  // ---- inject mouse into drift ----
  driftX = driftX * CONFIG.inertiaBlend + mouseVelX * (1 - CONFIG.inertiaBlend);
  driftY = driftY * CONFIG.inertiaBlend + mouseVelY * (1 - CONFIG.inertiaBlend);

  // ---- gravitational pull from frozen shields ----
  for (let a of asteroids) {
    if (a.anchored) {
      let dx = a.x - shipX;
      let dy = a.y - shipY;
      let d = sqrt(dx * dx + dy * dy);
      let pullRadius = a.r * 3;

      if (d < pullRadius) {
        // death: ship enters shield core
        if (d < a.r * 0.8) {
          phase = 'dead';
          return;
        }

        // force falls off with distance squared, clamped to prevent runaway
        let dClamp = max(d, a.r);
        let force = (a.r * 0.8) / (dClamp * dClamp) * 50;
        driftX += (dx / d) * force;
        driftY += (dy / d) * force;
      }
    }
  }

  // ---- idle drift: large asteroids pull idle ships ----
  let mouseSpd = sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY);
  if (mouseSpd < 2) {
    let biggest = null;
    let biggestScore = 0;
    for (let a of asteroids) {
      if (!a.anchored) {
        let d = dist(shipX, shipY, a.x, a.y);
        if (d < 500) {
          // score = size / distance — big + close wins
          let score = a.r / d;
          if (score > biggestScore) {
            biggestScore = score;
            biggest = a;
          }
        }
      }
    }
    if (biggest) {
      let dx = biggest.x - shipX;
      let dy = biggest.y - shipY;
      let d = sqrt(dx * dx + dy * dy);
      if (d > 1) {
        let force = (biggest.r / d) * 0.3;
        driftX += (dx / d) * force;
        driftY += (dy / d) * force;
      }
    }
  }

  // ---- ship-asteroid collision (instant death) ----
  for (let a of asteroids) {
    if (!a.anchored && dist(shipX, shipY, a.x, a.y) < a.r) {
      phase = 'dead';
      return;
    }
  }

  // ---- drift decay ----
  driftX *= CONFIG.driftDecay;
  driftY *= CONFIG.driftDecay;

  // ---- ship position ----
  offsetX += driftX;
  offsetY += driftY;
  shipX = mouseX + offsetX;
  shipY = mouseY + offsetY;

  // ---- draw ship ----
  let heading = atan2(driftY, driftX);
  drawShipCursor(shipX, shipY, heading);

  // ---- HUD ----
  noStroke();
  textAlign(CENTER, TOP);
  textSize(13);
  if (portalTimer > 0) {
    fill(0, 255, 80);
    text('RESCUE COORDINATES IN: ' + ceil(portalTimer), width / 2, 20);
  } else {
    let blink = frameCount % 40 < 25;
    fill(blink ? color(255, 200, 255) : color(180, 150, 220));
    textSize(16);
    text('▶ NAVIGATE TO PORTAL', width / 2, 20);
  }

  // ---- warning overlay: last 3 seconds before portal ----
  if (portalTimer > 0 && portalTimer <= 3) {
    let flashAlpha = 180 + sin(frameCount * 0.8) * 40;
    let cx = width / 2;
    let cy = height / 2;
    let panelW = width * 0.5;
    let panelH = 180;

    noStroke();
    fill(40, 30, 0, flashAlpha * 0.7);
    rect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);

    stroke(255, 200, 0, flashAlpha);
    strokeWeight(3);
    noFill();
    rect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);

    noStroke();
    fill(255, 220, 50, flashAlpha);
    textAlign(CENTER, CENTER);
    textSize(42);
    text('⚠ PORTAL OPENING ⚠', cx, cy - 30);

    fill(255, 180, 0, flashAlpha * 0.9);
    textSize(60);
    text(ceil(portalTimer), cx, cy + 35);
  }
}


// ===== [WIN] RESCUED SCREEN =================================
function drawRescued() {
  // track when rescue phase began
  if (rescueStartMillis === 0) {
    rescueStartMillis = millis();
  }
  let elapsed = (millis() - rescueStartMillis) / 1000;
  
  let cx = width / 2;
  let cy = height / 2;
  
  // ---- BEAT 1 (0-2s): JUMP COORDINATES LOCKED ----
  if (elapsed < 2) {
    let flash = sin(elapsed * 8) * 0.5 + 0.5;
    fill(0, 255, 80, 180 + flash * 75);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(38);
    text('JUMP COORDINATES LOCKED', cx, cy);
    return;
  }
  
  // ---- BEAT 2 (2-5s): warp streaks + TRANSIT SUCCESSFUL ----
  if (elapsed < 5) {
    // streaking stars — same look as transmission screen
    for (let i = 0; i < stars.length; i++) {
      let s = stars[i];
      let x1 = cx + cos(s.angle) * s.distance;
      let y1 = cy + sin(s.angle) * s.distance;
      let x2 = cx + cos(s.angle) * (s.distance + s.len * 3);
      let y2 = cy + sin(s.angle) * (s.distance + s.len * 3);
      stroke(s.bright, s.bright, s.bright + 20);
      strokeWeight(0.8);
      line(x1, y1, x2, y2);
    }
    
    let fadeIn = constrain((elapsed - 2) * 2, 0, 1);
    fill(0, 255, 80, 255 * fadeIn);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(28);
    text('DIMENSIONAL TRANSIT SUCCESSFUL', cx, cy);
    return;
  }
  
  // ---- BEAT 3 (5s+): WELCOME BACK / REPORT FOR DUTY ----
  fill(0, 255, 80);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text('WELCOME BACK', cx, cy - 40);
  
  fill(0, 220, 80);
  textSize(18);
  text('REPORT FOR DUTY', cx, cy);
  
  // blinking prompt appears after a beat
  if (elapsed > 6) {
    let blink = frameCount % 90 < 60;
    if (blink) {
      fill(0, 255, 80);
      textSize(13);
      text('[ DODGE DUTY ROSTER ]', cx, cy + 50);
    }
  }
}


// ===== [DIE] DEAD SCREEN ====================================
function drawDead() {
  let cx = width / 2;
  let cy = height / 2;

  fill(255, 60, 60);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text('HULL INTEGRITY: ZERO', cx, cy - 60);

  fill(200, 80, 80);
  textSize(14);
  text('TEMPORAL FIELD COLLAPSE', cx, cy - 20);
  text('DIMENSIONAL TRANSIT FAILED', cx, cy + 5);
  
  fill(220, 150, 80);
  textSize(13);
  text('You owe the Transit Authority one ship.', cx, cy + 45);

  let blink = frameCount % 90 < 60;
  if (blink) {
    fill(255, 60, 60);
    textSize(14);
    text('[ TRY HARDER ]', cx, cy + 85);
  }
}

function drawClosed() {
  background(0);
  fill(0, 255, 80);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(24);
  text('EJECTED INTO THE VOID', width / 2, height / 2);
}
// ===== [LOGIC] GAME LOGIC ===================================
function resetGame() {
  asteroids = [];
  rescueStartMillis = 0;
  anchorCount = 0;
  portal = null;
  portalTimer = CONFIG.portalCountdown;
  gameStartMillis = millis();
  
  // spawn asteroids first
  for (let i = 0; i < CONFIG.numAsteroids; i++) {
    spawnAsteroid();
  }
  
  // push any asteroid too close to ship start position
  let safeRadius = 250;
  let cx = width / 2;
  let cy = height / 2;
  for (let a of asteroids) {
    let d = dist(a.x, a.y, cx, cy);
    if (d < safeRadius + a.r) {
      // kick it outward along the angle from center
      let angle = atan2(a.y - cy, a.x - cx);
      a.x = cx + cos(angle) * (safeRadius + a.r + 50);
      a.y = cy + sin(angle) * (safeRadius + a.r + 50);
    }
  }
}

function buildRockVerts(r) {
  let verts = [];
  let n = floor(random(7, 12));
  for (let i = 0; i < n; i++) {
    let a = (TWO_PI / n) * i + random(-0.3, 0.3);
    let d = r * random(0.7, 1.0);
    verts.push({ a, d });
  }
  return verts;
}

function spawnAsteroid() {
  let size = random(CONFIG.asteroidSizes);

  // color by size
  let hue;
  if (size === CONFIG.asteroidSizes[0]) {
    hue = color(0, 180, 255);      // small = electric cyan/blue
  } else if (size === CONFIG.asteroidSizes[1]) {
    hue = color(80, 255, 60);      // medium = radioactive green
  } else {
    hue = color(255, 60, 200);     // large = hot magenta
  }

  // speed by size
  let spd;
  if (size === CONFIG.asteroidSizes[0]) {
    spd = random(2.5, 6.5);      // small = fast and sneaky
  } else if (size === CONFIG.asteroidSizes[1]) {
    spd = random(1.0, 2.0);      // medium = moderate
  } else {
    spd = random(0.3, 0.9);      // large = slow and ominous
  }

  let angle = random(TWO_PI);

  asteroids.push({
    x:        random(size, width - size),
    y:        random(size, height - size),
    vx:       cos(angle) * spd,
    vy:       sin(angle) * spd,
    r:        size,
    hue:      hue,
    anchored: false,
    vertices: buildRockVerts(size),
  });
}

function spawnPortal() {
  let attempts = 0;
  let x, y;
  while (attempts < 50) {
    x = random(150, width - 150);
    y = random(150, height - 150);

    if (dist(x, y, shipX, shipY) < 400) {
      attempts++;
      continue;
    }

    let bad = false;
    for (let a of asteroids) {
      if (dist(x, y, a.x, a.y) < a.r + 80) {
        bad = true;
        break;
      }
    }
    if (bad) {
      attempts++;
      continue;
    }

    break;
  }

  portal = { x: x, y: y, radius: 50 };
}


// ===== [DRAW] DRAWING HELPERS ===============================
function drawStars() {
  let cx = width / 2;
  let cy = height / 2;

  for (let i = 0; i < stars.length; i++) {
    let s = stars[i];

    if (phase === 'transmission') {
      // streaks — still in dimensional transit
      let x1 = cx + cos(s.angle) * s.distance;
      let y1 = cy + sin(s.angle) * s.distance;
      let x2 = cx + cos(s.angle) * (s.distance + s.len);
      let y2 = cy + sin(s.angle) * (s.distance + s.len);

      stroke(s.bright, s.bright, s.bright + 20);
      strokeWeight(0.8);
      line(x1, y1, x2, y2);
    } else {
      // dots — dropped into normal space
      noStroke();
      fill(s.bright, s.bright, s.bright + 20);
      ellipse(s.dotX, s.dotY, 1.5, 1.5);
    }
  }
}

function drawAsteroid(a) {
  if (!a.anchored) {
    a.x += a.vx;
    a.y += a.vy;
  }

  // screen wrap
  if (a.x < -a.r) a.x = width + a.r;
  if (a.x > width + a.r) a.x = -a.r;
  if (a.y < -a.r) a.y = height + a.r;
  if (a.y > height + a.r) a.y = -a.r;

  push();
  translate(a.x, a.y);

  if (a.anchored) {
    // drained gray rock
    stroke(140, 140, 140);
    noFill();
    strokeWeight(1.5);
    beginShape();
    for (let v of a.vertices) {
      vertex(cos(v.a) * v.d, sin(v.a) * v.d);
    }
    endShape(CLOSE);

    // gravitational zone rings — flickery
    let flicker = sin(frameCount * 0.15) * 0.5 + 0.5;
    stroke(200, 200, 220, 60 + flicker * 60);
    strokeWeight(1);
    noFill();
    ellipse(0, 0, a.r * 6, a.r * 6);
    stroke(180, 180, 200, 30 + flicker * 40);
    ellipse(0, 0, a.r * 4, a.r * 4);
  } else {
    stroke(a.hue);
    noFill();
    strokeWeight(1.5);
    beginShape();
    for (let v of a.vertices) {
      vertex(cos(v.a) * v.d, sin(v.a) * v.d);
    }
    endShape(CLOSE);
  }

  pop();
}

function drawPortal() {
  if (!portal) return;

  push();
  translate(portal.x, portal.y);

  // iridescent color cycle
  let t = frameCount * 0.02;
  let r = 128 + sin(t) * 127;
  let g = 128 + sin(t + TWO_PI / 3) * 127;
  let b = 128 + sin(t + 2 * TWO_PI / 3) * 127;

  // breathing pulse
  let pulse = 1 + sin(frameCount * 0.08) * 0.15;
  let size = portal.radius * pulse;

  // outer glow rings
  noFill();
  strokeWeight(1);
  for (let i = 3; i > 0; i--) {
    stroke(r, g, b, 60 / i);
    ellipse(0, 0, size * (2 + i * 0.5), size * (2 + i * 0.5));
  }

  // core ring
  stroke(r, g, b, 220);
  strokeWeight(2);
  ellipse(0, 0, size * 2, size * 2);

  // inner shimmer
  stroke(255, 255, 255, 180);
  strokeWeight(1);
  ellipse(0, 0, size * 1.2, size * 1.2);

  pop();
}

function drawShipCursor(x, y, heading) {
  push();
  translate(x, y);
  rotate(heading + HALF_PI);

  let s = CONFIG.shipScale;

  // engine glow
  let glow = abs(sin(frameCount * 0.15));
  noStroke();
  fill(0, 100, 255, 30 * glow);
  ellipse(0, s * 0.6, s * 1.2, s * 0.8);

  // ship body
  stroke(180, 220, 255);
  strokeWeight(1.5);
  fill(10, 20, 40);
  beginShape();
  vertex(0, -s);
  vertex(s * 0.45, s * 0.6);
  vertex(0, s * 0.3);
  vertex(-s * 0.45, s * 0.6);
  endShape(CLOSE);

  // wing details
  stroke(100, 160, 220, 150);
  strokeWeight(1);
  line(0, -s * 0.3, s * 0.4, s * 0.5);
  line(0, -s * 0.3, -s * 0.4, s * 0.5);

  // cockpit
  noStroke();
  fill(0, 180, 255, 200);
  ellipse(0, -s * 0.3, s * 0.3, s * 0.4);

  // engine flame
  fill(0, 100 + glow * 155, 255, 180 * glow);
  ellipse(0, s * 0.55, s * 0.25, s * 0.35 * glow);

  pop();
}

function drawVignette() {
  let g = drawingContext.createRadialGradient(
    width / 2, height / 2, height * 0.3,
    width / 2, height / 2, height * 0.85
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.75)');
  drawingContext.fillStyle = g;
  drawingContext.fillRect(0, 0, width, height);
}


// ===== [INIT] STAR INITIALIZATION ===========================
function initStars() {
  stars = [];
  let cx = width / 2;
  let cy = height / 2;

  for (let i = 0; i < 200; i++) {
    let angle = random(TWO_PI);
    let distance = random(20, max(width, height));
    let len = random(15, 40);

    let dotX = cx + cos(angle) * distance;
    let dotY = cy + sin(angle) * distance;

    stars.push({
      angle:    angle,
      distance: distance,
      len:      len,
      bright:   random(150, 255),
      dotX:     dotX,
      dotY:     dotY,
    });
  }
}


// ===== [INPUT] INPUT HANDLERS ===============================
function mousePressed() {
  // transmission → playing
  lastInputTime = millis();
  if (phase === 'transmission') {
    phase = 'playing';
    resetGame();
        lastTime = millis();
    shipX = mouseX;
    shipY = mouseY;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    driftX = 0;
    driftY = 0;
    offsetX = 0;
    offsetY = 0;
    return;
  }

  // playing: freeze nearest unfrozen asteroid within 300px
  if (phase === 'playing') {
    if (anchorCount >= CONFIG.anchorLimit) return;
    let nearest = null;
    let nearestD = Infinity;
    for (let a of asteroids) {
      if (!a.anchored) {
        let d = dist(shipX, shipY, a.x, a.y);
        if (d < nearestD) {
          nearestD = d;
          nearest = a;
        }
      }
    }
    if (nearest && nearestD < 300) {
      nearest.anchored = true;
      anchorCount++;
    }
    return;
  }

  // dead/rescued → back to transmission for replay
  if (phase === 'dead' || phase === 'rescued') {
    phase = 'transmission';
    return;
  }
}

function mouseMoved() {
  lastInputTime = millis();
}

function keyPressed() {
  lastInputTime = millis();

  if (keyCode === ESCAPE) {
    if (phase === 'playing') {
      phase = 'transmission';
    } else {
      phase = 'closed';
      noLoop();
    }
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initStars();
}