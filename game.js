// ======================
//     game.js
// ======================

// Dobimo referenco na <canvas> in kontekst
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Žogica
var ballRadius = 10;
var x, y;    // dejanske koordinate žogice (logika trkov)
var dx, dy;  // smer in hitrost
// Izhodiščna hitrost
var ballSpeed = 4;
// Za glitch efekt žogice (offset pri risanju)
var ballGlitchX = 0, ballGlitchY = 0;

// Ploščica
var paddleWidth = 75;
var paddleHeight = 10;
var paddleX;      // realna x koord. ploščice
var paddleSpeed = 5; 
// Za glitch efekt ploščice
var paddleGlitchX = 0, paddleGlitchY = 0;

// Tipke levo/desno
var rightPressed = false;
var leftPressed = false;

// Opeke
var brickRowCount = 3;
var brickColumnCount = 8;
var brickWidth = 80;
var brickHeight = 30;
var brickPadding = 0;
var brickOffsetTop = 20;
var brickOffsetLeft = 20;

// Polje za shranjevanje opek
var bricks = [];

// Rezultat, čas, nivo
var score = 0;     // Točke
var seconds = 0;   // Štoparica
var level = 1;     
var timerInterval, gameInterval;
var isPlaying = false;
var isPaused = false;

// High score (največ točk v eni igri)
var highScore = localStorage.getItem("highScore") || 0;
$("#highScore").text(highScore);

// ==============================
// Glitch nastavitve
// ==============================
var glitchChanceBricks = 0.03;
var glitchChanceBall   = 0.02;
var glitchChancePaddle = 0.02;

// ==============================
// Inicializacija opek
// ==============================
function initBricks() {
  bricks = [];
  for (var c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (var r = 0; r < brickRowCount; r++) {
      var isBonus = (Math.random() < 0.2); 
      bricks[c][r] = {
        x: 0,
        y: 0,
        status: 1,
        bonus: isBonus,
        glitchX: 0,   // glitch offset v X
        glitchY: 0    // glitch offset v Y
      };
    }
  }
}

// ==============================
// Funkcija za glitch "poskok"
// ==============================
function applyGlitch(obj, glitchChance) {
  if (Math.random() < glitchChance) {
    // Naključen premik ±2 piksla
    obj.glitchX = (Math.random() - 0.5) * 4;
    obj.glitchY = (Math.random() - 0.5) * 4;
  } else {
    // Možnost, da se resetira nazaj
    if (Math.random() < 0.3) {
      obj.glitchX = 0;
      obj.glitchY = 0;
    }
  }
}

// ==============================
// Risanje opek z glitch efektom
// ==============================
function drawBricks() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status === 1) {
        // Glitch za vsako opeko
        applyGlitch(b, glitchChanceBricks);

        var realX = brickOffsetLeft + c * (brickWidth + brickPadding);
        var realY = brickOffsetTop + r * (brickHeight + brickPadding);
        var drawX = realX + b.glitchX;
        var drawY = realY + b.glitchY;

        // Koordinate za kolizijo (brez glitch)
        b.x = realX;
        b.y = realY;

        // NEON STIL
        ctx.save();
        ctx.shadowColor = b.bonus ? "#001a66" : "#00fff6";
        ctx.shadowBlur = 10;

        var gradient = ctx.createLinearGradient(drawX, drawY, drawX + brickWidth, drawY + brickHeight);
        if (b.bonus) {
          // Bonus brick - temna modra
          gradient.addColorStop(0, "#00114f");
          gradient.addColorStop(1, "#00072e");
        } else {
          // Navaden gradient (cyan to blue)
          gradient.addColorStop(0, "#00f9ff");
          gradient.addColorStop(1, "#004b99");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.rect(drawX, drawY, brickWidth, brickHeight);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
      }
    }
  }
}

