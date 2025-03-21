// Globalne spremenljivke
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Žogica
var ballRadius = 10;
var x, y;
var dx, dy;
var ballSpeed = 2;  // začetna hitrost (nastavi se glede na težavnost)

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
      // Bonus opeka: 20% verjetnost
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
        // Bonus opeke pobarvamo zlato, ostale modro
        ctx.fillStyle = bricks[c][r].bonus ? "#FFD700" : "#0095DD";
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
  ctx.fillStyle = "#333333";
  ctx.fill();
  ctx.closePath();
}

// Risanje ploščice
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#000000";
  ctx.fill();
  ctx.closePath();
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
          // Bonus opeka prinese 5 točk, navadna 1 točko
          score += b.bonus ? 5 : 1;
          drawScore();
          // Če so vse opeke uničene, preide na naslednji nivo
          if (allBricksCleared()) {
            levelUp();
          }
        }
      }
    }
  }
}

// Preveri, če so vse opeke uničene
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

// Prehod na naslednji nivo z uporabo SweetAlert2
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
    // Povečaj hitrost žogice glede na težavnost
    ballSpeed += 1;
    initGameVariables();
    initBricks();
    gameInterval = setInterval(draw, 10);
    timerInterval = setInterval(updateTimer, 1000);
  });
}

// Inicializacija vseh spremenljivk igre
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

// Glavna risalna funkcija (game loop)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  // Odboj od sten
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  if (y + dy < ballRadius) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius) {
    // Preveri, če je žogica zadela ploščico
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

  // Premikanje ploščice
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7;
  }
}

// Funkcija za konec igre z uporabo SweetAlert2
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

// Dogodki tipkovnice
document.addEventListener("keydown", function(e) {
  if (e.keyCode == 39) rightPressed = true;
  else if (e.keyCode == 37) leftPressed = true;
}, false);

document.addEventListener("keyup", function(e) {
  if (e.keyCode == 39) rightPressed = false;
  else if (e.keyCode == 37) leftPressed = false;
}, false);

// Gumbi za zagon, pavzo in ponastavitev igre
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

// Funkcija za izbiro težavnosti z uporabo SweetAlert2
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
      if(diff === 'easy'){
        ballSpeed = 2;
      } else if(diff === 'medium'){
        ballSpeed = 4;
      } else if(diff === 'hard'){
        ballSpeed = 6;
      }
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

// Ob nalaganju strani izberi težavnost
$(document).ready(function() {
   chooseDifficulty();
});
