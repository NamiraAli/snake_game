// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const upBtn = document.getElementById('upBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const downBtn = document.getElementById('downBtn');
const eatSound = document.getElementById('eatSound');
const gameOverSound = document.getElementById('gameOverSound');
const bgMusic = document.getElementById('bgMusic');

// Game variables
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 1, y: 1 }]; // Start snake at (1,1) instead of (10,10)
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = true;
let paused = false;
let speed = 100; // Initial speed in ms
let gameInterval;

// Load high score
highScoreElement.textContent = highScore;
console.log('Game initialized, high score loaded:', highScore);

// Generate random food position
function randomTile() {
    return Math.floor(Math.random() * tileCount);
}

// Place food at a random position not on the snake
function generateFood() {
    food = {
        x: randomTile(),
        y: randomTile()
    };
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
    console.log('Food generated at:', food);
}

// Draw the game board, snake, and food
function draw() {
    // Clear canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = '#4CAF50';
    for (let segment of snake) {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    }
    console.log('Drawing snake at positions:', snake);

    // Draw food
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    if (paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    }
}

// Update game state
function update() {
    if (!gameRunning || paused) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    console.log('Snake moved to head:', head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        try { eatSound.play(); } catch (e) { console.log('Eat sound error:', e); }
        generateFood();
        // Gradually increase speed
        if (speed > 50) speed -= 2;
        clearInterval(gameInterval);
        gameInterval = setInterval(() => { update(); draw(); }, speed);
        console.log('Speed increased to:', speed);
    } else {
        snake.pop();
    }

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
        }
    }
}

// End game function
function endGame() {
    gameRunning = false;
    try { bgMusic.pause(); gameOverSound.play(); } catch (e) { console.log('Game over sound error:', e); }
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
        console.log('New high score:', highScore);
    }
    console.log('Game over');
}

// Change direction
function changeDirection(event) {
    if (!gameRunning || paused) return;

    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
    console.log('Direction changed to dx:', dx, 'dy:', dy);
}

// Handle on-screen button presses
upBtn.addEventListener('click', () => { if (dy !== 1 && gameRunning && !paused) { dx = 0; dy = -1; console.log('Up button pressed'); } });
leftBtn.addEventListener('click', () => { if (dx !== 1 && gameRunning && !paused) { dx = -1; dy = 0; console.log('Left button pressed'); } });
rightBtn.addEventListener('click', () => { if (dx !== -1 && gameRunning && !paused) { dx = 1; dy = 0; console.log('Right button pressed'); } });
downBtn.addEventListener('click', () => { if (dy !== -1 && gameRunning && !paused) { dx = 0; dy = 1; console.log('Down button pressed'); } });

// Touch controls for canvas swipes
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    console.log('Touch start at:', touchStartX, touchStartY);
});

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning || paused) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && dx !== -1) { dx = 1; dy = 0; console.log('Swipe right'); }
            else if (deltaX < 0 && dx !== 1) { dx = -1; dy = 0; console.log('Swipe left'); }
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && dy !== -1) { dx = 0; dy = 1; console.log('Swipe down'); }
            else if (deltaY < 0 && dy !== 1) { dx = 0; dy = -1; console.log('Swipe up'); }
        }
    }
});

// Pause/Resume toggle
pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    pauseBtn.classList.toggle('paused');
    if (paused) {
        try { bgMusic.pause(); } catch (e) { console.log('Pause music error:', e); }
    } else {
        try { bgMusic.play(); } catch (e) { console.log('Resume music error:', e); }
    }
    console.log('Paused:', paused);
});

// Reset game
function resetGame() {
    snake = [{ x: 1, y: 1 }]; // Reset to (1,1)
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    paused = false;
    pauseBtn.textContent = 'Pause';
    pauseBtn.classList.remove('paused');
    speed = 100;
    clearInterval(gameInterval);
    gameInterval = setInterval(() => { update(); draw(); }, speed);
    generateFood();
    try { bgMusic.currentTime = 0; bgMusic.play(); } catch (e) { console.log('Reset music error:', e); }
    console.log('Game reset');
}

// Event listeners
document.addEventListener('keydown', changeDirection);
restartBtn.addEventListener('click', resetGame);

// Initialize game
generateFood();
try { bgMusic.play(); } catch (e) { console.log('Init music error:', e); }

// Game loop
gameInterval = setInterval(() => {
    update();
    draw();
}, speed);