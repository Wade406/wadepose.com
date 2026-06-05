// ============================================================
// THE ANTIWERK 2
// ============================================================


// ============================================================
// SECTION 1: CONFIG
// ============================================================

const CELL     = 40;
const COLS     = 18;
const ROWS     = 18;
const CANVAS_W = CELL * COLS;
const CANVAS_H = CELL * ROWS;
const WALL_T   = 5;      // wall thickness in pixels
const SHOW_GRID = true;
const MONSTER_SPEED = 0.1;
const GRAVITY_MIN = 8000;
const GRAVITY_MAX = 15000;
const GRAVITY_STRENGTH = 0.25;


// ============================================================
// SECTION 2: GAME STATE & OBJECTS
// ============================================================


let walls = [];

// Player
let ball = { x: 8*CELL + CELL/2, y: 9*CELL - 12, r: 12, vx: 0, vy: 0, speed: 3 };

// Monsters — array so we can add more on click/boundary touch

let monsters = [
  { x: 2*CELL + CELL/2, y: 2*CELL - 12, r: CELL/2, speed: MONSTER_SPEED, certainty: 0.3, stillnessTimer: 1, lastSplit: 0, type: 'hunter' }
];

// Blocker block
block = { x: -100, y: -100, size: CELL + WALL_T, timer: 0, active: false }

// Gravity
let gravityDir = 0;
let lastGravityChange = 0;
let gravityInterval = GRAVITY_MIN;

// Game state
let gameStarted = false;
let gameOver = false;
let gameWon = false;
let showControls = false;
let controlsTimer = 0;
let endScreenTimer = 0;
let lastSpawn = 0;



// ============================================================
// SECTION 4: p5.js ENGINE
// ============================================================

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  buildWallRects();
 monsters = [
  { x: 2*CELL + CELL/2, y: 2*CELL - 12, r: CELL/2, speed: MONSTER_SPEED, 
    certainty: 0.3, stillnessTimer: 1, lastSplit: 0, type: 'hunter' }
];
    lastGravityChange = millis();
  gravityInterval = random(GRAVITY_MIN, GRAVITY_MAX);
}

function draw() {
  background(30);
  if (SHOW_GRID) drawGrid();
  drawWalls();
  drawBlock();

  if (gameStarted && !gameOver && !gameWon) {
    updateBall();
    updateMonster();
    checkGravityChange();
  }

  if (!gameStarted) drawStartScreen();
  if (showControls) drawControls();

  drawBall();
  drawMonster();
  drawBoundary(); 

  if (gameOver || gameWon) {
    drawEndScreen();
    if (endScreenTimer === 0) endScreenTimer = millis();
    if (millis() - endScreenTimer > 60000) {
      resetGame();
      gameStarted = false;
      endScreenTimer = 0;
    }
  }
}


// ============================================================
// SECTION 5: COLLISION
// ============================================================

function checkCollision() {
  // wall collision
  for (let w of walls) {
    let left = w.x, right = w.x + w.w, top = w.y, bottom = w.y + w.h;

    if (ball.x + ball.r > left && ball.x - ball.r < right &&
        ball.y + ball.r > top  && ball.y - ball.r < bottom) {

      let ol = (ball.x + ball.r) - left;
      let or = right - (ball.x - ball.r);
      let ot = (ball.y + ball.r) - top;
      let ob = bottom - (ball.y - ball.r);
      let minO = min(ol, or, ot, ob);

      if (minO === ot)      { ball.y = top    - ball.r; ball.vy = 0; }
      else if (minO === ob) { ball.y = bottom + ball.r; ball.vy = 0; }
      else if (minO === ol) { ball.x = left   - ball.r; ball.vx = 0; }
      else if (minO === or) { ball.x = right  + ball.r; ball.vx = 0; }
    }
  }

  // block collision
  if (block.active) {
    if (millis() - block.timer < 5000) {
      let bLeft = block.x, bRight = block.x + block.size;
      let bTop = block.y, bBottom = block.y + block.size;

      if (ball.x + ball.r > bLeft && ball.x - ball.r < bRight &&
          ball.y + ball.r > bTop  && ball.y - ball.r < bBottom) {

        let ol = (ball.x + ball.r) - bLeft;
        let or = bRight - (ball.x - ball.r);
        let ot = (ball.y + ball.r) - bTop;
        let ob = bBottom - (ball.y - ball.r);
        let minO = min(ol, or, ot, ob);

        if (minO === ot)      { ball.y = bTop    - ball.r; ball.vy = 0; }
        else if (minO === ob) { ball.y = bBottom + ball.r; ball.vy = 0; }
        else if (minO === ol) { ball.x = bLeft   - ball.r; ball.vx = 0; }
        else if (minO === or) { ball.x = bRight  + ball.r; ball.vx = 0; }
      }
    } else {
      block.active = false;
    }
  }

  // exit gap — win condition
  if (gravityDir === 0 && ball.y + ball.r > CANVAS_H) {
    if (ball.x > 9*CELL && ball.x < 10*CELL) {
      if (ball.y > CANVAS_H + 30) gameWon = true;
    } else {
      ball.y = CANVAS_H - ball.r;
      ball.vy = 0;
    }
  }

  if (ball.y - ball.r < 0)        { ball.y = ball.r;            ball.vy = 0; }
  if (ball.x + ball.r > CANVAS_W) { ball.x = CANVAS_W - ball.r; ball.vx = 0; }
  if (ball.x - ball.r < 0)        { ball.x = ball.r;            ball.vx = 0; }
}


