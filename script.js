import {Trail, Player} from './Trail.js';

// Get references to HTML elements
const gameCanvas = document.getElementById('gameCanvas');

if (!gameCanvas) {
    throw new Error("Canvas element with ID 'gameCanvas' not found.");
}

const ctx = gameCanvas.getContext('2d');

if (!ctx) {
    throw new Error("Unable to get '2d' context from the canvas element.");
}

const infoOverlay = document.getElementById('infoOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const pauseButton = document.querySelector('.pauseButton');
const gameInfo = document.getElementById('gameInfo');
const gridInfo = document.getElementById('gridInfo');
const startButton = document.getElementById('startButton');
const shareButton = document.getElementById('shareButton');

// Constants for grid size and dimensions
const gridSize = 10; // Size of each grid cell
const numRows = gameCanvas.height / gridSize;
const numCols = gameCanvas.width / gridSize;
const gridBounds = {
    left: 0,
    right: numCols - 1,
    top: 0,
    bottom: numRows - 1,
}

const p1 = new Player(numCols / 4, numRows / 2, 1, "DarkGoldenRod", ctx, gridSize);
const p2 = new Player(numCols * 3 / 4, numRows / 2, -1, "DarkBlue", ctx, gridSize);

const p1_trail = new Trail(p1.location(), "GoldenRod", ctx, gridSize);
const p2_trail = new Trail(p2.location(), "Blue", ctx, gridSize);

let validInputs = ['up', 'down', 'left', 'right'];

class InputsList {
    constructor() {
        this.items = [];
    }

    clear() {
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

const p1_inputs = new InputsList();
const p2_inputs = new InputsList();

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
const GAME_STATE_PLAYER1_WIN = 'player 1 wins!';
const GAME_STATE_PLAYER2_WIN = 'player 2 wins!';
const GAME_STATE_DRAW = 'it\'s a tie!';

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
            gridInfo.innerHTML = "Player 1 use WASD, Player 2 use arrows.";
            startButton.textContent = "Start";
            draw();

            break;
        case GAME_STATE_RUNNING:
            infoOverlay.style.display = "none";
            pauseOverlay.style.display = "none";
            pauseButton.style.opacity = 0.5;
            pauseButton.textContent = "PAUSE";
            // Set an interval for the movePlayer function (in milliseconds)
            moveIntervalId = setInterval(movePlayers, 60);

            break;
        case GAME_STATE_PAUSED:
            // Pause the movement of th
            clearInterval(moveIntervalId);
            p1_inputs.clear();
            p2_inputs.clear();

            pauseOverlay.style.display = "flex";
            pauseButton.style.opacity = 1;
            pauseButton.textContent = "UNPAUSE";

            break;
        case GAME_STATE_PLAYER1_WIN:
        case GAME_STATE_PLAYER2_WIN:
        case GAME_STATE_DRAW:
            clearInterval(moveIntervalId);
            infoOverlay.style.display = "flex";
            if (newState === GAME_STATE_PLAYER1_WIN) {
                gameInfo.innerHTML = `Game Over<br>Player 1 wins!`;
            } else if (newState === GAME_STATE_PLAYER2_WIN) {
                gameInfo.innerHTML = `Game Over<br>Player 2 wins!`;
            } else {
                gameInfo.innerHTML = "Game Over<br>It's a draw!";
            }
            shareButton.style.display = "none";
            startButton.textContent = "Restart";
            break;
        default:
            // Handle unexpected state
            break;
    }

    gameState = newState;
}

function draw() {
    // Clear the gameCanvas
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw grid
    drawGrid();

    // Draw players and trails
    p1_trail.draw(ctx, gridSize);
    p2_trail.draw(ctx, gridSize);

    p1.draw(ctx, gridSize);
    p2.draw(ctx, gridSize);
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

const CRASHED = 'crashed';
const NOT_CRASHED = 'not crashed';

let p1_collisionState = NOT_CRASHED;
let p2_collisionState = NOT_CRASHED;

function movePlayers() {
    p1_trail.enqueue(p1.location());
    p2_trail.enqueue(p2.location());

    p1.updateVelocity(p1_inputs.dequeue());
    p2.updateVelocity(p2_inputs.dequeue());

    p1.move();
    p2.move();

    // Check if the players have crashed into each other directly
    if (p1.x === p2.x && p1.y === p2.y) {
        p1_collisionState = CRASHED;
        p2_collisionState = CRASHED;
    }

    // Check if player 1 has gone out of bounds
    if (!isInBounds(p1.location(), gridBounds)) {
        p1_collisionState = CRASHED;
    }

    // Check if player 2 has gone out of bounds
    if (!isInBounds(p2.location(), gridBounds)) {
        p2_collisionState = CRASHED;
    }

    // Check if player 1 has crashed into a trail
    if (p1_trail.contains(p1.location()) || p2_trail.contains(p1.location())) {
        p1_collisionState = CRASHED;
    }

    // Check if player 2 has crashed into a trail
    if (p1_trail.contains(p2.location()) || p2_trail.contains(p2.location())) {
        p2_collisionState = CRASHED;
    }
 
    if (p1_collisionState === CRASHED && p2_collisionState === CRASHED) {
        updateGameState(GAME_STATE_DRAW);
    } else if (p1_collisionState === CRASHED) {
        updateGameState(GAME_STATE_PLAYER2_WIN);
    } else if (p2_collisionState === CRASHED) {
        updateGameState(GAME_STATE_PLAYER1_WIN);
    } else {
        draw();
    }
}

function resetGame() {
    p1_collisionState = NOT_CRASHED;
    p2_collisionState = NOT_CRASHED;
    p1.reset();
    p2.reset();
    p1_trail.reset();
    p2_trail.reset();
    p1_inputs.clear();
    p2_inputs.clear();
    draw();
}

function togglePause() {
    switch (gameState) {
        case GAME_STATE_RUNNING:
            updateGameState(GAME_STATE_PAUSED);
            break;
        case GAME_STATE_PAUSED:
            updateGameState(GAME_STATE_RUNNING);
            break;
        default:
            break;
    }
}

// Takes game inputs from the keyboard
// Also prevents default actions for certain keys
document.addEventListener('keydown', event => {
    switch (event.key) {
        case 'Enter':
            event.preventDefault();
            switch (gameState) {
                case GAME_STATE_PAUSED:
                case GAME_STATE_RUNNING:
                    togglePause();
                    break;
                case GAME_STATE_PLAYER1_WIN:
                case GAME_STATE_PLAYER2_WIN:
                case GAME_STATE_DRAW:
                    resetGame();
                default:
                    updateGameState(GAME_STATE_RUNNING);
                    break;
            }
            break;
        case ' ':
            event.preventDefault();
            switch (gameState) {
                case GAME_STATE_PAUSED:
                case GAME_STATE_RUNNING:
                    togglePause();
                    break;
                case GAME_STATE_PLAYER1_WIN:
                case GAME_STATE_PLAYER2_WIN:
                case GAME_STATE_DRAW:
                    resetGame();
                default:
                    updateGameState(GAME_STATE_RUNNING);
                    break;
            }
            break;
        case 'Escape':
            event.preventDefault();
            togglePause();
            break;
        case 'w':
            event.preventDefault();
            p1_inputs.enqueue('up');
            break;
        case 's':
            event.preventDefault();
            p1_inputs.enqueue('down');
            break;
        case 'a':
            event.preventDefault();
            p1_inputs.enqueue('left');
            break;
        case 'd':
            event.preventDefault();
            p1_inputs.enqueue('right');
            break;
        case 'ArrowUp':
            event.preventDefault();
            p2_inputs.enqueue('up');
            break;
        case 'ArrowDown':
            event.preventDefault();
            p2_inputs.enqueue('down');
            break;
        case 'ArrowLeft':
            event.preventDefault();
            p2_inputs.enqueue('left');
            break;
        case 'ArrowRight':
            event.preventDefault();
            p2_inputs.enqueue('right');
            break;
    }
});

function isInBounds(location, bounds) {
    let x = location.x;
    let y = location.y;
    return (x <= bounds.right && x >= bounds.left && y >= bounds.top && y <= bounds.bottom);
}

pauseButton.addEventListener('click', function() {
    togglePause();
});

startButton.addEventListener('click', function() {
    switch (gameState) {
        case GAME_STATE_PLAYER1_WIN:
        case GAME_STATE_PLAYER2_WIN:
        case GAME_STATE_DRAW:
            resetGame();
        default:
            break;
    }
    updateGameState(GAME_STATE_RUNNING);
});
