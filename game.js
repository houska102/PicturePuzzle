const imageSelectOptions = [
    {
        label: 'Monkey',
        name: 'images/puzzle-image.png'
    },
    {
        label: 'Old Person',
        name: 'images/puzzle-image-2.png'
    },
    {
        label: 'Tomas',
        name: 'images/puzzle-image-3.png'
    },
    {
        label: 'BoardWalk',
        name: 'images/puzzle-image-4.jpg'
    },
]


class SlidingPuzzle {
    constructor() {
        this.grid = document.getElementById('grid');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.imageSelect = document.getElementById('imageSelect');
        this.newGameButton = document.getElementById('newGame');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.playAgainButton = document.getElementById('playAgain');
        this.autoSolveButton = document.getElementById('autoSolve');
        this.imageInput = document.getElementById('imageInput');
        this.imageInputLabel = document.getElementById('imageInputLabel');
        this.timerElement = document.querySelector('.timer span');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.finalTimeElement = document.getElementById('finalTime');
        this.saveTimeButton = document.getElementById('saveTimeButton');
        this.usernameInput = document.getElementById('username');

        this.initializeImageSelect();
        
        // Initialize with selected size
        this.size = parseInt(this.gridSizeSelect.value);
        this.cells = [];
        this.emptyCell = { row: 0, col: 0 };
        this.imageOffset = 100 / (this.size - 1);
        this.imageName = this.imageSelect.value;
        this.timer = null
        this.startTime = null
        this.endTime = null
				this.newMatch = true;

        // Add settings event listeners
        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.playAgainButton.addEventListener('click', () => {
            this.hideVictoryScreen();
            this.startNewGame();
        });
        this.imageSelect.addEventListener('change', () => {
            this.imageName = this.imageSelect.value;
            this.startNewGame();
        });
        this.autoSolveButton.addEventListener('click', () => {
						this.saveTimeButton.classList.add('hidden');
						this.newMatch = false;
            this.autoSolve();
        });
				this.saveTimeButton.addEventListener('click', () => {
					if (this.newMatch) {
						this.saveToLeaderboard(this.endTime - this.startTime, this.usernameInput.value.trim());
						this.saveTimeButton.classList.add('hidden');
						this.usernameInput.value = '';
						this.newMatch = false;
					}
				});

        this.initializeGame();
        this.addKeyboardControls();
        this.startNewGame();
        this.initializeLeaderboard();

    }
    initializeImageSelect() {
        this.imageSelect.innerHTML = '';
        imageSelectOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.name;
            optionElement.textContent = option.label;
            this.imageSelect.appendChild(optionElement);
        });
        this.imageSelect.selectedIndex = 0;
        this.imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imageName = URL.createObjectURL(file);
                    this.startNewGame();
                    this.imageInputLabel.textContent = file.name;
                }
                reader.readAsDataURL(file);
            }
        });
    }
    startTimer() {
				this.timer && clearInterval(this.timer);
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            this.timerElement.textContent = this.formatTime(Date.now() - this.startTime);
        }, 1000);
    }
    stopTimer() {
        clearInterval(this.timer);
        this.endTime = Date.now();
    }
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return `${hours ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    


    initializeGame() {
        this.grid.innerHTML = '';
        this.cells = [];
        
        this.setGridSize();
        this.initializeGrid();
        this.scrambleGrid();
    }

    startNewGame() {
        this.hideVictoryScreen();
        this.size = parseInt(this.gridSizeSelect.value);
        this.imageOffset = 100 / (this.size - 1);
        this.emptyCell = { row: 0, col: 0 };
        this.initializeGame();
				this.newMatch = true;
				this.saveTimeButton.classList.remove('hidden');
        this.startTimer();
    }

    setGridSize() {
        const image = new Image();
        image.src = this.imageName;
        image.onload = () => {
            // Calculate the size that fits within the viewport while maintaining aspect ratio
            const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9);
            const gridSize = Math.min(maxSize, 600); // Cap at 600px
            const ratio = image.width / image.height;
            const gridWidth = gridSize * ratio;
            const gridHeight = gridSize / ratio;

            this.grid.style.width = gridWidth + 'px';
            this.grid.style.height = gridHeight + 'px';
            this.grid.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
            this.grid.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;
        };
    }

    getOffset(position) {
        const offset = position * this.imageOffset;
        return `${offset}%`;
    }

    initializeGrid() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.correctPosition = row + ' ' + col;
                cell.style.backgroundImage = `url('${this.imageName}')`;
                cell.style.backgroundSize = `${this.size * 100}%`;
                cell.style.backgroundPosition = `${this.getOffset(col)} ${this.getOffset(row)}`;
                cell.style.gridColumn = col + 1;
                cell.style.gridRow = row + 1;

                // Make the last cell empty
                if (row === this.emptyCell.row && col === this.emptyCell.col) {
                    cell.classList.add('empty');
                    cell.style.backgroundImage = 'none';
                } else {
                  cell.addEventListener('click', () => this.handleClick(cell));
                }

                this.grid.appendChild(cell);
                this.cells.push(cell);
            }
        }
    }

    scrambleGrid() {
        const numberOfMoves = this.size * 100;
        Array(numberOfMoves).fill(0).forEach(() => {
            const directions = [
                {row: -1, col: 0}, // up
                {row: 1, col: 0},  // down
                {row: 0, col: -1}, // left
                {row: 0, col: 1}   // right
            ];
            
            const possibleMoves = directions.reduce((acc, dir) => {
              const newRow = this.emptyCell.row + dir.row;
              const newCol = this.emptyCell.col + dir.col;
              if (newRow >= 0 && newRow < this.size && 
                newCol >= 0 && newCol < this.size) {
                acc.push({row: newRow, col: newCol});
              }
                return acc
            }, [])
            
            // Randomly select and make one of the possible moves
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                this.moveCell(randomMove.row, randomMove.col, false);
            }
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
            (cell) => cell.dataset.row === row.toString() && 
                   cell.dataset.col === col.toString()
        );
        const emptyCell = this.cells.find(
            (cell) => cell.dataset.row === this.emptyCell.row.toString() && 
                   cell.dataset.col === this.emptyCell.col.toString()
        );

        // Swap content and classes
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
        const finalTime = this.endTime - this.startTime;
        this.finalTimeElement.textContent = this.formatTime(finalTime);
    }

    hideVictoryScreen() {
        this.victoryScreen.classList.add('hidden');
    }
    autoSolve() {
        this.cells.forEach(cell => {
            const [row, col] = cell.dataset.correctPosition.split(' ');
            cell.style.gridColumn = parseInt(col) + 1;
            cell.style.gridRow = parseInt(row) + 1;
            cell.dataset.col = parseInt(col);
            cell.dataset.row = parseInt(row);
        });
        this.checkIfSolved();
    }

    checkIfSolved() {
        const isSolved = this.cells.every(cell => {
            const currentPos = cell.dataset.row + ' ' + cell.dataset.col;
            return currentPos === cell.dataset.correctPosition;
        });

        const emptyCell = this.cells.find(
            cell => cell.classList.contains('empty')
        );

        if (isSolved) {
            emptyCell.classList.remove('empty');
            emptyCell.style.backgroundImage = `url('${this.imageName}')`;
            this.cells.map(cell => {
              cell.classList.remove('correct');
            });
            this.stopTimer();
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

    initializeLeaderboard() {
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const leaderboard = this.getLeaderboard();
        this.leaderboardList.innerHTML = '';
        
        leaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            li.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.username || 'Anonymous'}</span>
                <span class="leaderboard-size">${entry.size}x${entry.size}</span>
                <span class="leaderboard-time">${this.formatTime(entry.time)}</span>
            `;
            this.leaderboardList.appendChild(li);
        });
    }

    getLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('puzzleLeaderboard') || '[]');
        return leaderboard
    }

    saveToLeaderboard(time, username) {
        const leaderboard = this.getLeaderboard();
        leaderboard.push({ 
            time, 
            size: this.size,
            username: username
        });
        localStorage.setItem('puzzleLeaderboard', JSON.stringify(
            leaderboard.sort((a, b) => a.time - b.time).slice(0, 10)
        ));
        this.updateLeaderboard();
    }
}



// Initialize the game when the page loads
window.addEventListener('load', () => {
    new SlidingPuzzle();
}); 