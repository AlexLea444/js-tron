export default class Apple {
    constructor(numCols, numRows) {
        this.x = Math.floor(Math.random() * numCols);
        this.y = Math.floor(Math.random() * numRows);
        this.color = 'red';

        // Save numCols and numRows for later
        this.numCols = numCols;
        this.numRows = numRows;
    }
  
    location() {
        return {x: this.x,
                y: this.y,}
    }
  
    // Move apple to a square not occupied by the trail
    moveNotTo(trail) {
        const prevX = this.x;
        const prevY = this.y;
        this.x = Math.floor(Math.random() * this.numCols);
        this.y = Math.floor(Math.random() * this.numRows);
        while (trail.search(this.location()) || (prevX === this.x && prevY === this.y)) {
            this.x = Math.floor(Math.random() * this.numCols);
            this.y = Math.floor(Math.random() * this.numRows);
        }
    }
}