// ============================================================
// SECTION 6: MONSTER BEHAVIOR
// ============================================================

function updateMonster() {
  if (gameOver || gameWon) return;

  for (let m of monsters) {
    let speedSq = ball.vx*ball.vx + ball.vy*ball.vy;

    if (m.type === 'hunter') {
      // certainty / stillness
      if (speedSq < 3) {
        m.stillnessTimer += 1/60;
        if (m.stillnessTimer > 1.6) m.certainty = 1.0;
      } else {
        m.stillnessTimer = 0;
        m.certainty = map(speedSq, 0, 400, 0.25, 0.92);
      }

      // movement toward player
      let targetX = ball.x + random(-90 + 170*m.certainty, 90 - 170*m.certainty);
      let targetY = ball.y + random(-90 + 170*m.certainty, 90 - 170*m.certainty);
      let dx = targetX - m.x;
      let dy = targetY - m.y;
      let d = sqrt(dx*dx + dy*dy) || 1;
      m.x += (dx / d) * m.speed;
      m.y += (dy / d) * m.speed;

      // game over check — hunter only
      if (dist(m.x, m.y, ball.x, ball.y) < m.r + ball.r &&
          m.certainty > 0.95 && speedSq < 8) {
        gameOver = true;
      }

    } else {
      // wanderer — random movement
      if (!m.vx) { m.vx = random(-1, 1); m.vy = random(-1, 1); }
      m.x += m.vx * m.speed;
      m.y += m.vy * m.speed;

      // bounce off boundaries
      if (m.x - m.r < 0)        { m.x = m.r;            m.vx *= -1; }
      if (m.x + m.r > CANVAS_W) { m.x = CANVAS_W - m.r; m.vx *= -1; }
      if (m.y - m.r < 0)        { m.y = m.r;            m.vy *= -1; }
      if (m.y + m.r > CANVAS_H) { m.y = CANVAS_H - m.r; m.vy *= -1; }

      // occasionally change direction
      if (random() < 0.01) {
        m.vx = random(-1, 1);
        m.vy = random(-1, 1);
      }

      // wanderer kills player on contact — no certainty check
      if (dist(m.x, m.y, ball.x, ball.y) < m.r + ball.r) {
        gameOver = true;
      }
    }

    // block collision — both types
    if (block.active) {
      let bLeft = block.x, bRight = block.x + block.size;
      let bTop = block.y, bBottom = block.y + block.size;
      if (m.x + m.r > bLeft && m.x - m.r < bRight &&
          m.y + m.r > bTop  && m.y - m.r < bBottom) {
        let ddx = m.x - (bLeft + block.size/2);
        let ddy = m.y - (bTop  + block.size/2);
        let dd = sqrt(ddx*ddx + ddy*ddy) || 1;
        m.x += (ddx / dd) * 4;
        m.y += (ddy / dd) * 4;
        // wanderer bounces off block
        if (m.type === 'wanderer') {
          m.vx *= -1;
          m.vy *= -1;
        }
      }
    }
  }
}


