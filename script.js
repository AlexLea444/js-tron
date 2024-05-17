import Apple from './Apple.js';
import {TrailSegment, Trail, Player} from './Trail.js';

// Get references to HTML elements
const gameCanvas = document.getElementById('gameCanvas');
const infoOverlay = document.getElementById('infoOverlay');
const ctx = gameCanvas.getContext('2d');
const pauseOverlay = document.getElementById('pauseOverlay');
const pauseButton = document.querySelector('.pauseButton');
const gameInfo = document.getElementById('gameInfo');
const gridInfo = document.getElementById('gridInfo');
const finalScore = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const shareButton = document.getElementById('shareButton');

// Constants for grid size and dimensions
const gridSize = 40; // Size of each grid cell
const numRows = gameCanvas.height / gridSize;
const numCols = gameCanvas.width / gridSize;
const gridBounds = {
    left: 0,
    right: numCols - 1,
    top: 0,
    bottom: numRows - 1,
}

// Load highscore from local storage
let highscore = localStorage.getItem('highscore');
if (highscore === null) {
    highscore = 0;
}

let player = new Player(numCols, numRows);

let trail = new Trail(new TrailSegment(player.location()));

let apple = new Apple(numCols, numRows);

let validInputs = ['up', 'down', 'left', 'right'];

class InputsList {
    constructor() {
        this.items = [];
    }
  
    // Function to add element to the queue
    enqueue(element) {
        if (gameState !== GAME_STATE_RUNNING) {
            return;
        }
        if (validInputs.indexOf(element) !== -1) {
            this.items.push(element);
        }
    }
  
    // Function to remove element from the queue
    dequeue() {
        if (this.isEmpty()) {
            return "Underflow";
        }
        return this.items.shift();
    }
  
    // Function to check if the queue is empty
    isEmpty() {
        return this.items.length === 0;
    }
}

let inputs = new InputsList();

// Define constants for collision states
const COLLISION_STATE_WALL = 'the wall';
const COLLISION_STATE_TAIL = 'your tail';
const COLLISION_STATE_NONE = 'nothing';

// Initialize the current collision state
let collisionState = COLLISION_STATE_NONE;

// Used to update location of snake on regular interval
let moveIntervalId;

// Define constants for game states
const GAME_STATE_START = 'start';
const GAME_STATE_RUNNING = 'running';
const GAME_STATE_PAUSED = 'paused';
const GAME_STATE_GAME_OVER = 'game_over';

// Initialize the current game state
let gameState; 
updateGameState(GAME_STATE_START);

// Function to update the game state
function updateGameState(newState) {

    // Additional logic based on the new game state
    switch (newState) {
        case GAME_STATE_START:
            infoOverlay.style.display = "flex";
            shareButton.style.display = "none";
            gameInfo.innerHTML = "Ready to go?";
            gridInfo.innerHTML = "Swipe to change direction.";
            finalScore.textContent = `High Score: ${highscore}`;
            startButton.textContent = "Start";
            draw();

            break;
        case GAME_STATE_RUNNING:
            infoOverlay.style.display = "none";
            pauseOverlay.style.display = "none";
            pauseButton.style.opacity = 0.5;
            pauseButton.textContent = "PAUSE";
            // Set an interval for the movePlayer function (every 120ms)
            moveIntervalId = setInterval(movePlayer, 170);

            break;
        case GAME_STATE_PAUSED:
            // Pause the movement of th
            clearInterval(moveIntervalId);

            pauseOverlay.style.display = "flex";
            pauseButton.style.opacity = 1;
            pauseButton.textContent = "UNPAUSE";

            break;
        case GAME_STATE_GAME_OVER:
            clearInterval(moveIntervalId);
            infoOverlay.style.display = "flex";
            if (score() > highscore) {
                gameInfo.innerHTML = `Game Over<br>New high score!`;
            } else {
                gameInfo.innerHTML = `Game Over<br>You hit ${collisionState}`;
            }
            gridInfo.innerHTML = gridToHTML();
            finalScore.textContent = `Final Score: ${score()}`;
            shareButton.style.display = "inline-block";
            startButton.textContent = "Restart";

            break;
        default:
            // Handle unexpected state
            break;
    }

    gameState = newState;
}

