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
var ballSpeed; // hitrost žogice (nastavimo glede na težavnost)
// Za glitch efekt žogice (offset pri risanju)
var ballGlitchX = 0, ballGlitchY = 0;

// Ploščica
var paddleWidth = 75;
var paddleHeight = 10;
var paddleX;      // realna x koord. ploščice
var paddleSpeed;  // hitrost ploščice (nastavimo skupaj s težavnostjo)
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
// Nastavitev težavnosti
// ==============================
function initDifficulty() {
  // Nastavimo hitrost žogice glede na izbrano težavnost
  var diff = $("#difficultySelect").val();
  if (diff === "easy") {
    ballSpeed = 3;
  } else if (diff === "medium") {
    ballSpeed = 5;
  } else if (diff === "hard") {
    ballSpeed = 8;
  }
  // Hitrost ploščice nastavimo fiksno ob začetku
  paddleSpeed = 5;
}

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
        glitchX: 0,
        glitchY: 0
      };
    }
  }
}

// ==============================
// Funkcija za glitch "poskok"
// ==============================
function applyGlitch(obj, glitchChance) {
  if (Math.random() < glitchChance) {
    obj.glitchX = (Math.random() - 0.5) * 4;
    obj.glitchY = (Math.random() - 0.5) * 4;
  } else {
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
        applyGlitch(b, glitchChanceBricks);

        var realX = brickOffsetLeft + c * (brickWidth + brickPadding);
        var realY = brickOffsetTop + r * (brickHeight + brickPadding);
        var drawX = realX + b.glitchX;
        var drawY = realY + b.glitchY;

        // Shranimo koordinati brez glitcha za kolizijo
        b.x = realX;
        b.y = realY;

        ctx.save();
        ctx.shadowColor = b.bonus ? "#001a66" : "#00fff6";
        ctx.shadowBlur = 10;

        var gradient = ctx.createLinearGradient(drawX, drawY, drawX + brickWidth, drawY + brickHeight);
        if (b.bonus) {
          gradient.addColorStop(0, "#00114f");
          gradient.addColorStop(1, "#00072e");
        } else {
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
  ctx.shadowColor = "#00fff6";
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(drawX, drawY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#00f9ff";
  ctx.fill();
  ctx.closePath();

  ctx.restore();
}

// ==============================
// Risanje ploščice (bluish + glitch)
// ==============================
function drawPaddle() {
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
  ctx.shadowColor = "#00fff6";
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.rect(drawPX, drawPY, paddleWidth, paddleHeight);
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
        if (
          x + ballRadius > b.x &&
          x - ballRadius < b.x + brickWidth &&
          y + ballRadius > b.y &&
          y - ballRadius < b.y + brickHeight
        ) {
          var overlapLeft = (x + ballRadius) - b.x;
          var overlapRight = (b.x + brickWidth) - (x - ballRadius);
          var overlapTop = (y + ballRadius) - b.y;
          var overlapBottom = (b.y + brickHeight) - (y - ballRadius);
  
          var minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
  
          if (minOverlap === overlapLeft) {
              x = b.x - ballRadius;
              dx = -Math.abs(dx);
          } else if (minOverlap === overlapRight) {
              x = b.x + brickWidth + ballRadius;
              dx = Math.abs(dx);
          } else if (minOverlap === overlapTop) {
              y = b.y - ballRadius;
              dy = -Math.abs(dy);
          } else if (minOverlap === overlapBottom) {
              y = b.y + brickHeight + ballRadius;
              dy = Math.abs(dy);
          }
  
          b.status = 0;
          score += b.bonus ? 5 : 1;
          $("#score").text(score);
  
          if (allBricksCleared()) {
            levelUp();
          }
          return;
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

  if (level === 1) {
    score = 0;
  }
  seconds = 0;

  $("#score").text(score);
  $("#timer").text("00:00");
  $("#level").text(level);

  ballGlitchX = 0;
  ballGlitchY = 0;
  paddleGlitchX = 0;
  paddleGlitchY = 0;
}

// ==============================
// Funkcija za podkorake žogice
// ==============================
function updateBallPosition() {
  var subSteps = 3; // Dodatni podkoraki za natančnejše trke

  for (var i = 0; i < subSteps; i++) {
    x += dx / subSteps;
    y += dy / subSteps;

    // Preverjanje trkov z opekami
    collisionDetection();

    // Odbijanje od stranskih robov
    if (x + ballRadius > canvas.width || x - ballRadius < 0) {
      dx = -dx;
    }
    // Odbijanje od zgornjega roba
    if (y - ballRadius < 0) {
      dy = -dy;
    }

    // === Preverjanje trka s ploščico ===
    var paddleTop = canvas.height - paddleHeight;
    if (y + ballRadius >= paddleTop) {
      // Če se žogica nahaja nad ploščico in je horizontalno v območju ploščice
      if (x > paddleX && x < paddleX + paddleWidth) {
        // Postavi žogico tik nad ploščico, da se prepreči "zapletanje"
        y = paddleTop - ballRadius;
        var deltaX = x - (paddleX + paddleWidth / 2);
        dx = deltaX * 0.25; // Dodatni faktor, ki prilagodi horizontalni odboj
        dy = -Math.abs(dy); // Poskrbi, da žogica vedno odbije navzgor
      } else if (y + ballRadius >= canvas.height) {
        // Če žogica sploh preseže dno platna
        gameOver();
        return;
      }
    }
  }
}

// ==============================
// Glavna zanka risanja
// ==============================
function draw() {
  updateBallPosition();

  // Premik ploščice glede na pritisnjene tipke
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleSpeed;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    initDifficulty();
    initGameVariables();
    initBricks();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    $("#startBtn").show();
    $("#difficultySelect").attr("disabled", false);
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

    initDifficulty();
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
      <p>Na vrhu strani lahko izbereš težavnost: Lahko, srednje in težko.<br>
      Uporabi <b>levo (⬅️)</b> in <b>desno (➡️)</b> puščico na tipkovnici, da premikaš ploščico.<br>
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