// ============================================================
// SECTION 7: GRAVITY
// ============================================================

function checkGravityChange() {
  if (millis() - lastGravityChange > gravityInterval) {
    let dirs = [0,1,2,3].filter(d => d !== gravityDir);
    gravityDir = dirs[Math.floor(Math.random() * dirs.length)];
    gravityInterval = random(GRAVITY_MIN, GRAVITY_MAX);
    lastGravityChange = millis();
    ball.vx = 0;
    ball.vy = 0;
  }
}

function updateBall() {
  if (gameOver || gameWon) return;

  if (gravityDir === 0)      ball.vy += GRAVITY_STRENGTH;
  else if (gravityDir === 1) ball.vx -= GRAVITY_STRENGTH;
  else if (gravityDir === 2) ball.vy -= GRAVITY_STRENGTH;
  else if (gravityDir === 3) ball.vx += GRAVITY_STRENGTH;

  ball.vx = constrain(ball.vx, -CELL, CELL);
  ball.vy = constrain(ball.vy, -CELL, CELL);

  let move = 0;
  if (keyIsDown(LEFT_ARROW))  move = -ball.speed;
  if (keyIsDown(RIGHT_ARROW)) move = ball.speed;

  if (gravityDir === 0 || gravityDir === 2) ball.vx = move;
  else ball.vy = move;

  let steps = 10;
  for (let i = 0; i < steps; i++) {
    ball.x += ball.vx / steps;
    ball.y += ball.vy / steps;
    checkCollision();
  }
}


// ============================================================
// SECTION 8: MAZE BUILDER FUNCTIONS
// ============================================================

