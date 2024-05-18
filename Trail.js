function drawSquare(ctx, location, color, gridSize) {
    ctx.fillStyle = color;
    ctx.fillRect(location.x * gridSize, location.y * gridSize, gridSize, gridSize);
}

class Trail {
    constructor(starting_location, trail_color, ctx, gridSize) {
        this.items = new Array(starting_location);
        this.color = trail_color;
        this.starting_location = starting_location;
        this.ctx = ctx;
        this.gridSize = gridSize;
    }
  
    // Function to add element to the queue
    enqueue(location) {
        this.items.push(location);
    }
  
    // Function to remove element from the queue
    dequeue() {
        if (this.isEmpty()) {
            return "Underflow";
        }
        return this.items.shift();
    }

    // Function to get last element from the queue
    last() {
        return this.items[0];
    }
  
    // Function to check if the queue is empty
    isEmpty() {
        return this.items.length === 0;
    }

    reset() {
        this.items = new Array(this.starting_location);
    }
  
    // Simple iterator implementation
    *[Symbol.iterator]() {
        for (let item of this.items) {
            yield item;
        }
    }
  
    // Function to search for a value in the queue
    contains(location) {
        for (let segment of this) {
            if (segment.x == location.x && segment.y == location.y) {
                return true;
            }
        }
        return false;
    }

    // Function to draw trail (experimental)
    draw() {
        // First, draw a dark square around every segment of the trail
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#222";
    
        for (const segment of this) {
            drawSquare(this.ctx, segment, this.color, this.gridSize);
    
            this.ctx.moveTo(segment.x * this.gridSize, segment.y * this.gridSize);
    
            this.ctx.lineTo((segment.x + 1) * this.gridSize, segment.y * this.gridSize);
            this.ctx.lineTo((segment.x + 1) * this.gridSize, (segment.y + 1) * this.gridSize);
            this.ctx.lineTo(segment.x * this.gridSize, (segment.y + 1) * this.gridSize);
            this.ctx.lineTo(segment.x * this.gridSize, segment.y * this.gridSize);
    
        }
        this.ctx.stroke();
    
    
        // Then, go back in and remove the lines between snake segments
        let prev = this.last;
    
        this.ctx.beginPath();
        // Assume trail is all one color
        this.ctx.strokeStyle = this.color;
    
        for (const curr of this) {
            if (curr.x === prev.x - 1) {
                // current segment is left of previous segment
                this.ctx.moveTo((curr.x + 1) * this.gridSize, curr.y * this.gridSize + 1);
                this.ctx.lineTo((curr.x + 1) * this.gridSize, (curr.y + 1) * this.gridSize - 1);
            } else if (curr.x === prev.x + 1) {
                // current segment is right of previous segment
                this.ctx.moveTo(curr.x * this.gridSize, curr.y * this.gridSize + 1);
                this.ctx.lineTo(curr.x * this.gridSize, (curr.y + 1) * this.gridSize - 1);
            } else if (curr.y === prev.y - 1) {
                // current segment is on top of previous segment
                this.ctx.moveTo(curr.x * this.gridSize + 1, (curr.y + 1) * this.gridSize);
                this.ctx.lineTo((curr.x + 1) * this.gridSize - 1, (curr.y + 1) * this.gridSize);
            } else if (curr.y === prev.y + 1) {
                // current segment is below previous segment
                this.ctx.moveTo(curr.x * this.gridSize + 1, curr.y * this.gridSize);
                this.ctx.lineTo((curr.x + 1) * this.gridSize - 1, curr.y * this.gridSize);
            }
            prev = curr;
        }
        this.ctx.stroke();
    }
}

class Player {
    constructor(x, y, dx, color, ctx, gridSize) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.dx = dx / Math.abs(dx);
        this.dy = 0;
        this.color = color;
        this.startingX = this.x;
        this.startingY = this.y;
        this.startingDX = this.dx;
        this.ctx = ctx;
        this.gridSize = gridSize;
    }

    location() {
        return {x: this.x,
                y: this.y,}
    }

    reset() {
        this.x = this.startingX;
        this.y = this.startingY;
        this.dx = this.startingDX;
        this.dy = 0;
    }

    updateVelocity(direction) {
        if (direction === 'up') {
            if (this.dx !== 0) {
                this.dy = -1;
                this.dx = 0;
            }
        } else if (direction === 'down') {
            if (this.dx !== 0) {
                this.dy = 1;
                this.dx = 0;
            }
        } else if (direction === 'left') {
            if (this.dy !== 0) {
                this.dx = -1;
                this.dy = 0;
            }
        } else if (direction === 'right') {
            if (this.dy !== 0) {
                this.dx = 1;
                this.dy = 0;
            }
        }
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw() {
        drawSquare(this.ctx, this.location(), this.color, this.gridSize);

        this.ctx.beginPath();
        this.ctx.strokeStyle = "#222";
    
        this.ctx.moveTo(this.x * this.gridSize, this.y * this.gridSize);

        this.ctx.lineTo((this.x + 1) * this.gridSize, this.y * this.gridSize);
        this.ctx.lineTo((this.x + 1) * this.gridSize, (this.y + 1) * this.gridSize);
        this.ctx.lineTo(this.x * this.gridSize, (this.y + 1) * this.gridSize);
        this.ctx.lineTo(this.x * this.gridSize, this.y * this.gridSize);

        this.ctx.stroke();
    }
}

export {Trail, Player};
