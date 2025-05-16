const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const gridCount = 20;
let cellSize = canvas.width / gridCount;

const headImg = new Image();
headImg.src = 'fire_head.png';

const flameImg = new Image();
flameImg.src = 'flame.png';

const mealImg = new Image();
mealImg.src = 'meal.png';

let animSnake = [{ x: 10 * cellSize, y: 10 * cellSize }];
let animFood = { x: 5 * cellSize, y: 5 * cellSize };
const lerpSpeed = 0.25;

let snake = [ { x: 10, y: 10, type: 'head' } ];
let dx = 1, dy = 0;
let food = { x: 5, y: 5 };
let score = 0;
let gameOver = false;
let speed = 220;
let moveInterval;
let waitingStart = true;
let nextDx = dx, nextDy = dy;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function placeFood() {
  food.x = Math.floor(Math.random() * gridCount);
  food.y = Math.floor(Math.random() * gridCount);
  animFood.x = food.x * cellSize;
  animFood.y = food.y * cellSize;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#232325';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < gridCount; y++) {
    for (let x = 0; x < gridCount; x++) {
      ctx.drawImage(
        stoneImg,
        x * cellSize,
        y * cellSize,
        cellSize,
        cellSize
      );
    }
  }

  const objSize = cellSize * 0.8;
  const objOffset = (cellSize - objSize) / 2;

  const headSize = objSize * 2;
  const headOffset = (cellSize - headSize) / 2;
  const foodSize = objSize * 0.8;
  const foodOffset = (cellSize - foodSize) / 2;

  if (mealImg.complete && mealImg.naturalWidth) {
    ctx.drawImage(
      mealImg,
      animFood.x + foodOffset,
      animFood.y + foodOffset,
      foodSize,
      foodSize
    );
  }

  for (let i = 1; i < animSnake.length; i++) {
    ctx.drawImage(
      flameImg,
      animSnake[i].x + objOffset,
      animSnake[i].y + objOffset,
      objSize,
      objSize
    );
  }
  ctx.drawImage(
    headImg,
    animSnake[0].x + headOffset,
    animSnake[0].y + headOffset,
    headSize,
    headSize
  );

  const scorePanel = document.getElementById('score-panel');
  if (scorePanel) {
    scorePanel.textContent = `Score: ${score}`;
    if (!waitingStart) {
      scorePanel.classList.add('active');
    } else {
      scorePanel.classList.remove('active');
    }
  }

  if (waitingStart) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px "Funnel Display", Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 32;
    ctx.fillText('FogoSnake', canvas.width/2, canvas.height/2 - 40);
    ctx.font = '28px "Funnel Display", Segoe UI, Arial';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(Date.now()/300);
    ctx.fillText('Press Space to start', canvas.width/2, canvas.height/2 + 40);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
    ctx.restore();
    return;
  }

  if (gameOver) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px "Funnel Display", Segoe UI, Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 32;
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 60);
    ctx.restore();
    ctx.font = '28px "Funnel Display", Segoe UI, Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 - 10);
    ctx.fillText('Press Space to restart', canvas.width/2, canvas.height/2 + 30);
    ctx.font = '20px Segoe UI, Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Tweet your score below!', canvas.width/2, canvas.height/2 + 70);
    ctx.restore();
    showTweetButton(score);
  } else {
    hideTweetButton();
  }
}

function animate() {
  for (let i = 0; i < snake.length; i++) {
    if (!animSnake[i]) {
      animSnake[i] = { x: snake[i].x * cellSize, y: snake[i].y * cellSize };
    }
    animSnake[i].x = lerp(animSnake[i].x, snake[i].x * cellSize, lerpSpeed);
    animSnake[i].y = lerp(animSnake[i].y, snake[i].y * cellSize, lerpSpeed);
  }
  animSnake.length = snake.length;

  animFood.x = lerp(animFood.x, food.x * cellSize, lerpSpeed);
  animFood.y = lerp(animFood.y, food.y * cellSize, lerpSpeed);

  draw();
  requestAnimationFrame(animate);
}