function buildWallRects() {
  walls = [];
  const t = WALL_T;
  const h = t / 2;

  // helper — adds a rect centered on a line
  function addWall(x1, y1, x2, y2) {
    if (y1 === y2) {
      // horizontal
      let x = min(x1, x2);
      let w = abs(x2 - x1);
      walls.push({ x: x, y: y1 - h, w: w, h: t });
    } else {
      // vertical
      let y = min(y1, y2);
      let h2 = abs(y2 - y1);
      walls.push({ x: x1 - h, y: y, w: t, h: h2 });
    }
  }

  // boundary
  addWall(0, 0, COLS*CELL, 0);                        // top
  addWall(0, 0, 0, ROWS*CELL);                        // left
  addWall(COLS*CELL, 0, COLS*CELL, ROWS*CELL);        // right
  addWall(0, ROWS*CELL, 9*CELL, ROWS*CELL);           // bottom left
  addWall(10*CELL, ROWS*CELL, COLS*CELL, ROWS*CELL);  // bottom right

  // interior walls
  addWall(10*CELL, 6*CELL, 10*CELL, 11*CELL);
  addWall(10*CELL, 11*CELL, 5*CELL, 11*CELL);
  addWall(8*CELL, 7*CELL, 6*CELL, 7*CELL);
  addWall(6*CELL, 7*CELL, 6*CELL, 9*CELL);
  addWall(6*CELL, 5*CELL, 12*CELL, 5*CELL);
  addWall(12*CELL, 5*CELL, 12*CELL, 8*CELL);
  addWall(12*CELL, 8*CELL, 11*CELL, 8*CELL);
  addWall(11*CELL, 8*CELL, 11*CELL, 11*CELL);
  addWall(11*CELL, 11*CELL, 13*CELL, 11*CELL);
  addWall(13*CELL, 11*CELL, 13*CELL, 3*CELL);
  addWall(14*CELL, 3*CELL, 16*CELL, 3*CELL);
  addWall(16*CELL, 3*CELL, 16*CELL, 6*CELL);
  addWall(16*CELL, 6*CELL, 15*CELL, 6*CELL);
  addWall(15*CELL, 6*CELL, 15*CELL, 5*CELL);
  addWall(15*CELL, 5*CELL, 14*CELL, 5*CELL);
  addWall(14*CELL, 5*CELL, 14*CELL, 12*CELL);
  addWall(14*CELL, 12*CELL, 8*CELL, 12*CELL);
  addWall(7*CELL, 12*CELL, 4*CELL, 12*CELL);
  addWall(4*CELL, 12*CELL, 4*CELL, 10*CELL);
  addWall(4*CELL, 10*CELL, 6*CELL, 10*CELL);
  addWall(5*CELL, 9*CELL, 5*CELL, 4*CELL);
  addWall(5*CELL, 4*CELL, 9*CELL, 4*CELL);
  addWall(9*CELL, 4*CELL, 9*CELL, 3*CELL);
  addWall(9*CELL, 3*CELL, 3*CELL, 3*CELL);
  addWall(3*CELL, 3*CELL, 3*CELL, 13*CELL);
  addWall(3*CELL, 13*CELL, 2*CELL, 13*CELL);
  addWall(2*CELL, 12*CELL, 1*CELL, 12*CELL);
  addWall(1*CELL, 12*CELL, 1*CELL, 14*CELL);
  addWall(1*CELL, 14*CELL, 4*CELL, 14*CELL);
  addWall(4*CELL, 14*CELL, 4*CELL, 13*CELL);
  addWall(4*CELL, 13*CELL, 10*CELL, 13*CELL);
  addWall(8*CELL, 8*CELL, 8*CELL, 10*CELL);
  addWall(10*CELL, 4*CELL, 10*CELL, 2*CELL);
  addWall(10*CELL, 2*CELL, 15*CELL, 2*CELL);
  addWall(8*CELL, 14*CELL, 11*CELL, 14*CELL);
  addWall(11*CELL, 14*CELL, 11*CELL, 13*CELL);
  addWall(11*CELL, 13*CELL, 15*CELL, 13*CELL);
  addWall(15*CELL, 13*CELL, 15*CELL, 14*CELL);
  addWall(15*CELL, 14*CELL, 12*CELL, 14*CELL);
  addWall(12*CELL, 14*CELL, 12*CELL, 15*CELL);
  addWall(12*CELL, 15*CELL, 7*CELL, 15*CELL);
  addWall(7*CELL, 15*CELL, 7*CELL, 14*CELL);
  addWall(7*CELL, 14*CELL, 5*CELL, 14*CELL);
  addWall(5*CELL, 14*CELL, 5*CELL, 15*CELL);
  addWall(5*CELL, 15*CELL, 0*CELL, 15*CELL);
  addWall(6*CELL, 17*CELL, 2*CELL, 17*CELL);
  addWall(2*CELL, 17*CELL, 2*CELL, 16*CELL);
  addWall(2*CELL, 16*CELL, 13*CELL, 16*CELL);
  addWall(13*CELL, 16*CELL, 13*CELL, 17*CELL);
  addWall(3*CELL, 11*CELL, 1*CELL, 11*CELL);
  addWall(1*CELL, 11*CELL, 1*CELL, 3*CELL);
  addWall(1*CELL, 3*CELL, 2*CELL, 3*CELL);
  addWall(15*CELL, 7*CELL, 15*CELL, 12*CELL);
  addWall(15*CELL, 12*CELL, 17*CELL, 12*CELL);
  addWall(17*CELL, 12*CELL, 17*CELL, 1*CELL);
  addWall(16*CELL, 13*CELL, 16*CELL, 15*CELL);
  addWall(16*CELL, 15*CELL, 13*CELL, 15*CELL);
  addWall(18*CELL, 13*CELL, 17*CELL, 13*CELL);
  addWall(17*CELL, 13*CELL, 17*CELL, 16*CELL);
  addWall(7*CELL, 5*CELL, 7*CELL, 6*CELL);
  addWall(6*CELL, 0*CELL, 6*CELL, 1*CELL);
  addWall(2*CELL, 9*CELL, 2*CELL, 4*CELL);
  addWall(1*CELL, 1*CELL, 1*CELL, 2*CELL);
  addWall(1*CELL, 2*CELL, 7*CELL, 2*CELL);
  addWall(7*CELL, 2*CELL, 7*CELL, 1*CELL);
  addWall(8*CELL, 2*CELL, 9*CELL, 2*CELL);
  addWall(9*CELL, 2*CELL, 9*CELL, 1*CELL);
  addWall(9*CELL, 1*CELL, 13*CELL, 1*CELL);
  addWall(17*CELL, 17*CELL, 15*CELL, 17*CELL);
  addWall(15*CELL, 17*CELL, 15*CELL, 16*CELL);
  addWall(8*CELL, 17*CELL, 8*CELL, 18*CELL);
  addWall(16*CELL, 8*CELL, 15*CELL, 8*CELL);
  addWall(16*CELL, 9*CELL, 17*CELL, 9*CELL);
  addWall(6*CELL, 15*CELL, 6*CELL, 16*CELL);
  addWall(10*CELL, 16*CELL, 10*CELL, 17*CELL);
  addWall(14*CELL, 16*CELL, 14*CELL, 18*CELL);
  addWall(15*CELL, 0*CELL, 15*CELL, 1*CELL);
}




