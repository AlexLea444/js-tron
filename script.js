const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

const gridSize = 20; // Size of each grid cell
const numRows = canvas.height / gridSize;
const numCols = canvas.width / gridSize;

let highscore = localStorage.getItem('highscore');
if (highscore === null) {
  highscore = 0;
}

class SnakeBody {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.color = 'green';
  }

  // Copy constructor
  copy() {
    return new SnakeBody(this.x, this.y);
  }
}

class Player {
  constructor() {
    this.body = new SnakeBody(Math.floor((Math.random() + 1) * numCols / 8) ,
                                 Math.floor((Math.random() + 1) * numRows / 8));
    this.dx = 1;
    this.dy = 0;
  }
}

let player = new Player();

class Trail {
  constructor() {
    this.items = [];
  }

  // Function to add element to the queue
  enqueue(element) {
    this.items.push(element);
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

  // Function to get the length of the queue
  length() {
    return this.items.length;
  }

  // Iterator implementation
  *[Symbol.iterator]() {
    for (let item of this.items) {
      yield item;
    }
  }

  // Function to search for a value in the queue
  search(head) {
    for (let segment of this) {
      if (segment.x == head.x && segment.y == head.y) {
        return true;
      }
    }
    return false;
  }
}

let trail = new Trail();

let validInputs = ['up', 'down', 'left', 'right'];

class InputsList {
  constructor() {
    this.items = [];
  }

  // Function to add element to the queue
  enqueue(element) {
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

class Apple {
  constructor() {
    this.x = Math.floor(Math.random() * numCols);
    this.y = Math.floor(Math.random() * numRows);
    this.move();
    this.color = 'red';
  }

  position() {
    return {x: this.x,
            y: this.y,}
  }

  move() {
    console.log(`${this.x},${this.y} ${player.body.x},${player.body.y}`);
    this.x = Math.floor(Math.random() * numCols);
    this.y = Math.floor(Math.random() * numRows);
    while (trail.search(this.position()) || (this.x == player.body.x && this.y == player.body.y)) {
      this.x = Math.floor(Math.random() * numCols);
      this.y = Math.floor(Math.random() * numRows);
    }
  }
}

let apple = new Apple();

let paused = false;

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
    ctx.lineTo(i * gridSize, canvas.height);
  }

  // Draw horizontal lines
  for (let j = 0; j <= numRows; j++) {
    ctx.moveTo(0, j * gridSize);
    ctx.lineTo(canvas.width, j * gridSize);
  }

  ctx.stroke();
}

function draw() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  drawGrid();

  // Draw player, apple, and obstacles
  drawSquare(apple);
  drawSquare(player.body);

  for (let segment of trail) {
    drawSquare(segment);
  }

  document.getElementById('score').textContent = `Score: ${trail.length()}`;
  document.getElementById('highscore').textContent = `High Score: ${highscore}`;
}

function movePlayer() {
  if (paused) {
    return;
  }
  updateVelocity(inputs.dequeue());

  trail.enqueue(player.body.copy());

  player.body.x += player.dx;
  player.body.y += player.dy;

  // Check if the new position is within bounds and not an obstacle
  if (player.body.x >= 0 && player.body.x < numCols && player.body.y >= 0 && player.body.y < numRows) {
    if (trail.search(player.body)) {
      alert('You hit your tail! You lose :(');
      resetGame();
    }

    if (player.body.x === apple.x && player.body.y === apple.y) {
      apple.move();
    } else {
      trail.dequeue();
    }

  } else {
    alert('You hit the wall! You lose :(');
    resetGame();
  }

  draw();
}

function resetGame() {
  highscore = Math.max(highscore, trail.length()-1);
  localStorage.setItem('highscore', highscore);
  player = new Player();
  apple.move();
  trail = new Trail();
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
  if (paused) {
    overlay.style.display = "none";
  } else {
    overlay.style.display = "flex";
  }
  paused = !paused;
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
      resetGame();
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
    case 'k':
      inputs.enqueue('up');
      break;
    case 'j':
      inputs.enqueue('down');
      break;
    case 'h':
      inputs.enqueue('left');
      break;
    case 'l':
      inputs.enqueue('right');
      break;
    case 'w':
      inputs.enqueue('up');
      break;
    case 's':
      inputs.enqueue('down');
      break;
    case 'a':
      inputs.enqueue('left');
      break;
    case 'd':
      inputs.enqueue('right');
      break;
  }
});

/* Determine inputs by swiping on mobile */
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (event) => {
  event.preventDefault();
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

window.addEventListener('touchend', (event) => {
  event.preventDefault();
  const touch = event.changedTouches[0];
  const touchEndX = touch.clientX;
  const touchEndY = touch.clientY;

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

// Set an interval for the movePlayer function (every 120ms)
const intervalId = setInterval(movePlayer, 120);

draw();
