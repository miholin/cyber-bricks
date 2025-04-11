// Globalne spremenljivke
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Črta
var lineX = 0;
var lineSpeed = 2;

// Žogica
var ballRadius = 10;
var x, y;
var dx, dy;
// Privzeto nastavimo "medium" => 2.5
var ballSpeed = 2.5;

// Ploščica
var paddleWidth = 75;
var paddleHeight = 10;
var paddleX;
var paddleSpeed = 5;

// Tipke levo/desno
var rightPressed = false;
var leftPressed = false;

// Opeke
var brickRowCount = 3;
var brickWidth = 75;
var brickHeight = 20;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;
var brickColumnCount = Math.floor((canvas.width - 2 * brickOffsetLeft + brickPadding) / (brickWidth + brickPadding)); // Preveri širino in robove
var bricks = [];

// Rezultat, čas, nivo
var score = 0;
var seconds = 0;
var level = 1;
var timerInterval, gameInterval;
var isPlaying = false;

// High score
var highScore = localStorage.getItem("highScore") || 0;
$("#highScore").text(highScore);

// Inicializacija opek
function initBricks() {
  bricks = [];
  for (var c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (var r = 0; r < brickRowCount; r++) {
      var isBonus = (Math.random() < 0.2);
      bricks[c][r] = { x: 0, y: 0, status: 1, bonus: isBonus };
    }
  }
}

// Risanje opek
function drawBricks() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status == 1) {
        var brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        var brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        b.x = brickX;
        b.y = brickY;
        ctx.fillStyle = b.bonus ? "#FFD700" : "#0095DD";
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// Risanje žogice
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

// Risanje ploščice
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

// Risanje premikajoče se črte
function drawMovingLine() {
  ctx.beginPath();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.moveTo(lineX, 0);
  ctx.lineTo(lineX, canvas.height);
  ctx.stroke();
  ctx.closePath();

  lineX += lineSpeed;
  if (lineX > canvas.width) {
    lineX = 0;
  }
}

// Timer
function updateTimer() {
  seconds++;
  var sec = seconds % 60;
  var min = Math.floor(seconds / 60);
  $("#timer").text(
    (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec)
  );
}

// Porušene opeke?
function collisionDetection() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status == 1) {
        if (
          x > b.x && x < b.x + brickWidth &&
          y > b.y && y < b.y + brickHeight
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

function allBricksCleared() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) {
        return false;
      }
    }
  }
  return true;
}

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
    // Malo povišamo ballSpeed
    ballSpeed += 1;
    initGameVariables();
    initBricks();
    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
  });
}

function initGameVariables() {
  x = canvas.width / 2;
  y = canvas.height - 30;
  dx = Math.random() < 0.5 ? -ballSpeed : ballSpeed;
  dy = -ballSpeed;
  paddleX = (canvas.width - paddleWidth) / 2;
  score = 0;
  seconds = 0;
  $("#score").text(score);
  $("#timer").text("00:00");
  $("#level").text(level);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMovingLine();
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  // Odbijanje od stranskih robov
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  // Zgornji rob
  if (y + dy < ballRadius) {
    dy = -dy;
  } 
  // Spodnji rob => ali udari ploščico ali je konec igre
  else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      var deltaX = x - (paddleX + paddleWidth / 2);
      dx = deltaX * 0.15;
      dy = -dy;
    } else {
      gameOver();
    }
  }

  x += dx;
  y += dy;

  // Ploščica levo/desno
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleSpeed;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }
}

function gameOver() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);

  // Posodobimo highscore
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    $("#highScore").text(highScore);
  }

  Swal.fire({
    title: "Igra je končana!",
    text: "Tvoj rezultat: " + score,
    icon: "error",
    confirmButtonText: "Ok"
  }).then(() => {
    // Samodejno "ponastavi" igro
    isPlaying = false;
    
    // Ponastavimo na začetek
    level = 1;
    $("#level").text(level);

    // Začetni ballSpeed je odvisen od izbrane težavnosti
    var diff = $("#difficultySelect").val();
    if (diff === "easy") {
      ballSpeed = 1.5;
    } else if (diff === "medium") {
      ballSpeed = 2.5;
    } else if (diff === "hard") {
      ballSpeed = 3.5;
    }

    initGameVariables();
    initBricks();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spet pokažemo gumb ZAČNI in dovolimo spremembo težavnosti
    $("#startBtn").show();
    $("#difficultySelect").attr("disabled", false);
  });
}

// Tipkovni dogodki
document.addEventListener("keydown", function(e) {
  if (e.keyCode === 39) rightPressed = true;
  else if (e.keyCode === 37) leftPressed = true;
}, false);

document.addEventListener("keyup", function(e) {
  if (e.keyCode === 39) rightPressed = false;
  else if (e.keyCode === 37) leftPressed = false;
}, false);

// Začetek igre
$("#startBtn").click(function() {
  if (!isPlaying) {
    isPlaying = true;

    // Skrij gumb ZAČNI
    $(this).hide();

    // Onemogoči izbiro težavnosti
    $("#difficultySelect").attr("disabled", true);

    initGameVariables();
    initBricks();

    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
  }
});
