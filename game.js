class SlidingPuzzle {
    constructor() {
        this.grid = document.getElementById('grid');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.newGameButton = document.getElementById('newGame');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.playAgainButton = document.getElementById('playAgain');
        
        // Initialize with selected size
        this.size = parseInt(this.gridSizeSelect.value);
        this.cells = [];
        this.emptyCell = { row: 0, col: 0 };
        this.imageOffset = 100 / (this.size - 1);

        // Add settings event listeners
        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.playAgainButton.addEventListener('click', () => {
            this.hideVictoryScreen();
            this.startNewGame();
        });

        this.initializeGame();
        this.addKeyboardControls();
    }

    initializeGame() {
        this.grid.innerHTML = '';
        this.cells = [];
        
        this.setGridSize();
        this.initializeGrid();
        this.scrambleGrid();
        this.addClickListeners();
    }

    startNewGame() {
        this.hideVictoryScreen();
        this.size = parseInt(this.gridSizeSelect.value);
        this.imageOffset = 100 / (this.size - 1);
        this.emptyCell = { row: 0, col: 0 };
        this.initializeGame();
    }

    setGridSize() {
        const image = new Image();
        image.src = './images/puzzle-image.png';
        image.onload = () => {
            this.grid.style.width = image.width+'px';
            this.grid.style.height = image.height+'px';
            this.grid.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
            this.grid.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
        };
    }

    getOffset(position) {
      const offset = position * this.imageOffset;
      
      return offset + '%';
    }


    initializeGrid() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.correctPosition = row + ' ' + col;
                cell.style.backgroundSize = this.size * 100 + '%';
                cell.style.backgroundPosition = this.getOffset(col) + ' ' + this.getOffset(row);
                cell.style.gridColumn = col + 1;
                cell.style.gridRow = row + 1;

                // Make the last cell empty
                if (row === this.emptyCell.row && col === this.emptyCell.col) {
                    cell.classList.add('empty');
                }

                this.grid.appendChild(cell);
                this.cells.push(cell);
            }
        }
    }

    scrambleGrid() {
        // Scramble the puzzle by making random valid moves
        for (let i = 0; i < (this.size * 100); i++) {
            const possibleMoves = [];
            
            // Check all adjacent cells to the empty cell
            const directions = [
                {row: -1, col: 0}, // up
                {row: 1, col: 0},  // down
                {row: 0, col: -1}, // left
                {row: 0, col: 1}   // right
            ];
            
            for (const dir of directions) {
                const newRow = this.emptyCell.row + dir.row;
                const newCol = this.emptyCell.col + dir.col;
                
                // If the move is valid (within grid bounds)
                if (newRow >= 0 && newRow < this.size && 
                    newCol >= 0 && newCol < this.size) {
                    possibleMoves.push({row: newRow, col: newCol});
                }
            }
            
            // Randomly select and make one of the possible moves
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                this.moveCell(randomMove.row, randomMove.col, false);
            }
        }
    }

    addClickListeners() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleClick(cell));
        });
    }

    handleClick(cell) {
        if (cell.classList.contains('empty')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Check if clicked cell is adjacent to empty cell
        if (this.isAdjacentToEmpty(row, col)) {
            this.moveCell(row, col);
            this.checkIfSolved();
        }
    }

    isAdjacentToEmpty(row, col) {
        const rowDiff = Math.abs(row - this.emptyCell.row);
        const colDiff = Math.abs(col - this.emptyCell.col);
        
        // Cell is adjacent if it's one step away in either row or column (but not both)
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    moveCell(row, col, animations = true) {
        // Find the clicked cell and empty cell
        const clickedCell = this.cells.find(
            cell => cell.dataset.row === row.toString() && 
                   cell.dataset.col === col.toString()
        );
        const emptyCell = this.cells.find(
            cell => cell.dataset.row === this.emptyCell.row.toString() && 
                   cell.dataset.col === this.emptyCell.col.toString()
        );

        // Swap content and classes
        const tempContent = clickedCell.textContent;
        clickedCell.textContent = '';
        clickedCell.style.gridColumn = this.emptyCell.col + 1;
        clickedCell.style.gridRow = this.emptyCell.row + 1;
        clickedCell.dataset.col = this.emptyCell.col;
        clickedCell.dataset.row = this.emptyCell.row;
        if(animations) {
          clickedCell.classList.remove('slide-right', 'slide-left', 'slide-up', 'slide-down');
          if(row !== this.emptyCell.row) {
            row > this.emptyCell.row ? clickedCell.classList.add('slide-down') : clickedCell.classList.add('slide-up');
          }
          else if(col !== this.emptyCell.col) {
            col > this.emptyCell.col ? clickedCell.classList.add('slide-right') : clickedCell.classList.add('slide-left');
          }
        }
        if(clickedCell.dataset.correctPosition === this.emptyCell.row + ' ' + this.emptyCell.col) {
            clickedCell.classList.add('correct');
        } else {
            clickedCell.classList.remove('correct');
        }
        emptyCell.textContent = tempContent;

        emptyCell.style.gridColumn = col + 1;
        emptyCell.style.gridRow = row + 1;
        emptyCell.dataset.col = col;
        emptyCell.dataset.row = row;

        // Update empty cell position
        this.emptyCell.row = row;
        this.emptyCell.col = col;
    }

    showVictoryScreen() {
        this.victoryScreen.classList.remove('hidden');
    }

    hideVictoryScreen() {
        this.victoryScreen.classList.add('hidden');
    }

    checkIfSolved() {
        const isSolved = this.cells.every(cell => {
            const currentPos = cell.dataset.row + ' ' + cell.dataset.col;
            return currentPos === cell.dataset.correctPosition;
        });

        const emptyCell = this.cells.find(
            cell => cell.dataset.row === this.emptyCell.row.toString() && 
                   cell.dataset.col === this.emptyCell.col.toString()
        );

        if (isSolved) {
            emptyCell.classList.remove('empty');
            emptyCell.classList.add('correct');
            this.showVictoryScreen();
        } else {
            emptyCell.classList.add('empty');
        }
    }

    addKeyboardControls() {
        let lastKeyPressTime = 0;
        const DEBOUNCE_DELAY = 100; // 100ms debounce delay

        document.addEventListener('keydown', (e) => {
            const now = Date.now();
            if (now - lastKeyPressTime < DEBOUNCE_DELAY) {
                return;
            }
            lastKeyPressTime = now;

            let targetRow = this.emptyCell.row;
            let targetCol = this.emptyCell.col;
            switch (e.key) {
                case 'ArrowUp':
                case 'w': 
                    targetRow += 1; // Move cell below empty space up
                    break;
                case 'ArrowDown':
                case 's':
                    targetRow -= 1; // Move cell above empty space down
                    break;
                case 'ArrowLeft':
                case 'a':
                    targetCol += 1; // Move cell to right of empty space left
                    break;
                case 'ArrowRight':
                case 'd':
                    targetCol -= 1; // Move cell to left of empty space right
                    break;
                default:
                    return;
            }

            // Check if the move is valid
            if (targetRow >= 0 && targetRow < this.size && 
                targetCol >= 0 && targetCol < this.size) {
                this.moveCell(targetRow, targetCol);
                this.checkIfSolved();
            }
        });
    }
}



// Initialize the game when the page loads
window.addEventListener('load', () => {
    new SlidingPuzzle();
}); 