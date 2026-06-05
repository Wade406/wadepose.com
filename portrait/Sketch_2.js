function setup() {
  createCanvas(600, 800);
  chinSpeedY = random(0.001, 0.004);
  chinSpeedX = random(0.001, 0.004);
}

function draw() {
  background(35, 25, 55);
  
  // Grid
  stroke(255, 255, 255, 40);
  strokeWeight(0.0);
  noFill();
  for (let x = 0; x <= width; x += width/13) line(x, 0, x, height);
  for (let y = 0; y <= height; y += height/10) line(0, y, width, y);

  // Shoulders - large dark triangle
fill(20, 20, 35);  // near black, dark jacket
noStroke();
triangle(
  2, 700,   // bottom left corner
  600, 650,  // bottom right corner
  380, 520   // peak - lines up with nose
);

// Lt Chest Higth Lite
noStroke();
fill(45, 35, 90);
triangle(
  300, 670,  // bottom left
  300, 730,  // top right up near temple
  2, 699   // bottom
);

//Rt Chest /  - base layer
fill(20, 20, 35);  //
noStroke();
rect(230, 650, 369, 200);


//Lt Chest /  - base layer
fill(20, 20, 35);  //
noStroke();
rect(2, 699, 369, 200);


// Shadow side - left face plane
fill(120, 20, 80);
noStroke();
rect(180 + sin(frameCount * 0.0021) * 5, 270, 100, 230);

// Shadow left lower face plane
noStroke();
fill(90, 15, 65);
triangle(
  290, 470,  // bottom left
  190, 480,  // top right up near temple
  240, 630   // bottom
);

//cheel / face plane - base layer
fill(140, 110, 60);  // mid warm tone
noStroke();
rect(270, 420, 130, 200);  // spans full width behind brow

// Forehead / face plane - base layer
fill(180, 80, 20);  // mid warm tone
noStroke();
rect(270, 270, 220, 160);  // spans full width behind brow

// Brow ridge - dark triangle over left eye
fill(60, 0, 120);  // very dark
noStroke();
triangle(
  360, 450,  // bottom rt
  390, 360,  // top rt
  270, 360   // left
);
  
  // Nose highlight triangle - bright/light tone
fill(240, 180, 60);  // warm light -
noStroke();
triangle(
  237 - sin(frameCount * 0.0015) * 6, 510 + sin(frameCount * 0.001) * 8,
  270 - sin(frameCount * 0.0015) * 6, 375 + sin(frameCount * 0.002) * 8,
  305 - sin(frameCount * 0.0015) * 6, 500 + sin(frameCount * 0.0025) * 8
);


  // Beard / mustache area - white beard
fill(200, 220, 240);  // off-white
noStroke();
rect(240 + sin(frameCount * chinSpeedX) * 5, 550 + sin(frameCount * chinSpeedY) * 5, 138, 80);

// Hair - dark left side
fill(45, 35, 90);
noStroke();
rect(190, 180 + sin(frameCount * 0.005) * 4, 120, 100);

// Lit side face plane - right side connector
fill(180, 170, 150);  // warm mid-light
noStroke();
rect(395 - sin(frameCount * 0.0019) * 5, 220, 100, 300);

// Porkchop
noStroke();
fill(100, 200, 180);
triangle(
  490, 470,  // bottom left
  410, 480,  // top right up near temple
  380, 640   // bottom
);

// Hair - silver right side
fill(80, 160, 120);
noStroke();
rect(320, 174 + sin(frameCount * 0.01) * 4, 160, 100);

  // Eyes
  noStroke();
  fill(0, 255, 200);  // dark iris
  ellipse(228 + sin(frameCount * 0.002) * 8, 395, 48, 32);  // left eye
  ellipse(350, 380 + sin(frameCount * 0.003) * 6, 50, 35);  // right eye

  // Title
fill(180, 180, 255);  // soft lavender text
noStroke();
let titleSize = 24 + sin(frameCount * 0.002) * 10;
textSize(titleSize);
textAlign(CENTER);
text('Self Portrait', 300, 45);

// Title underline
stroke(180, 180, 255);  // same lavender as the title text
strokeWeight(1);
let underlineWidth = 75 + sin(frameCount * 0.002) * 30;
line(300 - underlineWidth, 55, 300 + underlineWidth, 55);

  // Name
fill(180, 180, 255);  // soft lavender text
noStroke();
textSize(22);
textAlign();
text('Wade Pose', 500, 778);

// Point before signature
strokeWeight(5);
stroke(180, 180, 255);
point(430, 771);
}