function gridToHTML() {
    let grid = "";
    for (let i = 0; i < numCols; i++) {
        for (let j = 0; j < numRows; j++) {
            let location = {x: j, y: i,};
            if (trail.search(location)) {
                grid = grid.concat("&#129001;");
            } else if (apple.x === j && apple.y === i) {
                grid = grid.concat("&#127822;");
            } else {
                grid = grid.concat("&#11036;")
            }
        }
        grid = grid.concat("<br>");
    }
    return grid;
}

function draw() {
    // Clear the gameCanvas
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw player, apple, and obstacles
    drawSquare(apple);
    // drawSquare(player.body);

    for (let segment of trail) {
        drawSquare(segment);
    }

    // Draw grid
    drawGrid();

    document.getElementById('score').textContent = `Score: ${score()}`;
}

function drawSquare(square) {
    ctx.fillStyle = square.color;
    ctx.fillRect(square.x * gridSize, square.y * gridSize, gridSize, gridSize);
}

function drawGrid() {
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
  
    // Draw vertical lines
    for (let i = 0; i <= numCols; i++) {
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, gameCanvas.height);
    }
  
    // Draw horizontal lines
    for (let j = 0; j <= numRows; j++) {
        ctx.moveTo(0, j * gridSize);
        ctx.lineTo(gameCanvas.width, j * gridSize);
    }
  
    ctx.stroke();
}

function movePlayer() {
    updateVelocity(inputs.dequeue());
  
    player.x += player.dx;
    player.y += player.dy;
  
    // Check if the new location is within bounds and not an obstacle
    if (isInBounds(player.x, player.y, gridBounds)) {
        if (trail.search(player.location())) {
            // Check that collision is not caused by trail segment which is
            // about to be dequeued
            let trailEnd = trail.last();
            console.log(`x: ${trailEnd.x}, y: ${trailEnd.y}`);
            if (player.x !== trailEnd.x || player.y !== trailEnd.y) {
                collisionState = COLLISION_STATE_TAIL;
            }
        }
  
        if (player.x === apple.x && player.y === apple.y) {
            apple.moveNotTo(trail);
        } else if (collisionState === COLLISION_STATE_NONE) {
            trail.dequeue();
        }
    } else {
        collisionState = COLLISION_STATE_WALL;
    }
 
    if (collisionState === COLLISION_STATE_NONE) {
        trail.enqueue(new TrailSegment(player.location()));
        draw();
    } else {
        updateGameState(GAME_STATE_GAME_OVER);
    }
}

function score() {
    if (trail.length() === (numCols * numRows - 1) && gameState === GAME_STATE_RUNNING) {
        updateGameState(GAME_STATE_GAME_OVER);
    } else {
        return trail.length();
    }
}

function resetGame() {
    collisionState = COLLISION_STATE_NONE;
    highscore = Math.max(highscore, score());
    localStorage.setItem('highscore', highscore);
    player = new Player(numCols, numRows);
    trail = new Trail(new TrailSegment(player.location()));
    apple.moveNotTo(trail);
    draw();
}

function updateVelocity(direction) {
    if (direction === 'up') {
        if (player.dx !== 0) {
            player.dy = -1;
            player.dx = 0;
        }
    } else if (direction === 'down') {
        if (player.dx !== 0) {
            player.dy = 1;
            player.dx = 0;
        }
    } else if (direction === 'left') {
        if (player.dy !== 0) {
            player.dx = -1;
            player.dy = 0;
        }
    } else if (direction === 'right') {
        if (player.dy !== 0) {
            player.dx = 1;
            player.dy = 0;
        }
    }
}