// ============================================================
// SECTION 9: DRAW FUNCTIONS
// ============================================================

function drawGrid() {
  stroke(20); strokeWeight(0.5);
  for (let r = 0; r <= ROWS; r++) line(0, r*CELL, CANVAS_W, r*CELL);
  for (let c = 0; c <= COLS; c++) line(c*CELL, 0, c*CELL, CANVAS_H);

  //noStroke(); fill(0); textSize(10); textAlign(CENTER, CENTER);
  //for (let c = 0; c < COLS; c++) text(c, c*CELL + CELL/2, CELL/2);
  //for (let r = 0; r < ROWS; r++) text(r, CELL/2, r*CELL + CELL/2);
  //let dirs = ['↓ DOWN', '← LEFT', '↑ UP', '→ RIGHT'];
  //fill(255, 180, 0);
  //textSize(14);
  //textAlign(LEFT, CENTER);
  //text('Gravity: ' + dirs[gravityDir], 10, CANVAS_H - 25);
}

function drawBoundary() {
  stroke(0); strokeWeight(5); strokeCap(SQUARE);
  line(0, 0, COLS*CELL, 0);
  line(0, 0, 0, ROWS*CELL);
  line(COLS*CELL, 0, COLS*CELL, ROWS*CELL);
  line(0, ROWS*CELL, 13*CELL, ROWS*CELL);
  line(14*CELL, ROWS*CELL, COLS*CELL, ROWS*CELL);
  // green border
  noFill();
  stroke(0, 255, 100);
  strokeWeight(6);
  rect(3, 3, CANVAS_W - 6, CANVAS_H - 6);

  // exit marker — electric blue
  stroke(0, 200, 255);
  strokeWeight(6);
  line(9*CELL, CANVAS_H - 3, 10*CELL, CANVAS_H - 3);
}

function drawWalls() {
  fill(0); noStroke();
  for (let w of walls) {
    rect(w.x, w.y, w.w, w.h);
  }
}

function drawBlock() {
  if (!block.active) return;
  if (millis() - block.timer > 5000) { block.active = false; return; }
  fill(100, 200, 255, 180);
  noStroke();
  rect(block.x, block.y, block.size, block.size);
}

function drawBall() { // player is the ball
  fill(255, 100, 100);
  noStroke();
  circle(ball.x, ball.y, ball.r * 2);
}

function drawMonster() {
  for (let m of monsters) {
    let alpha = map(m.certainty, 0.2, 1, 100, 255);

    if (m.type === 'wanderer') {
      // Wanderers: larger, teal/green color
      fill(30, 200, 160, 180);
      noStroke();
      circle(m.x, m.y, (m.r + 8) * 2);
    } else {
      // Hunter: original purple, certainty-based sizing
      let sizeBoost = map(m.certainty, 0.2, 1, 0, 4);
      fill(160, 40, 220, alpha);
      noStroke();
      circle(m.x, m.y, (m.r + sizeBoost) * 2);

      if (m.certainty > 0.65) {
        fill(255);
        circle(m.x - 7, m.y - 4, 8);
        circle(m.x + 7, m.y - 4, 8);
        let pupilOffset = m.certainty > 0.9 ? 2 : 0;
        fill(0);
        circle(m.x - 7 + pupilOffset, m.y - 4, 4);
        circle(m.x + 7 + pupilOffset, m.y - 4, 4);
      }

      if (m.certainty > 0.92) {
        fill(255, 60, 60, 80);
        noStroke();
        circle(m.x, m.y, m.r * 2.4);
      }
    }
  }
}

// ============================================================
// SECTION 10: INPUT & RESET
// ============================================================

function keyPressed() {
  if (key === 'r' || key === 'R') resetGame();
}