function move() {
  if (gameOver || waitingStart) return;
  dx = nextDx; dy = nextDy;
  const newHead = { x: snake[0].x + dx, y: snake[0].y + dy, type: 'head' };
  if (
    newHead.x < 0 || newHead.x >= gridCount ||
    newHead.y < 0 || newHead.y >= gridCount ||
    snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)
  ) {
    gameOver = true;
    draw();
    return;
  }
  for (let i = 0; i < snake.length; i++) {
    if (i === 0) snake[i].type = '';
  }
  snake.unshift(newHead);
  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    placeFood();
    speed = Math.max(60, speed - 10);
    restartInterval();
  } else {
    snake.pop();
  }
}

function restartInterval() {
  clearInterval(moveInterval);
  moveInterval = setInterval(move, speed);
}

function restart(full = false) {
  snake = [ { x: 10, y: 10, type: 'head' } ];
  dx = 1; dy = 0;
  score = 0;
  gameOver = false;
  speed = 220;
  placeFood();
  if (full) waitingStart = true;
  animSnake = snake.map(seg => ({ x: seg.x * cellSize, y: seg.y * cellSize }));
  restartInterval();
}

function isOpposite(newDx, newDy) {
  return dx === -newDx && dy === -newDy;
}

document.addEventListener('keydown', e => {
  if (waitingStart && e.code === 'Space') {
    waitingStart = false;
    restart(false);
    return;
  }
  if (gameOver && e.code === 'Space') {
    waitingStart = false;
    restart(false);
    return;
  }
  if (waitingStart || gameOver) return;
  let newDx = nextDx, newDy = nextDy;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { newDx = 0; newDy = -1; }
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { newDx = 0; newDy = 1; }
  else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { newDx = -1; newDy = 0; }
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { newDx = 1; newDy = 0; }
  if (!isOpposite(newDx, newDy)) {
    nextDx = newDx; nextDy = newDy;
  }
});

headImg.onload = function() {
  placeFood();
  restartInterval();
  animate();
  setInterval(() => { if (waitingStart) draw(); }, 1000/30);
};

let tweetBtn = null;
function showTweetButton(score) {
  if (!tweetBtn) {
    tweetBtn = document.createElement('a');
    tweetBtn.id = 'tweet-btn';
    tweetBtn.target = '_blank';
    tweetBtn.style.background = 'linear-gradient(90deg,#ff4e00,#ec38bc)';
    tweetBtn.style.color = '#fff';
    tweetBtn.style.fontWeight = 'bold';
    tweetBtn.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    tweetBtn.style.fontSize = '20px';
    tweetBtn.style.padding = '12px 32px';
    tweetBtn.style.borderRadius = '32px';
    tweetBtn.style.boxShadow = '0 4px 24px #0008';
    tweetBtn.style.textDecoration = 'none';
    tweetBtn.style.zIndex = '1000';
    tweetBtn.style.transition = 'background 0.2s';
    tweetBtn.onmouseover = () => tweetBtn.style.background = 'linear-gradient(90deg,#ffd700,#ff4e00)';
    tweetBtn.onmouseout = () => tweetBtn.style.background = 'linear-gradient(90deg,#ff4e00,#ec38bc)';
    tweetBtn.innerText = 'Tweet my score!';
    const btnContainer = document.getElementById('tweet-btn-container');
    if (btnContainer) btnContainer.appendChild(tweetBtn);
    else document.body.appendChild(tweetBtn);
  }
  const tweetText = `yo foggots\nI've managed to score in FogoSnake ${score}\nwhat's up clown @oldtora2077\ngFogo @FogoChain`;
  const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweetText);
  tweetBtn.href = url;
  tweetBtn.style.display = 'inline-block';
}
function hideTweetButton() {
  if (tweetBtn) tweetBtn.style.display = 'none';
}

const stoneImg = new Image();
stoneImg.src = 'stone.png';

document.addEventListener('click', function(e) {
  const popups = document.getElementById('flame-popups');
  if (!popups) return;
  const img = document.createElement('img');
  img.src = 'flame.png';
  img.className = 'flame-popup';
  img.style.left = (e.clientX - 10) + 'px';
  img.style.top = (e.clientY - 10) + 'px';
  popups.appendChild(img);
  setTimeout(() => {
    img.classList.add('hide');
    setTimeout(() => img.remove(), 700);
  }, 10);
}); 