// ==============================
// Risanje žogice (bluish + glitch)
// ==============================
function drawBall() {
  // Glitch
  if (Math.random() < glitchChanceBall) {
    ballGlitchX = (Math.random() - 0.5) * 4;
    ballGlitchY = (Math.random() - 0.5) * 4;
  } else {
    if (Math.random() < 0.3) {
      ballGlitchX = 0;
      ballGlitchY = 0;
    }
  }

  var drawX = x + ballGlitchX;
  var drawY = y + ballGlitchY;

  ctx.save();
  // Neon senca tudi za žogico
  ctx.shadowColor = "#00fff6";
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(drawX, drawY, ballRadius, 0, Math.PI * 2);
  // Modrikasta barva
  ctx.fillStyle = "#00f9ff";
  ctx.fill();
  ctx.closePath();

  ctx.restore();
}

// ==============================
// Risanje ploščice (bluish + glitch)
// ==============================
function drawPaddle() {
  // Glitch
  if (Math.random() < glitchChancePaddle) {
    paddleGlitchX = (Math.random() - 0.5) * 4;
    paddleGlitchY = (Math.random() - 0.5) * 4;
  } else {
    if (Math.random() < 0.3) {
      paddleGlitchX = 0;
      paddleGlitchY = 0;
    }
  }

  var drawPX = paddleX + paddleGlitchX;
  var drawPY = canvas.height - paddleHeight + paddleGlitchY;

  ctx.save();
  // Neon senca za ploščico
  ctx.shadowColor = "#00fff6";
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.rect(drawPX, drawPY, paddleWidth, paddleHeight);
  // Modrikasta barva
  ctx.fillStyle = "#00f9ff";
  ctx.fill();
  ctx.closePath();

  ctx.restore();
}

// ==============================
// Timer
// ==============================
function updateTimer() {
  seconds++;
  var sec = seconds % 60;
  var min = Math.floor(seconds / 60);
  $("#timer").text(
    (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec)
  );
}

// ==============================
// Preveri trke z opekami
// ==============================
function collisionDetection() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status === 1) {
        // Upoštevamo bounding box (ballRadius)
        if (
          x + ballRadius > b.x &&
          x - ballRadius < b.x + brickWidth &&
          y + ballRadius > b.y &&
          y - ballRadius < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score += b.bonus ? 5 : 1;
          $("#score").text(score);

          if (allBricksCleared()) {
            levelUp();
          }
        }
      }
    }
  }
}

// ==============================
// Ali so vse opeke uničene?
// ==============================
function allBricksCleared() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        return false;
      }
    }
  }
  return true;
}

// ==============================
// Prehod na naslednji nivo
// ==============================
// => Score se NE resetira!
function levelUp() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);

  Swal.fire({
    title: "Nivo " + level + " zaključen!",
    text: "Nadaljujemo na naslednjem nivoju.",
    icon: "success",
    confirmButtonText: "Naprej"
  }).then(() => {
    level++;
    $("#level").text(level);
    ballSpeed += 1;
    paddleSpeed += 1;

    initGameVariables();
    initBricks();
    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
  });
}

// ==============================
// Inicializacija spremenljivk
// ==============================
function initGameVariables() {
  paddleX = (canvas.width - paddleWidth) / 2;
  x = paddleX + paddleWidth / 2;
  y = canvas.height - paddleHeight - ballRadius - 5;

  var randomSign = Math.random() < 0.5 ? -1 : 1;
  dx = randomSign * (ballSpeed * 0.6);
  dy = -ballSpeed;

  // Obnovimo score le, če začenjamo "popolnoma na novo" (level=1)
  if (level === 1) {
    score = 0;
  }
  seconds = 0;

  $("#score").text(score);
  $("#timer").text("00:00");
  $("#level").text(level);

  // Ponastavimo glitch offsete
  ballGlitchX = 0;
  ballGlitchY = 0;
  paddleGlitchX = 0;
  paddleGlitchY = 0;
}