function togglePause() {
    switch (gameState) {
        case GAME_STATE_RUNNING:
            updateGameState(GAME_STATE_PAUSED);
            break;
        case GAME_STATE_PAUSED:
            updateGameState(GAME_STATE_RUNNING);
            break;
        case GAME_STATE_START:
            break;
        case GAME_STATE_GAME_OVER:
            break;
    }
}

// Takes game inputs from the keyboard
// Also prevents default actions for certain keys
document.addEventListener('keydown', event => {
    switch (event.key) {
        case ' ':
            event.preventDefault();
            togglePause();
            break;
        case 'Escape':
            event.preventDefault();
            togglePause();
            break;
        case 'ArrowUp':
            event.preventDefault();
            inputs.enqueue('up');
            break;
        case 'ArrowDown':
            event.preventDefault();
            inputs.enqueue('down');
            break;
        case 'ArrowLeft':
            event.preventDefault();
            inputs.enqueue('left');
            break;
        case 'ArrowRight':
            event.preventDefault();
            inputs.enqueue('right');
            break;
    }
});

/* Determine inputs by swiping on mobile */
let touchStartX = 0;
let touchStartY = 0;
let mobile = false;

// To reduce the number of accidental pauses, we track the start and end
// location of a touch, and only pause if the touch starts and ends on the
// pause button. 
const PAUSE_DETECTION_WAITING = 'waiting';
const PAUSE_DETECTION_NOT_WAITING = 'not waiting';
let pauseDetectionState = PAUSE_DETECTION_NOT_WAITING;

// Track if touch started on pause button
const pauseButtonBounds = pauseButton.getBoundingClientRect();

window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    mobile = true;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    if (isInBounds(touchStartX, touchStartY, pauseButtonBounds)) {
        pauseDetectionState = PAUSE_DETECTION_WAITING;
    } else {
        pauseDetectionState = PAUSE_DETECTION_NOT_WAITING;
    }
}, { passive: false });

window.addEventListener('touchend', (event) => {
    event.preventDefault();
    const touch = event.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;

    if (isInBounds(touchEndX, touchEndY, pauseButtonBounds) && 
        pauseDetectionState === PAUSE_DETECTION_WAITING) {
        togglePause();
    }
    
    // Reset variable to be reassigned on next pause touch
    pauseDetectionState = PAUSE_DETECTION_NOT_WAITING;
 
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
  
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 30) {
        return;
    }
  
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
        if (deltaX > 0) {
            inputs.enqueue('right');
        } else {
            inputs.enqueue('left');
        }
    } else {
    // Vertical swipe
        if (deltaY > 0) {
            inputs.enqueue('down');
        } else {
            inputs.enqueue('up');
        }
    }
});

function isInBounds(x, y, bounds) {
    return (x <= bounds.right && x >= bounds.left && y >= bounds.top && y <= bounds.bottom);
}

pauseButton.addEventListener('click', function() {
    togglePause();
});

startButton.addEventListener('click', function() {
    if (gameState === GAME_STATE_GAME_OVER) {
        resetGame();
    }
    updateGameState(GAME_STATE_RUNNING);
});

startButton.addEventListener('touchend', function() {
    if (gameState === GAME_STATE_GAME_OVER) {
        resetGame();
    }
    updateGameState(GAME_STATE_RUNNING);
});

shareButton.addEventListener('click', function() {
    if (gameState === GAME_STATE_GAME_OVER) {
        const copyText = gridToHTML().replaceAll('<br>', '\n')
                                     .replaceAll('&#129001;',"🟩")
                                     .replaceAll('&#11036;', "⬜")
                                     .replaceAll('&#127822;', "🍎")
                                     .concat(`\nscore: ${score()}`);
        console.log(copyText);

        navigator.clipboard.writeText(copyText);

        alert("Copied score to clipboard!")
    }
});

shareButton.addEventListener('touchend', function() {
    if (gameState === GAME_STATE_GAME_OVER) {
        const copyText = gridToHTML().replace('<br>', '\n') + `\nscore: ${score()}`;
        console.log(copyText);

        navigator.clipboard.writeText(copyText);

        alert("Copied score to clipboard!")
    }
});