function resetGame() {
  ball.x = 8*CELL + CELL/2;
  ball.y = 9*CELL - 12;
  ball.vx = 0;
  ball.vy = 0;
  gravityDir = 0;
  lastGravityChange = millis();
  gravityInterval = random(GRAVITY_MIN, GRAVITY_MAX);
  monsters = [
    { x: 2*CELL + CELL/2, y: 2*CELL - 12, r: CELL/2, speed: MONSTER_SPEED,
      certainty: 0.3, stillnessTimer: 1, lastSplit: 0, type: 'hunter' }
  ];
  block.active = false;
  gameWon = false;
  gameOver = false;
  gameStarted = true;
  showControls = true;
  controlsTimer = millis();
  lastSpawn = 0;
}

function mousePressed() {
  if (!gameStarted) {
    let btnX = CANVAS_W/2;
    let btnY = CANVAS_H/2 + 80;
    let btnW = 140;
    let btnH = 50;
    if (mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
        mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
      gameStarted = true;
      showControls = true;
      controlsTimer = millis();
    }
    return;
  }

  if (gameOver || gameWon) {
    let btnX = CANVAS_W/2;
    let btnY = CANVAS_H/2 + 80;
    let btnW = 140;
    let btnH = 50;
    if (mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
        mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
      resetGame();
    }
    return;
  }

  // don't place block on player
  if (dist(mouseX, mouseY, ball.x, ball.y) < CELL) return;

  // place blocker
  block.x = Math.floor(mouseX / CELL) * CELL;
  block.y = Math.floor(mouseY / CELL) * CELL - WALL_T/2;
  block.timer = millis();
  block.active = true;

  // spawn monster if 10 seconds have passed
  if (millis() - lastSpawn > 10000) {
    let corners = [
      { x: CELL, y: CELL },
      { x: CANVAS_W - CELL, y: CELL },
      { x: CELL, y: CANVAS_H - CELL },
      { x: CANVAS_W - CELL, y: CANVAS_H - CELL }
    ];
    let farthest = corners.reduce((a, b) =>
      dist(a.x, a.y, ball.x, ball.y) > dist(b.x, b.y, ball.x, ball.y) ? a : b
    );
    monsters.push({
      x: farthest.x,
      y: farthest.y,
      r: CELL/2,
      speed: MONSTER_SPEED,
      certainty: 0.3,
      stillnessTimer: 1,
      lastSplit: 0,
      type: 'wanderer'
    });
    lastSpawn = millis();
  }
}
// ============================================================
// SECTION 11: WIN / LOSE SCREENS
// ============================================================

function drawEndScreen() {
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, CANVAS_W, CANVAS_H);

  textAlign(CENTER, CENTER);

  if (gameOver) {
    fill(200, 50, 50);
    textSize(50);
    text("WORK WORK WORK", CANVAS_W/2, CANVAS_H/2 - 60);
  } else {
    fill(50, 200, 100);
    textSize(50);
    text("Now Get Back To Work!", CANVAS_W/2, CANVAS_H/2 - 60);
  }

  let btnX = CANVAS_W/2;
  let btnY = CANVAS_H/2 + 80;
  let btnW = 140;
  let btnH = 50;

  fill(70, 70, 70);
  stroke(0, 255, 100);
  strokeWeight(3);
  rect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 10);

  fill(255);
  noStroke();
  textSize(28);
  text("No.", btnX, btnY);
}

function drawStartScreen() {
  fill(0, 0, 0, 200);
  noStroke();
  rect(0, 0, CANVAS_W, CANVAS_H);
  fill(50, 200, 100);
  textSize(50);
  textAlign(CENTER, CENTER);
  text("The AntiWerk 2", CANVAS_W/2, CANVAS_H/2 - 60);
  fill(70, 70, 70);
  stroke(0, 255, 100);
  strokeWeight(3);
  rect(CANVAS_W/2 - 70, CANVAS_H/2 + 55, 140, 50, 10);
  fill(255);
  noStroke();
  textSize(28);
  text("Yes.", CANVAS_W/2, CANVAS_H/2 + 80);
}

function drawControls() {
  if (millis() - controlsTimer > 2000) {
    showControls = false;
    return;
  }
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, CANVAS_W, CANVAS_H);
  fill(0, 200, 255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("Arrow keys to move", CANVAS_W/2, CANVAS_H/2 - 20);
  text("Click to place blocker", CANVAS_W/2, CANVAS_H/2 + 20);
}