// ==============================
// Funkcija za PODKORAKE žogice
// ==============================
function updateBallPosition() {
  var subSteps = 3; // da ne preskakuje opek

  for (var i = 0; i < subSteps; i++) {
    x += dx / subSteps;
    y += dy / subSteps;

    // 1) Preveri trk z opekami
    collisionDetection();

    // 2) Odbijanje od stranskih robov
    if (x + ballRadius > canvas.width || x - ballRadius < 0) {
      dx = -dx;
    }
    // 3) Odbijanje od zgornjega roba
    if (y - ballRadius < 0) {
      dy = -dy;
    }
    // 4) Preveri trk s ploščico ali game over
    if (y + ballRadius >= canvas.height - paddleHeight) {
      if (
        x + ballRadius > paddleX &&
        x - ballRadius < paddleX + paddleWidth
      ) {
        var deltaX = x - (paddleX + paddleWidth / 2);
        dx = deltaX * 0.15;
        dy = -dy;
      } else {
        gameOver();
        return; // takoj končamo, da ne rišemo naprej
      }
    }
  }
}

// ==============================
// Glavna zanka risanja
// ==============================
function draw() {
  // Najprej premaknemo žogico s PODKORAKI
  updateBallPosition();

  // Nato premik ploščice glede na pritisnjene tipke
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleSpeed;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }

  // Nato narišemo vse
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // === ODSTRANIMO risanje premikajoče se črte ===
  // drawMovingLine(); => TE VRSTICE NI VEČ
  drawBricks();
  drawBall();
  drawPaddle();
}

// ==============================
// Konec igre
// ==============================
function gameOver() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);

  // == Klasični highScore => če je score > highScore, posodobi
  // (Če želiš seštevanje, bi dal: highScore = parseInt(highScore) + score;)
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }

  Swal.fire({
    title: "Igra je končana!",
    text: "Tvoj rezultat: " + score,
    icon: "error",
    confirmButtonText: "Ok"
  }).then(() => {
    isPlaying = false;
    level = 1;
    $("#level").text(level);

    // Nastavimo ballSpeed glede na izbrano težavnost
    var diff = $("#difficultySelect").val();
    if (diff === "easy") {
      ballSpeed = 3;
    } else if (diff === "medium") {
      ballSpeed = 5;
    } else if (diff === "hard") {
      ballSpeed = 8;
    }
    paddleSpeed = 5;

    initGameVariables();
    initBricks();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    $("#startBtn").show();
    $("#difficultySelect").attr("disabled", false);

    // Osveži prikazan highScore
    $("#highScore").text(highScore);
  });
}

// ==============================
// Tipkovni dogodki
// ==============================
document.addEventListener("keydown", function(e) {
  if (e.keyCode === 39) rightPressed = true;
  else if (e.keyCode === 37) leftPressed = true;
}, false);

document.addEventListener("keyup", function(e) {
  if (e.keyCode === 39) rightPressed = false;
  else if (e.keyCode === 37) leftPressed = false;
}, false);

// ==============================
// Začetek igre (startBtn)
// ==============================
$("#startBtn").click(function() {
  if (!isPlaying) {
    isPlaying = true;
    $(this).hide();
    $("#difficultySelect").attr("disabled", true);

    initGameVariables();
    initBricks();

    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
  }
});

// ==============================
// Gumb Pavza
// ==============================
$("#pauseBtn").click(function() {
  if (!isPlaying) return;

  if (!isPaused) {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    isPaused = true;
    $(this).text("Nadaljuj");
  } else {
    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
    isPaused = false;
    $(this).text("Pavza");
  }
});

// ==============================
// Gumb Navodila (#infoBtn)
// ==============================
$("#infoBtn").click(function() {
  Swal.fire({
    title: "Navodila",
    html: `
      <p>Uporabi <b>levo</b> in <b>desno</b> puščico na tipkovnici, da premikaš ploščico.<br>
      Uniči vse opeke, da napreduješ na višji nivo!<br>
      Pazi, da žogica ne pade mimo ploščice.</p>
    `,
    icon: "info",
    confirmButtonText: "Zapri"
  });
});

// ==============================
// Gumb Vizitka (#aboutBtn)
// ==============================
$("#aboutBtn").click(function() {
  Swal.fire({
    title: "Vizitka",
    html: `
      <p>Avtor: Miha Sever, 4.RB<br>
      Šola: ERŠ Nova Gorica<br>
      Github: <a href="https://github.com/miholin" target="_blank">miholin</a></p>
    `,
    icon: "info",
    confirmButtonText: "Zapri"
  });
});
