// Globalne spremenljivke
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Dodane spremenljivke za premikajočo se črto
var lineX = 0;
var lineSpeed = 2;

// Žogica
var ballRadius = 10;
var x, y;
var dx, dy;
var ballSpeed = 2;  // začetna hitrost (nastavi se glede na težavnost)

// Dodana nova spremenljivka za hitrost ploščice (paddle)
var paddleSpeed = 5;  // privzeta hitrost ploščice, sedaj počasnejša

// Ploščica
var paddleWidth = 75;
var paddleHeight = 10;
var paddleX;
var rightPressed = false;
var leftPressed = false;

// Opeke
var brickRowCount = 3;
var brickColumnCount = 5;
var brickWidth = 75;
var brickHeight = 20;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;
var bricks = [];

// Timer, točke in nivo
var score = 0;
var seconds = 0;
var level = 1;
var timerInterval, gameInterval;
var isPlaying = false;

// Najboljši rezultat shranjen v localStorage
var highScore = localStorage.getItem("highScore") || 0;
$("#highScore").html(highScore);

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
      if (bricks[c][r].status == 1) {
        var brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        var brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.fillStyle = bricks[c][r].bonus ? "#FFD700" : "#0095DD";
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// Risanje bele žogice
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";  // Bela barva
  ctx.fill();
  ctx.closePath();
}

// Risanje bele ploščice
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#fff"; // Bela barva
  ctx.fill();
  ctx.closePath();
}

// Risanje premikajoče se bele črte
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

// Prikaz točk
function drawScore() {
  $("#score").html(score);
}

// Timer funkcija
function updateTimer() {
  seconds++;
  var sec = seconds % 60;
  var min = Math.floor(seconds / 60);
  $("#timer").html((min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec));
}

// Collision detection za opeke
function collisionDetection() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status == 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score += b.bonus ? 5 : 1;
          drawScore();
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
    title: 'Nivo ' + level + ' zaključen!',
    text: 'Nadaljujemo na naslednjem nivoju.',
    icon: 'success',
    confirmButtonText: 'Naprej'
  }).then(() => {
    level++;
    $("#level").html(level);
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
  dx = ballSpeed;
  dy = -ballSpeed;
  paddleX = (canvas.width - paddleWidth) / 2;
  score = 0;
  seconds = 0;
  $("#score").html(score);
  $("#timer").html("00:00");
  $("#level").html(level);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMovingLine();
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  if (y + dy < ballRadius) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius) {
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

  // Uporaba spremenljivke paddleSpeed za počasnejše premikanje ploščice
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleSpeed;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }
}

function gameOver() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  Swal.fire({
    title: 'Igra je končana!',
    text: "Tvoj rezultat: " + score,
    icon: 'error',
    confirmButtonText: 'Igraj znova'
  }).then(() => {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      $("#highScore").html(highScore);
    }
    isPlaying = false;
  });
}

document.addEventListener("keydown", function(e) {
  if (e.keyCode == 39) rightPressed = true;
  else if (e.keyCode == 37) leftPressed = true;
}, false);

document.addEventListener("keyup", function(e) {
  if (e.keyCode == 39) rightPressed = false;
  else if (e.keyCode == 37) leftPressed = false;
}, false);

$("#startBtn").click(function() {
  if (!isPlaying) {
    isPlaying = true;
    initGameVariables();
    initBricks();
    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
  }
});

$("#pauseBtn").click(function() {
  if (isPlaying) {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    isPlaying = false;
    $("#pauseBtn").text("Nadaljuj");
  } else {
    isPlaying = true;
    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
    $("#pauseBtn").text("Pavza");
  }
});

$("#resetBtn").click(function() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  isPlaying = false;
  level = 1;
  ballSpeed = 2;
  initGameVariables();
  initBricks();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  $("#pauseBtn").text("Pavza");
});

function chooseDifficulty() {
  Swal.fire({
    title: 'Izberi težavnost',
    input: 'select',
    inputOptions: {
      easy: 'Enostavno',
      medium: 'Srednje',
      hard: 'Težko'
    },
    inputPlaceholder: 'Izberi težavnost',
    showCancelButton: false,
    confirmButtonText: 'Izberi'
  }).then((result) => {
    if (result.value) {
      var diff = result.value;
      // Nastavi hitrost žogice glede na težavnost
      if(diff === 'easy'){
        ballSpeed = 1.5; // počasnejša hitrost za enostavno
      } else if(diff === 'medium'){
        ballSpeed = 2.5;
      } else if(diff === 'hard'){
        ballSpeed = 3.5;
      }
      // Paddle hitrost naj bo na splošno počasnejša
      paddleSpeed = 5;
      
      Swal.fire({
        title: 'Težavnost nastavljena!',
        text: 'Izbrana težavnost: ' + (diff === 'easy' ? 'Enostavno' : diff === 'medium' ? 'Srednje' : 'Težko'),
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

$(document).ready(function() {
   chooseDifficulty();
});
