    class CalendarPuzzle {
        constructor() {
            // Board layout matching the physical calendar puzzle
            this.boardLayout = [
                ['JAN', 'FEB', 'MAR', 'APR', '1', '2', '3', 'MON', 'TUE'],
                ['MAY', '4', '5', '6', '7', '8', '9', 'WED', ''],
                ['JUN', '10', '11', '12', '13', '14', '15', 'THU', ''],
                ['JUL', '16', '17', '18', '19', '20', '21', 'FRI', 'SAT'],
                ['AUG', '22', '23', '24', '25', '26', '27', '', 'SUN'],
                ['SEP', 'OCT', 'NOV', 'DEC', '28', '29', '30', '31', '']
            ];
            
            // Define puzzle pieces based on the physical pieces in the image (left to right)
            this.pieces = [
                { id: 'A', shape: [[0,0], [1,0], [2,0], [2,1], [3,1]], color: '#e74c3c' }, // Piece 1: L-shape (4 high)
                { id: 'B', shape: [[0,0], [1,0], [2,0], [2,1], [3,0]], color: '#3498db' }, // Piece 2: Plus/Cross (4 high)
                { id: 'C', shape: [[0,0], [1,0], [2,0], [3,0], [3,1]], color: '#2ecc71' }, // Piece 3: I-piece (4 high)
                { id: 'D', shape: [[0,0], [1,0], [2,0], [3,0], [4,0]], color: '#f39c12' }, // Piece 4: Long I-piece (5 high)
                { id: 'E', shape: [[0,1], [1,1], [2,0], [2,1], [2,2]], color: '#9b59b6' }, // Piece 5: T-piece
                { id: 'F', shape: [[0,0], [1,0], [2,0], [0,1], [2,1]], color: '#1abc9c' }, // Piece 6: U-piece
                { id: 'G', shape: [[0,0], [0,1], [1,1], [2,1], [2,2]], color: '#e67e22' }, // Piece 7: U-shape
                { id: 'H', shape: [[0,0], [1,0], [2,0], [2,1], [2,2]], color: '#34495e' }, // Piece 8: L-piece
                { id: 'I', shape: [[0,0], [1,0], [1,1], [2,1], [2,0]], color: '#95a5a6' }, // Piece 9: Z-shape
                { id: 'J', shape: [[0,1], [1,0], [1,1], [2,1], [2,2]], color: '#c0392b' } // Piece 10: Small L-piece
            ];
            
            this.board = [];
            this.currentDate = { month: 0, day: 1, weekday: 0 };
            this.selectedPiece = null;
            this.placedPieces = new Map();
            this.savedLayouts = this.loadSavedLayouts();
            
            // Enhanced solver state
            this.solverState = {
                isRunning: false,
                isPaused: false,
                startingState: null,
                history: [],
                currentStep: -1,
                totalAttempts: 0,
                invalidPlacements: 0,
                visualizationCounter: 0,
                startTime: null
            };
            
            // Speed control settings
            this.speedSettings = {
                0: { rate: 1, name: "Slow", description: "Every step", delay: { valid: 500, invalid: 300, backtrack: 200 } },
                1: { rate: 10, name: "Medium", description: "1/10 steps", delay: { valid: 250, invalid: 150, backtrack: 100 } },
                2: { rate: 100, name: "Fast", description: "1/100 steps", delay: { valid: 100, invalid: 50, backtrack: 25 } },
                3: { rate: 1000, name: "Ultra", description: "1/1000 steps", delay: { valid: 50, invalid: 25, backtrack: 10 } }
            };
            this.currentSpeed = 1; // Default to Medium
            
                    // Board state encoding for real-time ID display
        this.boardStateDisplay = {
            enabled: true,
            currentId: '0000000000000000000000000000000000000000' // 40 digits: 10 pieces × 4 digits each
        };
        
        // Track piece placement source for visual distinction
        this.pieceSourceMap = new Map(); // pieceId -> 'human' | 'solver'
            
            this.init();
        }
        
        init() {
            this.setupBoard();
            this.setupPieces();
            this.setupControls();
            this.setCurrentDate();
            this.updateBoard();
            this.updateSavesDisplay();
            this.loadSpeedPreference();
        }
        
        setupBoard() {
            const boardElement = document.getElementById('game-board');
            boardElement.innerHTML = '';
            
            this.board = [];
            for (let row = 0; row < this.boardLayout.length; row++) {
                this.board[row] = [];
                for (let col = 0; col < this.boardLayout[row].length; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'board-cell';
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    
                    const cellValue = this.boardLayout[row][col];
                    const isLastSquare = (row === this.boardLayout.length - 1 && col === this.boardLayout[row].length - 1);
                    
                    if (cellValue === '' && isLastSquare) {
                        // Last square is invalid - not part of the board
                        cell.classList.add('invalid');
                        cell.style.visibility = 'hidden';
                    } else if (cellValue === '') {
                        // Empty squares are valid and need to be covered
                        cell.classList.add('empty-valid');
                        cell.addEventListener('dragover', this.handleDragOver.bind(this));
                        cell.addEventListener('dragleave', this.handleDragLeave.bind(this));
                        cell.addEventListener('drop', this.handleDrop.bind(this));
                        cell.addEventListener('click', this.handleCellClick.bind(this));
                    } else {
                        cell.textContent = cellValue;
                        cell.addEventListener('dragover', this.handleDragOver.bind(this));
                        cell.addEventListener('dragleave', this.handleDragLeave.bind(this));
                        cell.addEventListener('drop', this.handleDrop.bind(this));
                        cell.addEventListener('click', this.handleCellClick.bind(this));
                    }
                    
                    boardElement.appendChild(cell);
                    this.board[row][col] = {
                        element: cell,
                        value: cellValue === '' && !isLastSquare ? 'EMPTY' : cellValue,
                        occupied: false,
                        pieceId: null
                    };
                }
            }
        }
        
        setupPieces() {
            const piecesArea = document.getElementById('pieces-area');
            piecesArea.innerHTML = '';
            
            this.pieces.forEach(piece => {
                const pieceElement = this.createPieceElement(piece);
                piecesArea.appendChild(pieceElement);
            });
        }
        
        createPieceElement(piece) {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'puzzle-piece';
            pieceDiv.dataset.pieceId = piece.id;
            pieceDiv.draggable = true;
            
            const maxRow = Math.max(...piece.shape.map(coord => coord[0]));
            const maxCol = Math.max(...piece.shape.map(coord => coord[1]));
            
            const pieceGrid = document.createElement('div');
            pieceGrid.className = 'piece-grid';
            pieceGrid.style.gridTemplateColumns = `repeat(${maxCol + 1}, 1fr)`;
            
            for (let row = 0; row <= maxRow; row++) {
                for (let col = 0; col <= maxCol; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'piece-cell';
                    
                    const isPartOfPiece = piece.shape.some(coord => coord[0] === row && coord[1] === col);
                    if (isPartOfPiece) {
                        cell.classList.add('filled');
                        cell.style.backgroundColor = piece.color;
                        cell.style.borderColor = piece.color;
                    } else {
                        cell.classList.add('empty');
                    }
                    
                    pieceGrid.appendChild(cell);
                }
            }
            
            pieceDiv.appendChild(pieceGrid);
            pieceDiv.addEventListener('dragstart', this.handleDragStart.bind(this));
            pieceDiv.addEventListener('dragend', this.handleDragEnd.bind(this));
            pieceDiv.addEventListener('click', this.handlePieceClick.bind(this));
            
            return pieceDiv;
        }
        
        setupControls() {
            const monthSelect = document.getElementById('month');
            const daySelect = document.getElementById('day');
            const weekdaySelect = document.getElementById('weekday');
            
            for (let i = 1; i <= 31; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                daySelect.appendChild(option);
            }
            
            monthSelect.addEventListener('change', this.handleDateChange.bind(this));
            daySelect.addEventListener('change', this.handleDateChange.bind(this));
            weekdaySelect.addEventListener('change', this.handleDateChange.bind(this));
            
            document.getElementById('reset-btn').addEventListener('click', this.resetPuzzle.bind(this));
            document.getElementById('solve-btn').addEventListener('click', this.autoSolve.bind(this));
            document.getElementById('hint-btn').addEventListener('click', this.getHint.bind(this));
            document.getElementById('rotate-btn').addEventListener('click', this.rotatePiece.bind(this));
            document.getElementById('flip-btn').addEventListener('click', this.flipPiece.bind(this));
            document.getElementById('save-btn').addEventListener('click', this.saveCurrentLayout.bind(this));
            document.getElementById('clear-saves-btn').addEventListener('click', this.clearAllSaves.bind(this));
            
            // Enhanced solver controls
            document.getElementById('solve-pause-btn').addEventListener('click', this.toggleSolverPause.bind(this));
            document.getElementById('solve-reset-btn').addEventListener('click', this.resetToStartingState.bind(this));
            document.getElementById('solve-back-btn').addEventListener('click', this.stepBackward.bind(this));
            document.getElementById('solve-forward-btn').addEventListener('click', this.stepForward.bind(this));
            document.getElementById('solve-stop-btn').addEventListener('click', this.stopSolver.bind(this));
            
            // Speed control
            document.getElementById('solve-speed').addEventListener('input', this.handleSpeedChange.bind(this));
            this.updateSpeedDisplay();
            
            // Board ID control
            document.getElementById('copy-board-id').addEventListener('click', this.copyBoardId.bind(this));
            this.updateBoardId();
            
            // Add keyboard shortcuts
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        }
        
        setCurrentDate() {
            const now = new Date();
            this.currentDate = {
                month: now.getMonth(),
                day: now.getDate(),
                weekday: (now.getDay() + 6) % 7
            };
            
            document.getElementById('month').value = this.currentDate.month;
            document.getElementById('day').value = this.currentDate.day;
            document.getElementById('weekday').value = this.currentDate.weekday;
        }
        
        handleKeydown(event) {
            // Only handle keyboard shortcuts if a piece is selected or being dragged, and we're not typing in an input
            if ((!this.selectedPiece && !this.draggingPiece) || event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
                return;
            }
            
            const key = event.key.toLowerCase();
            
            switch (key) {
                case 'r':
                    event.preventDefault();
                    if (this.draggingPiece) {
                        this.rotateDraggingPiece();
                    } else {
                        this.rotatePiece();
                    }
                    break;
                case 'f':
                    event.preventDefault();
                    if (this.draggingPiece) {
                        this.flipDraggingPiece();
                    } else {
                        this.flipPiece();
                    }
                    break;
                case 'escape':
                    event.preventDefault();
                    this.deselectPiece();
                    break;
            }
        }
        
        rotateDraggingPiece() {
            if (!this.draggingPiece) return;
            
            // Rotate the dragging piece shape
            this.draggingPiece.shape = this.draggingPiece.shape.map(([row, col]) => [col, -row]);
            const minRow = Math.min(...this.draggingPiece.shape.map(coord => coord[0]));
            const minCol = Math.min(...this.draggingPiece.shape.map(coord => coord[1]));
            this.draggingPiece.shape = this.draggingPiece.shape.map(([row, col]) => [row - minRow, col - minCol]);
            
            // Update the visual representation in the pieces area
            this.updatePieceElement(this.draggingPiece);
            
            // Update board ID if piece is placed
            if (this.placedPieces.has(this.draggingPiece.id)) {
                this.updateBoardId();
            }
            
            this.showStatus('Piece rotated while dragging!', 'info');
        }
        
        flipDraggingPiece() {
            if (!this.draggingPiece) return;
            
            // Flip the dragging piece shape
            const maxCol = Math.max(...this.draggingPiece.shape.map(coord => coord[1]));
            this.draggingPiece.shape = this.draggingPiece.shape.map(([row, col]) => [row, maxCol - col]);
            
            // Update the visual representation in the pieces area
            this.updatePieceElement(this.draggingPiece);
            
            // Update board ID if piece is placed
            if (this.placedPieces.has(this.draggingPiece.id)) {
                this.updateBoardId();
            }
            
            this.showStatus('Piece flipped while dragging!', 'info');
        }
        
        updatePieceElement(piece) {
            const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
            if (!pieceElement) return;
            
            const newPieceElement = this.createPieceElement(piece);
            newPieceElement.classList.add('dragging');
            if (this.selectedPiece === piece.id) {
                newPieceElement.classList.add('selected');
            }
            
            pieceElement.parentNode.replaceChild(newPieceElement, pieceElement);
        }
        
        deselectPiece() {
            document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('selected'));
            this.selectedPiece = null;
            this.showStatus('Piece deselected', 'info');
        }
        
        handleDateChange() {
            this.currentDate = {
                month: parseInt(document.getElementById('month').value),
                day: parseInt(document.getElementById('day').value),
                weekday: parseInt(document.getElementById('weekday').value)
            };
            // Update board display
            this.updateBoard();
            this.updateBoardId();
        }
        
        updateBoard() {
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    if (cell.value !== '') {
                        cell.element.className = 'board-cell';
                        if (!cell.occupied) {
                            cell.element.classList.remove('target', 'covered', 'error');
                        }
                    }
                }
            }
            this.highlightTargetCells();
        }
        
        highlightTargetCells() {
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            
            const targetMonth = months[this.currentDate.month];
            const targetDay = this.currentDate.day.toString();
            const targetWeekday = weekdays[this.currentDate.weekday];
            
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    if (cell.value === targetMonth || cell.value === targetDay || cell.value === targetWeekday) {
                        cell.element.classList.add('target');
                    }
                }
            }
        }
        
        handlePieceClick(event) {
            const pieceElement = event.currentTarget;
            document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('selected'));
            pieceElement.classList.add('selected');
            this.selectedPiece = pieceElement.dataset.pieceId;
        }
        
        handleDragStart(event) {
            const pieceElement = event.currentTarget;
            this.selectedPiece = pieceElement.dataset.pieceId;
            this.draggingPiece = this.pieces.find(p => p.id === this.selectedPiece);
            pieceElement.classList.add('dragging');
            event.dataTransfer.setData('text/plain', pieceElement.dataset.pieceId);
        }
        
        handleDragOver(event) {
            event.preventDefault();
            
            if (this.draggingPiece) {
                const targetRow = parseInt(event.currentTarget.dataset.row);
                const targetCol = parseInt(event.currentTarget.dataset.col);
                
                // Clear previous preview
                this.clearPreview();
                
                // Show preview of where piece would be placed
                this.showPiecePreview(this.draggingPiece, targetRow, targetCol);
            }
        }
        
        handleDragLeave(event) {
            // Only clear preview if we're leaving the board area
            if (!event.currentTarget.closest('.board')) {
                this.clearPreview();
            }
        }
        
        handleDrop(event) {
            event.preventDefault();
            
            // Clear preview
            this.clearPreview();
            
            const pieceId = event.dataTransfer.getData('text/plain');
            const targetRow = parseInt(event.currentTarget.dataset.row);
            const targetCol = parseInt(event.currentTarget.dataset.col);
            
            const placed = this.placePiece(pieceId, targetRow, targetCol);
            
            // If piece couldn't be placed and was dragged from board, put it back in pieces area
            if (!placed && this.draggingFromBoard) {
                const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
                if (pieceElement) {
                    pieceElement.classList.remove('placed');
                }
            }
            
            const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
            if (pieceElement) {
                pieceElement.classList.remove('dragging');
            }
            
            this.draggingPiece = null;
            this.draggingFromBoard = false;
        }
        
        handleDragEnd(event) {
            // Clean up any remaining drag visual effects
            event.currentTarget.classList.remove('dragging');
            this.clearPreview();
            this.draggingPiece = null;
        }
        
        handleBoardPieceDragStart(event) {
            const pieceId = event.currentTarget.dataset.pieceId || this.board[parseInt(event.currentTarget.dataset.row)][parseInt(event.currentTarget.dataset.col)].pieceId;
            
            if (pieceId) {
                this.selectedPiece = pieceId;
                this.draggingPiece = this.pieces.find(p => p.id === pieceId);
                this.draggingFromBoard = true;
                
                // Temporarily remove the piece from the board during drag
                this.removePiece(pieceId);
                
                // Add visual feedback
                event.currentTarget.classList.add('dragging-from-board');
                
                event.dataTransfer.setData('text/plain', pieceId);
                event.dataTransfer.effectAllowed = 'move';
            }
        }
        
        handleBoardPieceDragEnd(event) {
            event.currentTarget.classList.remove('dragging-from-board');
            this.draggingFromBoard = false;
            this.clearPreview();
            this.draggingPiece = null;
        }
        
        handleCellClick(event) {
            const targetRow = parseInt(event.currentTarget.dataset.row);
            const targetCol = parseInt(event.currentTarget.dataset.col);
            const cell = this.board[targetRow][targetCol];
            
            // If clicking on a placed piece, select it for moving
            if (cell.occupied && cell.pieceId) {
                this.selectedPiece = cell.pieceId;
                this.removePiece(cell.pieceId);
                
                // Update piece visual state to show it's available for placement
                const pieceElement = document.querySelector(`[data-piece-id="${cell.pieceId}"]`);
                if (pieceElement) {
                    pieceElement.classList.remove('placed');
                    pieceElement.classList.add('selected');
                }
                
                this.showStatus(`Piece ${cell.pieceId} selected for moving`, 'info');
            } else if (this.selectedPiece) {
                // Place the selected piece
                this.placePiece(this.selectedPiece, targetRow, targetCol);
            }
        }
        
            placePiece(pieceId, startRow, startCol, source = 'human') {
        const piece = this.pieces.find(p => p.id === pieceId);
        if (!piece) return false;
        
        if (!this.canPlacePiece(piece, startRow, startCol)) {
            if (source === 'human') {
                this.showStatus('Cannot place piece here!', 'error');
            }
            return false;
        }
        
        if (this.placedPieces.has(pieceId)) {
            this.removePiece(pieceId);
        }
            
            const positions = [];
            piece.shape.forEach(([row, col]) => {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                
                if (boardRow >= 0 && boardRow < this.board.length && 
                    boardCol >= 0 && boardCol < this.board[boardRow].length) {
                    
                    const cell = this.board[boardRow][boardCol];
                    cell.occupied = true;
                    cell.pieceId = pieceId;
                    cell.element.classList.add('covered');
                    cell.element.style.backgroundColor = piece.color;
                    
                    // Make placed pieces draggable from the board
                    cell.element.draggable = true;
                    cell.element.addEventListener('dragstart', this.handleBoardPieceDragStart.bind(this));
                    cell.element.addEventListener('dragend', this.handleBoardPieceDragEnd.bind(this));
                    
                    positions.push({ row: boardRow, col: boardCol });
                }
            });
            
                    this.placedPieces.set(pieceId, { piece, positions, startRow, startCol });
        
        // Track the source of this piece placement
        this.pieceSourceMap.set(pieceId, source);
        
        const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
        pieceElement.classList.add('placed');
        
        // Add visual distinction based on placement source
        if (source === 'solver') {
            pieceElement.classList.add('solver-placed');
            // Add solver styling to board cells
            positions.forEach(pos => {
                this.board[pos.row][pos.col].element.classList.add('solver-placed-cell');
            });
        } else {
            pieceElement.classList.add('human-placed');
            // Add human styling to board cells
            positions.forEach(pos => {
                this.board[pos.row][pos.col].element.classList.add('human-placed-cell');
            });
        }
        
        // Update board ID display
        this.updateBoardId();
        
        this.checkWinCondition();
        return true;
        }
        
        canPlacePiece(piece, startRow, startCol) {
            return piece.shape.every(([row, col]) => {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                
                if (boardRow < 0 || boardRow >= this.board.length || 
                    boardCol < 0 || boardCol >= this.board[boardRow].length) {
                    return false;
                }
                
                const cell = this.board[boardRow][boardCol];
                return cell.value !== '' && !cell.occupied && !cell.element.classList.contains('target');
            });
        }
        
        removePiece(pieceId) {
            const placedPiece = this.placedPieces.get(pieceId);
            if (!placedPiece) return;
            
                    placedPiece.positions.forEach(pos => {
            const cell = this.board[pos.row][pos.col];
            cell.occupied = false;
            cell.pieceId = null;
            cell.element.classList.remove('covered', 'human-placed-cell', 'solver-placed-cell');
            cell.element.style.backgroundColor = '';
            
            // Remove drag capabilities from the board cell
            cell.element.draggable = false;
            cell.element.removeEventListener('dragstart', this.handleBoardPieceDragStart.bind(this));
            cell.element.removeEventListener('dragend', this.handleBoardPieceDragEnd.bind(this));
        });
        
        const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
        pieceElement.classList.remove('placed', 'human-placed', 'solver-placed');
        
        this.placedPieces.delete(pieceId);
        this.pieceSourceMap.delete(pieceId);
        
        // Update board ID display
        this.updateBoardId();
        }
        
        checkWinCondition() {
            let unoccupiedCount = 0;
            let targetCount = 0;
            
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    if (cell.value !== '') {
                        if (!cell.occupied) {
                            unoccupiedCount++;
                            if (cell.element.classList.contains('target')) {
                                targetCount++;
                            }
                        }
                    }
                }
            }
            
            if (unoccupiedCount === 3 && targetCount === 3) {
                this.showStatus('🎉 Puzzle Solved! 🎉', 'success');
            } else if (unoccupiedCount < 3) {
                this.showStatus('Too many pieces placed!', 'error');
            } else {
                this.showStatus(`${Math.max(0, unoccupiedCount - 3)} more pieces to place`, 'info');
            }
        }
        
        resetPuzzle() {
            // Remove all placed pieces (both human and solver)
            Array.from(this.placedPieces.keys()).forEach(pieceId => {
                this.removePiece(pieceId);
            });
            
            // Clear piece source tracking
            this.pieceSourceMap.clear();
            
            // Reset all pieces to their original shapes and orientations
            this.pieces.forEach(piece => {
                if (piece.originalShape) {
                    piece.shape = JSON.parse(JSON.stringify(piece.originalShape));
                }
                piece.rotations = 0;
                piece.isFlipped = false;
                this.updatePieceElement(piece);
            });
            
            // Clear any visual effects and highlights
            this.clearIslandHighlights();
            this.clearPreview();
            
            // Remove any solver-related CSS classes from board cells
            document.querySelectorAll('.board-cell').forEach(cell => {
                cell.classList.remove('attempt-piece', 'backtrack-highlight', 'invalid-placement', 
                                    'solution-found', 'systematic-placement', 'systematic-backtrack',
                                    'solving-progress', 'invalid-island', 'human-placed-cell', 'solver-placed-cell');
            });
            
            // Reset piece selection
            this.selectedPiece = null;
            this.draggingPiece = null;
            document.querySelectorAll('.puzzle-piece').forEach(p => {
                p.classList.remove('selected', 'placed', 'dragging', 'human-placed', 'solver-placed');
            });
            
            // Stop any running solver
            if (this.solverState && this.solverState.isRunning) {
                this.stopSolver();
            }
            
            // Hide solver controls
            document.getElementById('solver-controls').style.display = 'none';
            
            // Reset solver state
            this.solverState = {
                isRunning: false,
                isPaused: false,
                startingState: null,
                history: [],
                currentStep: -1,
                totalAttempts: 0,
                invalidPlacements: 0,
                visualizationCounter: 0,
                startTime: null
            };
            
            this.updateBoard();
            this.updateBoardId();
            this.showStatus('Puzzle completely reset! All pieces returned to original state.', 'info');
        }
        
        rotatePiece() {
            if (!this.selectedPiece) {
                this.showStatus('Select a piece first!', 'error');
                return;
            }
            
            const piece = this.pieces.find(p => p.id === this.selectedPiece);
            if (!piece) return;
            
            piece.shape = piece.shape.map(([row, col]) => [col, -row]);
            const minRow = Math.min(...piece.shape.map(coord => coord[0]));
            const minCol = Math.min(...piece.shape.map(coord => coord[1]));
            piece.shape = piece.shape.map(([row, col]) => [row - minRow, col - minCol]);
            
            const pieceElement = document.querySelector(`[data-piece-id="${this.selectedPiece}"]`);
            const newPieceElement = this.createPieceElement(piece);
            newPieceElement.classList.add('selected');
            
            pieceElement.parentNode.replaceChild(newPieceElement, pieceElement);
            
            // Update board ID if piece is placed
            if (this.placedPieces.has(this.selectedPiece)) {
                this.updateBoardId();
            }
            
            this.showStatus('Piece rotated!', 'info');
        }
        
        flipPiece() {
            if (!this.selectedPiece) {
                this.showStatus('Select a piece first!', 'error');
                return;
            }
            
            const piece = this.pieces.find(p => p.id === this.selectedPiece);
            if (!piece) return;
            
            const maxCol = Math.max(...piece.shape.map(coord => coord[1]));
            piece.shape = piece.shape.map(([row, col]) => [row, maxCol - col]);
            
            const pieceElement = document.querySelector(`[data-piece-id="${this.selectedPiece}"]`);
            const newPieceElement = this.createPieceElement(piece);
            newPieceElement.classList.add('selected');
            
            pieceElement.parentNode.replaceChild(newPieceElement, pieceElement);
            
            // Update board ID if piece is placed
            if (this.placedPieces.has(this.selectedPiece)) {
                this.updateBoardId();
            }
            
            this.showStatus('Piece flipped!', 'info');
        }
        
        async autoSolve() {
            if (this.solverState.isRunning) {
                this.showStatus('Solver is already running!', 'error');
                return;
            }
            
            // Initialize solver state - capture current board state
            this.solverState = {
                isRunning: true,
                isPaused: false,
                startingState: this.captureCurrentState(),
                history: [],
                currentStep: -1,
                totalAttempts: 0,
                invalidPlacements: 0,
                visualizationCounter: 0,
                startTime: Date.now()
            };
            
            // Show solver controls and update UI
            document.getElementById('solver-controls').style.display = 'block';
            document.getElementById('solve-btn').textContent = 'Solving...';
            document.getElementById('solve-btn').disabled = true;
            
            this.updateSolverProgress('Starting enhanced auto-solver from current state...');
            this.showStatus('🚀 Enhanced auto-solver started!', 'info');
            
            // Store initial state in history
            this.addToHistory({
                type: 'start',
                state: this.captureCurrentState(),
                message: 'Starting position'
            });
            
            try {
                // Get remaining (unplaced) pieces
                const remainingPieces = this.pieces.filter(piece => !this.placedPieces.has(piece.id));
                
                if (remainingPieces.length === 0) {
                    this.updateSolverProgress('All pieces already placed!');
                    this.showStatus('All pieces are already placed!', 'info');
                    this.stopSolver();
                    return;
                }
                
                // Check for invalid islands before starting to solve
                this.updateSolverProgress('🔍 Analyzing board for invalid islands...');
                const islandAnalysis = this.detectInvalidIslands();
                
                if (islandAnalysis.hasInvalidIslands) {
                    this.updateSolverProgress(`❌ Invalid islands detected! Found ${islandAnalysis.islands.length} unreachable area(s)`);
                    this.showStatus(
                        `🚫 Solver stopped: Found ${islandAnalysis.islands.length} island(s) that cannot be filled by any remaining piece!`, 
                        'error'
                    );
                    
                    // Add island detection to history
                    this.addToHistory({
                        type: 'invalid_islands',
                        state: this.captureCurrentState(),
                        message: `Invalid islands detected: ${islandAnalysis.islands.length} unreachable area(s)`,
                        islandCount: islandAnalysis.islands.length,
                        totalIslands: islandAnalysis.totalIslands
                    });
                    
                    // Don't auto-stop, let user examine the highlighted areas
                    this.solverState.isRunning = false;
                    document.getElementById('solve-btn').textContent = 'Auto Solve';
                    document.getElementById('solve-btn').disabled = false;
                    return;
                } else if (islandAnalysis.totalIslands > 0) {
                    this.updateSolverProgress(`✅ Board analysis complete: ${islandAnalysis.totalIslands} island(s) found, all can be solved`);
                    this.showStatus(`Board analyzed: ${islandAnalysis.totalIslands} island(s) detected, all solvable`, 'info');
                } else {
                    this.updateSolverProgress('✅ Board analysis complete: No isolated areas detected');
                }
                
                // Generate all orientations for remaining pieces
                const allOrientations = this.generateRemainingPieceOrientations(remainingPieces);
                
                // Start enhanced backtracking solver
                const solution = await this.enhancedBacktrackSolve(remainingPieces, allOrientations, 0);
                
                if (solution && this.solverState.isRunning) {
                    this.updateSolverProgress('✅ Solution found!');
                    this.showStatus('✅ Solution found!', 'success');
                    
                    // Add solution to history
                    this.addToHistory({
                        type: 'solution',
                        state: this.captureCurrentState(),
                        message: 'Solution found!'
                    });
                } else if (this.solverState.isRunning) {
                    this.updateSolverProgress('❌ No solution found');
                    this.showStatus('❌ No solution found with current configuration.', 'error');
                }
                
            } catch (error) {
                if (this.solverState.isRunning) {
                    console.error('Enhanced solver error:', error);
                    this.showStatus('❌ Solver encountered an error!', 'error');
                }
            }
            
            // Don't auto-stop if paused, let user control
            if (!this.solverState.isPaused) {
                // Keep controls visible for manual navigation
                this.solverState.isRunning = false;
                document.getElementById('solve-btn').textContent = 'Auto Solve';
                document.getElementById('solve-btn').disabled = false;
            }
        }
        
        async bruteForceBacktrack() {
            // Get all valid cells that need to be covered
            const validCells = this.getValidCellsToFill();
            
            // Create deep copies of pieces with all possible orientations
            const piecesWithOrientations = this.generateAllPieceOrientations();
            
            // Start backtracking
            const solution = await this.backtrackSolve([], piecesWithOrientations, 0);
            return solution;
        }
        
        getValidCellsToFill() {
            const cells = [];
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    // Include all cells except targets and invalid cells
                    if (cell.value !== '' && !cell.element.classList.contains('target') && !cell.element.classList.contains('invalid')) {
                        cells.push({ row, col });
                    }
                }
            }
            return cells;
        }
        
        generateAllPieceOrientations() {
            const allOrientations = [];
            
            for (const piece of this.pieces) {
                const orientations = [];
                let currentShape = [...piece.shape.map(coord => [...coord])];
                
                // Generate all 4 rotations
                for (let rotation = 0; rotation < 4; rotation++) {
                    // Add normal orientation
                    orientations.push({
                        id: piece.id,
                        shape: this.normalizeShape([...currentShape]),
                        color: piece.color,
                        orientation: `r${rotation}`
                    });
                    
                    // Add flipped orientation
                    const flippedShape = this.flipShape([...currentShape]);
                    orientations.push({
                        id: piece.id,
                        shape: this.normalizeShape(flippedShape),
                        color: piece.color,
                        orientation: `r${rotation}f`
                    });
                    
                    // Rotate for next iteration
                    currentShape = this.rotateShape(currentShape);
                }
                
                allOrientations.push(orientations);
            }
            
            return allOrientations;
        }
        
        normalizeShape(shape) {
            if (shape.length === 0) return shape;
            
            const minRow = Math.min(...shape.map(coord => coord[0]));
            const minCol = Math.min(...shape.map(coord => coord[1]));
            
            return shape.map(([row, col]) => [row - minRow, col - minCol]);
        }
        
        rotateShape(shape) {
            return shape.map(([row, col]) => [col, -row]);
        }
        
        flipShape(shape) {
            const maxCol = Math.max(...shape.map(coord => coord[1]));
            return shape.map(([row, col]) => [row, maxCol - col]);
        }
        
        async backtrackSolve(currentSolution, remainingPieces, pieceIndex) {
            this.solutionSteps++;
            
            // Check if all pieces are placed
            if (pieceIndex >= remainingPieces.length) {
                return this.isSolutionComplete() ? currentSolution : null;
            }
            
            const pieceOrientations = remainingPieces[pieceIndex];
            
            // Try each orientation of this piece
            for (const pieceVariant of pieceOrientations) {
                // Try each position on the board
                for (let row = 0; row < this.board.length; row++) {
                    for (let col = 0; col < this.board[row].length; col++) {
                        
                        if (this.canPlacePieceAtPosition(pieceVariant, row, col)) {
                            // Place the piece temporarily
                            this.placePieceTemporary(pieceVariant, row, col);
                            
                            // Show the current attempt visually
                            await this.visualizeCurrentAttempt(pieceIndex, pieceVariant);
                            
                            // Add to solution
                            const solutionStep = {
                                pieceId: pieceVariant.id,
                                startRow: row,
                                startCol: col,
                                orientation: pieceVariant.orientation
                            };
                            
                            // Recurse with remaining pieces
                            const result = await this.backtrackSolve(
                                [...currentSolution, solutionStep],
                                remainingPieces,
                                pieceIndex + 1
                            );
                            
                            if (result) {
                                return result;
                            }
                            
                            // Show backtrack visualization
                            await this.visualizeBacktrack(pieceVariant);
                            
                            // Backtrack - remove the piece
                            this.removePieceTemporary(pieceVariant.id);
                        }
                    }
                }
            }
            
            return null; // No solution found with this configuration
        }
        
        canPlacePieceAtPosition(piece, startRow, startCol) {
            return piece.shape.every(([row, col]) => {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                
                if (boardRow < 0 || boardRow >= this.board.length || 
                    boardCol < 0 || boardCol >= this.board[boardRow].length) {
                    return false;
                }
                
                const cell = this.board[boardRow][boardCol];
                return cell.value !== '' && !cell.occupied && !cell.element.classList.contains('target');
            });
        }
        
        placePieceTemporary(piece, startRow, startCol) {
            const positions = [];
            piece.shape.forEach(([row, col]) => {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                
                const cell = this.board[boardRow][boardCol];
                cell.occupied = true;
                cell.pieceId = piece.id;
                positions.push({ row: boardRow, col: boardCol });
            });
            
            this.placedPieces.set(piece.id, { piece, positions, startRow, startCol });
        }
        
        removePieceTemporary(pieceId) {
            const placedPiece = this.placedPieces.get(pieceId);
            if (!placedPiece) return;
            
            placedPiece.positions.forEach(pos => {
                const cell = this.board[pos.row][pos.col];
                cell.occupied = false;
                cell.pieceId = null;
            });
            
            this.placedPieces.delete(pieceId);
        }
        
        isSolutionComplete() {
            let unoccupiedCount = 0;
            let targetCount = 0;
            
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    if (cell.value !== '' && !cell.occupied) {
                        unoccupiedCount++;
                        if (cell.element.classList.contains('target')) {
                            targetCount++;
                        }
                    }
                }
            }
            
            return unoccupiedCount === 3 && targetCount === 3;
        }
        
        async visualizeCurrentAttempt(pieceIndex, pieceVariant) {
            // Update the visual board to show current state
            this.updateVisualBoard();
            
            // Show status with current attempt info
            const elapsed = Date.now() - this.solutionStartTime;
            const placedCount = this.placedPieces.size;
            this.showStatus(
                `🔍 Trying piece ${pieceVariant.id} (${pieceVariant.orientation}) - ${placedCount}/10 placed - ${this.solutionSteps} attempts (${elapsed/1000}s)`, 
                'info'
            );
            
            // Delay to show the attempt (1 second as requested)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        async visualizeBacktrack(pieceVariant) {
            // Highlight the piece being removed with a different color
            const placedPiece = this.placedPieces.get(pieceVariant.id);
            if (placedPiece) {
                placedPiece.positions.forEach(pos => {
                    const cell = this.board[pos.row][pos.col];
                    cell.element.style.backgroundColor = '#e74c3c';
                    cell.element.style.opacity = '0.8';
                    cell.element.classList.add('backtrack-highlight');
                });
            }
            
            this.showStatus(`❌ Piece ${pieceVariant.id} doesn't lead to solution - backtracking...`, 'error');
            
            // Brief delay to show the backtrack
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Clear the backtrack highlighting
            document.querySelectorAll('.backtrack-highlight').forEach(cell => {
                cell.classList.remove('backtrack-highlight');
            });
        }
        
        updateVisualBoard() {
            // Update all cells to show current state
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    
                    // Clear previous visual states
                    cell.element.classList.remove('solving-progress', 'attempt-piece', 'backtrack-highlight');
                    
                    if (cell.occupied && cell.pieceId) {
                        const placedPiece = this.placedPieces.get(cell.pieceId);
                        if (placedPiece) {
                            cell.element.style.backgroundColor = placedPiece.piece.color;
                            cell.element.style.opacity = '0.8';
                            cell.element.classList.add('attempt-piece');
                        }
                    } else if (!cell.element.classList.contains('target') && !cell.element.classList.contains('invalid')) {
                        // Clear non-target, non-invalid cells
                        cell.element.style.backgroundColor = '';
                        cell.element.style.opacity = '';
                    }
                }
            }
        }
        
        async applySolutionWithAnimation(solution) {
            this.resetPuzzle();
            
            for (let i = 0; i < solution.length; i++) {
                const step = solution[i];
                const piece = this.pieces.find(p => p.id === step.pieceId);
                
                // Apply any transformations based on orientation
                this.applyOrientationToOriginalPiece(piece, step.orientation);
                
                // Place the piece
                this.placePiece(step.pieceId, step.startRow, step.startCol);
                
                // Show animation step
                this.showStatus(`Placing piece ${step.pieceId} (${i + 1}/${solution.length})`, 'info');
                
                // Delay for animation
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            this.showStatus('🎉 Solution applied!', 'success');
        }
        
        applyOrientationToOriginalPiece(piece, orientation) {
            // Parse orientation string (e.g., "r2f" means rotate 2 times then flip)
            const rotations = parseInt(orientation.match(/r(\d)/)?.[1] || '0');
            const flipped = orientation.includes('f');
            
            // Apply rotations
            for (let i = 0; i < rotations; i++) {
                piece.shape = this.rotateShape(piece.shape);
                piece.shape = this.normalizeShape(piece.shape);
            }
            
            // Apply flip if needed
            if (flipped) {
                piece.shape = this.flipShape(piece.shape);
                piece.shape = this.normalizeShape(piece.shape);
            }
        }
        
        getHint() {
            if (this.placedPieces.size === 0) {
                this.showStatus('💡 Start by placing larger pieces first!', 'info');
            } else {
                this.showStatus('💡 Try rotating or flipping pieces to fit better!', 'info');
            }
        }
        
        showPiecePreview(piece, startRow, startCol) {
            if (!piece) return;
            
            piece.shape.forEach(([row, col]) => {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                
                if (boardRow >= 0 && boardRow < this.board.length && 
                    boardCol >= 0 && boardCol < this.board[boardRow].length) {
                    
                    const cell = this.board[boardRow][boardCol];
                    if (cell.value !== '' && !cell.occupied) {
                        if (cell.element.classList.contains('target')) {
                            // Don't preview on target cells
                            return;
                        }
                        cell.element.classList.add('piece-preview');
                        cell.element.style.backgroundColor = piece.color;
                        cell.element.style.opacity = '0.5';
                    }
                }
            });
        }
        
        clearPreview() {
            document.querySelectorAll('.piece-preview').forEach(cell => {
                cell.classList.remove('piece-preview');
                cell.style.backgroundColor = '';
                cell.style.opacity = '';
            });
            
            // Also clear any drag-over highlights
            document.querySelectorAll('.drag-over').forEach(cell => {
                cell.classList.remove('drag-over');
            });
        }
        
        showStatus(message, type) {
            const statusElement = document.getElementById('status');
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            
            if (type !== 'success') {
                setTimeout(() => {
                    if (statusElement.textContent === message) {
                        statusElement.textContent = '';
                        statusElement.className = 'status';
                    }
                }, 3000);
            }
        }
        
        // Save/Restore functionality
        loadSavedLayouts() {
            try {
                const saved = localStorage.getItem('calendarPuzzleSaves');
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                console.error('Error loading saved layouts:', error);
                return [];
            }
        }
        
        saveSavedLayouts() {
            try {
                localStorage.setItem('calendarPuzzleSaves', JSON.stringify(this.savedLayouts));
            } catch (error) {
                console.error('Error saving layouts:', error);
            }
        }
        
        saveCurrentLayout() {
            // Check if there are any pieces placed
            if (this.placedPieces.size === 0) {
                this.showStatus('Nothing to save - board is empty!', 'error');
                return;
            }
            
            // Create save data
            const saveData = {
                id: Date.now(),
                name: `Layout ${this.savedLayouts.length + 1}`,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                currentDate: { ...this.currentDate },
                placedPieces: [],
                pieceShapes: {}
            };
            
            // Capture placed pieces and their current shapes
            this.placedPieces.forEach((placedPiece, pieceId) => {
                saveData.placedPieces.push({
                    pieceId: pieceId,
                    startRow: placedPiece.startRow,
                    startCol: placedPiece.startCol,
                    positions: [...placedPiece.positions]
                });
                
                // Save the current shape of the piece
                const piece = this.pieces.find(p => p.id === pieceId);
                saveData.pieceShapes[pieceId] = [...piece.shape.map(coord => [...coord])];
            });
            
            // Add to saved layouts
            this.savedLayouts.unshift(saveData);
            
            // Keep only the last 10 saves
            if (this.savedLayouts.length > 10) {
                this.savedLayouts = this.savedLayouts.slice(0, 10);
            }
            
            this.saveSavedLayouts();
            this.updateSavesDisplay();
            
            this.showStatus(`Layout saved as "${saveData.name}"!`, 'success');
        }
        
        restoreLayout(saveData) {
            // Check if board has pieces and warn user
            if (this.placedPieces.size > 0) {
                const userConfirmed = confirm(
                    `⚠️ Warning: This will clear your current progress!\n\n` +
                    `You have ${this.placedPieces.size} pieces placed on the board.\n` +
                    `Do you want to continue and load "${saveData.name}"?`
                );
                
                if (!userConfirmed) {
                    return;
                }
            }
            
            // Clear current board
            this.resetPuzzle();
            
            // Restore the date
            this.currentDate = { ...saveData.currentDate };
            document.getElementById('month').value = this.currentDate.month;
            document.getElementById('day').value = this.currentDate.day;
            document.getElementById('weekday').value = this.currentDate.weekday;
            this.updateBoard();
            
            // Restore piece shapes
            Object.entries(saveData.pieceShapes).forEach(([pieceId, shape]) => {
                const piece = this.pieces.find(p => p.id === pieceId);
                if (piece) {
                    piece.shape = shape.map(coord => [...coord]);
                    // Update the visual representation
                    this.updatePieceElement(piece);
                }
            });
            
            // Restore placed pieces
            saveData.placedPieces.forEach(placedPieceData => {
                this.placePiece(placedPieceData.pieceId, placedPieceData.startRow, placedPieceData.startCol);
            });
            
            this.showStatus(`Layout "${saveData.name}" restored!`, 'success');
            this.updateSavesDisplay();
        }
        
        deleteLayout(saveId) {
            const saveIndex = this.savedLayouts.findIndex(save => save.id === saveId);
            if (saveIndex !== -1) {
                const saveName = this.savedLayouts[saveIndex].name;
                this.savedLayouts.splice(saveIndex, 1);
                this.saveSavedLayouts();
                this.updateSavesDisplay();
                this.showStatus(`Layout "${saveName}" deleted!`, 'info');
            }
        }
        
        clearAllSaves() {
            if (this.savedLayouts.length === 0) {
                this.showStatus('No saves to clear!', 'info');
                return;
            }
            
            const userConfirmed = confirm(
                `⚠️ Are you sure you want to delete all ${this.savedLayouts.length} saved layouts?\n\n` +
                `This action cannot be undone!`
            );
            
            if (userConfirmed) {
                this.savedLayouts = [];
                this.saveSavedLayouts();
                this.updateSavesDisplay();
                this.showStatus('All saved layouts cleared!', 'info');
            }
        }
        
        updateSavesDisplay() {
            const savesArea = document.getElementById('saves-area');
            const clearButton = document.getElementById('clear-saves-btn');
            
            if (this.savedLayouts.length === 0) {
                savesArea.innerHTML = '<div class="no-saves">No saved layouts yet</div>';
                clearButton.disabled = true;
                return;
            }
            
            clearButton.disabled = false;
            
            savesArea.innerHTML = '';
            
            this.savedLayouts.forEach(saveData => {
                const saveElement = this.createSaveElement(saveData);
                savesArea.appendChild(saveElement);
            });
        }
        
        createSaveElement(saveData) {
            const saveDiv = document.createElement('div');
            saveDiv.className = 'saved-layout';
            saveDiv.dataset.saveId = saveData.id;
            
            // Check if this is the current board state
            const isCurrentState = this.isCurrentBoardState(saveData);
            if (isCurrentState) {
                saveDiv.classList.add('active');
            }
            
            saveDiv.innerHTML = `
                <div class="save-header">
                    <div class="save-name">${saveData.name}</div>
                    <div class="save-date">${saveData.date} ${saveData.time}</div>
                </div>
                <div class="save-info">
                    ${saveData.placedPieces.length} pieces placed • ${this.getMonthName(saveData.currentDate.month)} ${saveData.currentDate.day}
                </div>
                <div class="save-preview">
                    ${this.createSavePreview(saveData)}
                </div>
                <button class="save-delete-btn" title="Delete this save">×</button>
            `;
            
            // Add click handler for restore
            saveDiv.addEventListener('click', (e) => {
                if (!e.target.classList.contains('save-delete-btn')) {
                    this.restoreLayout(saveData);
                }
            });
            
            // Add click handler for delete
            saveDiv.querySelector('.save-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteLayout(saveData.id);
            });
            
            return saveDiv;
        }
        
        createSavePreview(saveData) {
            let preview = '';
            
            // Create mini board preview
            for (let row = 0; row < this.boardLayout.length; row++) {
                for (let col = 0; col < this.boardLayout[row].length; col++) {
                    const cellValue = this.boardLayout[row][col];
                    const isLastSquare = (row === this.boardLayout.length - 1 && col === this.boardLayout[row].length - 1);
                    
                    if (cellValue === '' && isLastSquare) {
                        continue; // Skip invalid cells
                    }
                    
                    let cellClass = 'save-preview-cell';
                    
                    if (cellValue === '') {
                        cellClass += ' empty';
                    } else {
                        // Check if this cell is a target
                        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                        const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                        const targetMonth = months[saveData.currentDate.month];
                        const targetDay = saveData.currentDate.day.toString();
                        const targetWeekday = weekdays[saveData.currentDate.weekday];
                        
                        if (cellValue === targetMonth || cellValue === targetDay || cellValue === targetWeekday) {
                            cellClass += ' target';
                        } else {
                            // Check if occupied
                            const isOccupied = saveData.placedPieces.some(placedPiece => 
                                placedPiece.positions.some(pos => pos.row === row && pos.col === col)
                            );
                            
                            if (isOccupied) {
                                cellClass += ' occupied';
                            }
                        }
                    }
                    
                    preview += `<div class="${cellClass}"></div>`;
                }
            }
            
            return preview;
        }
        
        isCurrentBoardState(saveData) {
            // Check if the save data matches current board state
            if (saveData.placedPieces.length !== this.placedPieces.size) {
                return false;
            }
            
            // Check if dates match
            if (saveData.currentDate.month !== this.currentDate.month ||
                saveData.currentDate.day !== this.currentDate.day ||
                saveData.currentDate.weekday !== this.currentDate.weekday) {
                return false;
            }
            
            // Check if all pieces match
            return saveData.placedPieces.every(savedPiece => {
                const currentPiece = this.placedPieces.get(savedPiece.pieceId);
                return currentPiece && 
                    currentPiece.startRow === savedPiece.startRow && 
                    currentPiece.startCol === savedPiece.startCol;
            });
        }
        
        getMonthName(monthIndex) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[monthIndex];
        }
        
        // Island Detection Methods
        detectInvalidIslands() {
            // Clear any existing island highlights
            this.clearIslandHighlights();
            
            // Get all empty cells that need to be filled
            const emptyCells = this.getEmptyCells();
            
            if (emptyCells.length === 0) {
                return { hasInvalidIslands: false, islands: [] };
            }
            
            // Find connected components (islands) of empty cells
            const islands = this.findConnectedComponents(emptyCells);
            
            // Get remaining pieces to check against
            const remainingPieces = this.pieces.filter(piece => !this.placedPieces.has(piece.id));
            
            if (remainingPieces.length === 0) {
                return { hasInvalidIslands: false, islands: [] };
            }
            
            // Check each island to see if any remaining piece can fit
            const invalidIslands = [];
            
            for (const island of islands) {
                if (!this.canAnyPieceFitInIsland(island, remainingPieces)) {
                    invalidIslands.push(island);
                    this.highlightIsland(island);
                }
            }
            
            return {
                hasInvalidIslands: invalidIslands.length > 0,
                islands: invalidIslands,
                totalIslands: islands.length,
                remainingPieces: remainingPieces.length
            };
        }
        
        getEmptyCells() {
            const emptyCells = [];
            
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    
                    // Include cells that are not targets, not occupied, not invalid, and not empty strings
                    if (cell.value !== '' && 
                        !cell.element.classList.contains('target') && 
                        !cell.element.classList.contains('invalid') && 
                        !cell.occupied) {
                        emptyCells.push({ row, col });
                    }
                }
            }
            
            return emptyCells;
        }
        
        findConnectedComponents(cells) {
            const visited = new Set();
            const islands = [];
            
            // Create a lookup map for faster searching
            const cellMap = new Map();
            cells.forEach(cell => {
                cellMap.set(`${cell.row},${cell.col}`, cell);
            });
            
            for (const cell of cells) {
                const key = `${cell.row},${cell.col}`;
                if (!visited.has(key)) {
                    const island = [];
                    this.floodFill(cell, cellMap, visited, island);
                    islands.push(island);
                }
            }
            
            return islands;
        }
        
        floodFill(startCell, cellMap, visited, island) {
            const stack = [startCell];
            const key = `${startCell.row},${startCell.col}`;
            
            if (visited.has(key)) return;
            
            while (stack.length > 0) {
                const cell = stack.pop();
                const cellKey = `${cell.row},${cell.col}`;
                
                if (visited.has(cellKey)) continue;
                
                visited.add(cellKey);
                island.push(cell);
                
                // Check all 4 adjacent cells
                const neighbors = [
                    { row: cell.row - 1, col: cell.col }, // up
                    { row: cell.row + 1, col: cell.col }, // down
                    { row: cell.row, col: cell.col - 1 }, // left
                    { row: cell.row, col: cell.col + 1 }  // right
                ];
                
                for (const neighbor of neighbors) {
                    const neighborKey = `${neighbor.row},${neighbor.col}`;
                    if (cellMap.has(neighborKey) && !visited.has(neighborKey)) {
                        stack.push(neighbor);
                    }
                }
            }
        }
        
        canAnyPieceFitInIsland(island, remainingPieces) {
            // Convert island to a set for faster lookup
            const islandSet = new Set(island.map(cell => `${cell.row},${cell.col}`));
            
            // Try each remaining piece in all possible orientations
            for (const piece of remainingPieces) {
                const orientations = this.generateAllOrientations(piece);
                
                for (const orientation of orientations) {
                    // Try placing the piece at each position in the island
                    for (const islandCell of island) {
                        if (this.canPieceFitInIslandAtPosition(orientation, islandCell.row, islandCell.col, islandSet)) {
                            return true; // Found at least one piece that can fit
                        }
                    }
                }
            }
            
            return false; // No piece can fit in this island
        }
        
        canPieceFitInIslandAtPosition(pieceShape, startRow, startCol, islandSet) {
            // Check if all cells of the piece fit within the island
            for (const [row, col] of pieceShape) {
                const boardRow = startRow + row;
                const boardCol = startCol + col;
                const cellKey = `${boardRow},${boardCol}`;
                
                // The piece cell must be within the island
                if (!islandSet.has(cellKey)) {
                    return false;
                }
            }
            
            return true;
        }
        
        generateAllOrientations(piece) {
            const orientations = [];
            let currentShape = [...piece.shape.map(coord => [...coord])];
            
            // Generate all 4 rotations
            for (let rotation = 0; rotation < 4; rotation++) {
                // Add normal orientation
                orientations.push(this.normalizeShape([...currentShape]));
                
                // Add flipped orientation
                const flippedShape = this.flipShape([...currentShape]);
                orientations.push(this.normalizeShape(flippedShape));
                
                // Rotate for next iteration
                currentShape = this.rotateShape(currentShape);
            }
            
            // Remove duplicates
            const uniqueOrientations = [];
            const seen = new Set();
            
            for (const orientation of orientations) {
                const key = JSON.stringify(orientation);
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueOrientations.push(orientation);
                }
            }
            
            return uniqueOrientations;
        }
        
        highlightIsland(island) {
            island.forEach(cell => {
                const boardCell = this.board[cell.row][cell.col];
                boardCell.element.classList.add('invalid-island');
            });
        }
        
        clearIslandHighlights() {
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    this.board[row][col].element.classList.remove('invalid-island');
                }
            }
        }
        
        // Enhanced Solver Methods
            captureCurrentState() {
        return {
            currentDate: { ...this.currentDate },
            placedPieces: new Map(this.placedPieces),
            pieceShapes: new Map(this.pieces.map(piece => [piece.id, [...piece.shape.map(coord => [...coord])]])),
            pieceSourceMap: new Map(this.pieceSourceMap)
        };
    }
        
            restoreState(state) {
        // Clear current pieces and source tracking
        this.placedPieces.clear();
        this.pieceSourceMap.clear();
        
        // Restore date
        this.currentDate = { ...state.currentDate };
        document.getElementById('month').value = this.currentDate.month;
        document.getElementById('day').value = this.currentDate.day;
        document.getElementById('weekday').value = this.currentDate.weekday;
        
        // Restore piece shapes
        state.pieceShapes.forEach((shape, pieceId) => {
            const piece = this.pieces.find(p => p.id === pieceId);
            if (piece) {
                piece.shape = shape.map(coord => [...coord]);
                this.updatePieceElement(piece);
            }
        });
        
        // Restore piece source tracking
        if (state.pieceSourceMap) {
            state.pieceSourceMap.forEach((source, pieceId) => {
                this.pieceSourceMap.set(pieceId, source);
            });
        }
        
        // Restore placed pieces with proper visual styling
        state.placedPieces.forEach((placedPiece, pieceId) => {
            this.placedPieces.set(pieceId, { ...placedPiece });
            
            // Apply visual styling based on piece source
            const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
            const source = this.pieceSourceMap.get(pieceId) || 'human';
            
            if (pieceElement) {
                pieceElement.classList.add('placed');
                if (source === 'solver') {
                    pieceElement.classList.add('solver-placed');
                } else {
                    pieceElement.classList.add('human-placed');
                }
            }
            
            // Apply styling to board cells
            placedPiece.positions.forEach(pos => {
                const cell = this.board[pos.row][pos.col];
                cell.occupied = true;
                cell.pieceId = pieceId;
                cell.element.classList.add('covered');
                
                const piece = this.pieces.find(p => p.id === pieceId);
                if (piece) {
                    cell.element.style.backgroundColor = piece.color;
                }
                
                if (source === 'solver') {
                    cell.element.classList.add('solver-placed-cell');
                } else {
                    cell.element.classList.add('human-placed-cell');
                }
            });
        });
        
        // Update board display
        this.updateBoard();
        this.updateBoardId();
    }
        
            addToHistory(historyStep) {
        // Only add valid states to history (states where all placed pieces are in valid positions)
        if (historyStep.type === 'invalid_placement' || historyStep.type === 'island_backtrack') {
            // Skip adding invalid states to history - we don't want to navigate to them
            return;
        }
        
        // Remove any steps after current position (if we went back and then made new progress)
        this.solverState.history = this.solverState.history.slice(0, this.solverState.currentStep + 1);
        
        // Add new step
        this.solverState.history.push(historyStep);
        this.solverState.currentStep = this.solverState.history.length - 1;
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }
        
        updateNavigationButtons() {
            const backBtn = document.getElementById('solve-back-btn');
            const forwardBtn = document.getElementById('solve-forward-btn');
            
            backBtn.disabled = this.solverState.currentStep <= 0;
            forwardBtn.disabled = this.solverState.currentStep >= this.solverState.history.length - 1;
        }
        
        updateSolverProgress(message) {
            document.getElementById('solve-progress').textContent = message;
            const elapsed = ((Date.now() - this.solverState.startTime) / 1000).toFixed(1);
            const efficiency = this.solverState.totalAttempts > 0 ? 
                `${Math.round((this.solverState.invalidPlacements / this.solverState.totalAttempts) * 100)}% avoided` : '0% avoided';
            const attemptsPerSecond = elapsed > 0 ? Math.round(this.solverState.totalAttempts / elapsed) : 0;
            const currentSpeedSetting = this.speedSettings[this.currentSpeed];
            const visualizations = Math.floor(this.solverState.visualizationCounter / currentSpeedSetting.rate);
            
            document.getElementById('solve-stats').textContent = 
                `⚡ ${attemptsPerSecond}/s | Invalid: ${efficiency} | Visualizations: ${visualizations} | Time: ${elapsed}s | Step: ${this.solverState.currentStep + 1}/${this.solverState.history.length}`;
        }
        
        generateRemainingPieceOrientations(remainingPieces) {
            const allOrientations = [];
            
            for (const piece of remainingPieces) {
                const orientations = [];
                let currentShape = [...piece.shape.map(coord => [...coord])];
                
                // Generate all 4 rotations
                for (let rotation = 0; rotation < 4; rotation++) {
                    // Add normal orientation
                    orientations.push({
                        id: piece.id,
                        shape: this.normalizeShape([...currentShape]),
                        color: piece.color,
                        orientation: `r${rotation}`
                    });
                    
                    // Add flipped orientation
                    const flippedShape = this.flipShape([...currentShape]);
                    orientations.push({
                        id: piece.id,
                        shape: this.normalizeShape(flippedShape),
                        color: piece.color,
                        orientation: `r${rotation}f`
                    });
                    
                    // Rotate for next iteration
                    currentShape = this.rotateShape(currentShape);
                }
                
                allOrientations.push(orientations);
            }
            
            return allOrientations;
        }
        
        async enhancedBacktrackSolve(remainingPieces, allOrientations, pieceIndex) {
            // Check for pause/stop
            while (this.solverState.isPaused && this.solverState.isRunning) {
                await this.sleep(100);
            }
            
            if (!this.solverState.isRunning) {
                return null;
            }
            
            this.solverState.totalAttempts++;
            this.solverState.visualizationCounter++;
            
            // Determine if this iteration should be visualized based on current speed setting
            const currentSpeedSetting = this.speedSettings[this.currentSpeed];
            const shouldVisualize = (this.solverState.visualizationCounter % currentSpeedSetting.rate === 0) || this.solverState.isPaused;
            
            // Update progress every 100 attempts (less frequent updates)
            if (this.solverState.totalAttempts % 100 === 0) {
                const visualizations = Math.floor(this.solverState.visualizationCounter / currentSpeedSetting.rate);
                this.updateSolverProgress(`🚀 ${currentSpeedSetting.name} solving... trying piece ${pieceIndex + 1}/${remainingPieces.length} (${visualizations} visualizations)`);
                await this.sleep(5); // Very brief pause for UI updates
            }
            
            // Check if all remaining pieces are placed
            if (pieceIndex >= remainingPieces.length) {
                return this.checkEnhancedSolution() ? [] : null;
            }
            
            // OPTIMIZATION 1: Early constraint validation
            // Before trying any pieces, check if current state is still solvable
            const constraintCheck = await this.validateConstraintsBeforePlacement(remainingPieces.slice(pieceIndex), shouldVisualize, currentSpeedSetting);
            if (!constraintCheck.isSolvable) {
                if (shouldVisualize || this.solverState.isPaused) {
                    this.addToHistory({
                        type: 'constraint_failure',
                        state: this.captureCurrentState(),
                        message: `⚡ Constraint check failed: ${constraintCheck.reason} - early pruning`,
                        constraintReason: constraintCheck.reason
                    });
                    await this.sleep(currentSpeedSetting.delay.backtrack);
                }
                return null;
            }
            
            // OPTIMIZATION 2: Get optimized placement order focusing on most constrained areas
            const optimizedPlacements = await this.getOptimizedPlacementOrder(remainingPieces, allOrientations, pieceIndex);
            
            // Try placements in optimized order
            for (const placement of optimizedPlacements) {
                if (!this.solverState.isRunning) return null;
                
                const { pieceVariant, row, col, constraintScore } = placement;
                const originalPiece = this.pieces.find(p => p.id === pieceVariant.id);
                const originalShape = [...originalPiece.shape.map(coord => [...coord])];
                
                // Update piece shape and place it
                originalPiece.shape = [...pieceVariant.shape.map(coord => [...coord])];
                this.updatePieceElement(originalPiece);
                this.placePiece(pieceVariant.id, row, col, 'solver');
                
                // OPTIMIZATION 3: Advanced constraint validation after placement
                const advancedValidation = await this.performAdvancedConstraintValidation(remainingPieces.slice(pieceIndex + 1), shouldVisualize, currentSpeedSetting);
                
                if (!advancedValidation.isValid) {
                    // Track invalid placement statistics
                    this.solverState.invalidPlacements++;
                    
                    // Add to history only if visualizing or paused
                    if (shouldVisualize || this.solverState.isPaused) {
                        this.addToHistory({
                            type: 'advanced_constraint_failure',
                            state: this.captureCurrentState(),
                            message: `⚡ Advanced constraint failure: ${advancedValidation.reason} - smart pruning (score: ${constraintScore})`,
                            pieceId: pieceVariant.id,
                            position: { row, col },
                            orientation: pieceVariant.orientation,
                            constraintScore: constraintScore,
                            failureReason: advancedValidation.reason
                        });
                        
                        await this.visualizeInvalidPlacement(row, col);
                    }
                    
                    // Remove the piece and restore original shape
                    this.removePiece(pieceVariant.id);
                    originalPiece.shape = originalShape;
                    this.updatePieceElement(originalPiece);
                    this.clearIslandHighlights();
                    
                    // Clear any invalid placement highlights
                    document.querySelectorAll('.invalid-placement').forEach(cell => {
                        cell.classList.remove('invalid-placement');
                    });
                    
                    if (shouldVisualize || this.solverState.isPaused) {
                        await this.sleep(currentSpeedSetting.delay.backtrack);
                    }
                    
                    continue;
                }
                
                // Valid placement - show visual feedback
                if (shouldVisualize || this.solverState.isPaused) {
                    this.highlightPlacedPiece(pieceVariant.id);
                    
                    this.addToHistory({
                        type: 'optimized_placement',
                        state: this.captureCurrentState(),
                        message: `🎯 Optimized placement: piece ${originalPiece.id} at (${row}, ${col}) (constraint score: ${constraintScore})`,
                        pieceId: pieceVariant.id,
                        position: { row, col },
                        orientation: pieceVariant.orientation,
                        constraintScore: constraintScore
                    });
                    
                    await this.sleep(currentSpeedSetting.delay.valid);
                } else {
                    await this.sleep(Math.max(10, currentSpeedSetting.delay.valid / 10));
                }
                
                // Recurse with remaining pieces
                const result = await this.enhancedBacktrackSolve(remainingPieces, allOrientations, pieceIndex + 1);
                
                if (result !== null) {
                    return [{ pieceId: pieceVariant.id, startRow: row, startCol: col, orientation: pieceVariant.orientation }, ...result];
                }
                
                // Backtrack - remove the piece and restore original shape
                if (shouldVisualize || this.solverState.isPaused) {
                    this.highlightBacktrackPiece(pieceVariant.id);
                }
                
                this.removePiece(pieceVariant.id);
                originalPiece.shape = originalShape;
                this.updatePieceElement(originalPiece);
                
                if (shouldVisualize || this.solverState.isPaused) {
                    this.addToHistory({
                        type: 'optimized_backtrack',
                        state: this.captureCurrentState(),
                        message: `🔄 Optimized backtrack from piece ${originalPiece.id} (constraint score: ${constraintScore})`,
                        pieceId: pieceVariant.id,
                        constraintScore: constraintScore
                    });
                    
                    await this.sleep(currentSpeedSetting.delay.backtrack);
                } else {
                    await this.sleep(Math.max(5, currentSpeedSetting.delay.backtrack / 10));
                }
            }
            
            return null; // No solution found
        }
    
    async solvePrioritizingSmallestIslands(remainingPieces, allOrientations, pieceIndex, shouldVisualize, currentSpeedSetting, pieceVariant, originalPiece, row, col) {
        // Get current empty cells and analyze islands
        const emptyCells = this.getEmptyCells();
        const islands = this.findConnectedComponents(emptyCells);
        
        // Only prioritize if we have multiple islands
        if (islands.length <= 1) {
            return null; // Use normal solving approach
        }
        
        // Sort islands by size (smallest first)
        islands.sort((a, b) => a.length - b.length);
        
        // Show island prioritization message
        if (shouldVisualize || this.solverState.isPaused) {
            this.addToHistory({
                type: 'island_prioritization',
                state: this.captureCurrentState(),
                message: `🎯 Island prioritization: ${islands.length} islands found (sizes: ${islands.map(i => i.length).join(', ')}) - targeting smallest first`,
                pieceId: pieceVariant.id,
                position: { row, col },
                orientation: pieceVariant.orientation,
                islandCount: islands.length,
                islandSizes: islands.map(i => i.length)
            });
        }
        
        // Try to solve starting with the smallest island
        const result = await this.solveTargetingSpecificIslands(remainingPieces, allOrientations, pieceIndex, islands, shouldVisualize, currentSpeedSetting);
        
        return result;
    }
    
    async solveTargetingSpecificIslands(remainingPieces, allOrientations, pieceIndex, sortedIslands, shouldVisualize, currentSpeedSetting) {
        // Get pieces that haven't been placed yet
        const availablePieces = remainingPieces.slice(pieceIndex);
        
        if (availablePieces.length === 0) {
            return this.checkEnhancedSolution() ? [] : null;
        }
        
        // For each island (starting with smallest), try to place pieces there first
        for (let islandIdx = 0; islandIdx < sortedIslands.length; islandIdx++) {
            const targetIsland = sortedIslands[islandIdx];
            
            // Try each remaining piece in this island
            for (let pIdx = 0; pIdx < availablePieces.length; pIdx++) {
                const piece = availablePieces[pIdx];
                const pieceOrientations = allOrientations[pieceIndex + pIdx];
                
                if (!this.solverState.isRunning) return null;
                
                // Try each orientation of the current piece
                for (const pieceVariant of pieceOrientations) {
                    // Try placing the piece at each position in the target island
                    for (const islandCell of targetIsland) {
                        if (!this.solverState.isRunning) return null;
                        
                        if (this.canPlacePieceAtPosition(pieceVariant, islandCell.row, islandCell.col)) {
                            // Update piece shape and place it
                            const originalPiece = this.pieces.find(p => p.id === pieceVariant.id);
                            const originalShape = [...originalPiece.shape.map(coord => [...coord])];
                            
                            originalPiece.shape = [...pieceVariant.shape.map(coord => [...coord])];
                            this.updatePieceElement(originalPiece);
                            this.placePiece(pieceVariant.id, islandCell.row, islandCell.col, 'solver');
                            
                            // Check if this placement creates invalid islands
                            const islandAnalysis = this.detectInvalidIslands();
                            
                            if (islandAnalysis.hasInvalidIslands) {
                                // Remove the piece and try next position
                                this.removePiece(pieceVariant.id);
                                originalPiece.shape = originalShape;
                                this.updatePieceElement(originalPiece);
                                continue;
                            }
                            
                            // Valid placement - show visual feedback
                            if (shouldVisualize || this.solverState.isPaused) {
                                this.highlightPlacedPiece(pieceVariant.id);
                                
                                this.addToHistory({
                                    type: 'island_targeted_placement',
                                    state: this.captureCurrentState(),
                                    message: `🎯 Island-targeted placement: piece ${originalPiece.id} placed in island ${islandIdx + 1}/${sortedIslands.length} (size: ${targetIsland.length})`,
                                    pieceId: pieceVariant.id,
                                    position: { row: islandCell.row, col: islandCell.col },
                                    orientation: pieceVariant.orientation,
                                    targetIslandIndex: islandIdx,
                                    targetIslandSize: targetIsland.length
                                });
                                
                                await this.sleep(currentSpeedSetting.delay.valid);
                            }
                            
                            // Create new remaining pieces array without this piece
                            const newRemainingPieces = [...remainingPieces];
                            newRemainingPieces.splice(pieceIndex + pIdx, 1);
                            
                            // Create new orientations array without this piece
                            const newAllOrientations = [...allOrientations];
                            newAllOrientations.splice(pieceIndex + pIdx, 1);
                            
                            // Recursively solve with remaining pieces
                            const result = await this.enhancedBacktrackSolve(newRemainingPieces, newAllOrientations, pieceIndex);
                            
                            if (result !== null) {
                                return [{ pieceId: pieceVariant.id, startRow: islandCell.row, startCol: islandCell.col, orientation: pieceVariant.orientation }, ...result];
                            }
                            
                            // Backtrack - remove the piece
                            if (shouldVisualize || this.solverState.isPaused) {
                                this.highlightBacktrackPiece(pieceVariant.id);
                            }
                            
                            this.removePiece(pieceVariant.id);
                            originalPiece.shape = originalShape;
                            this.updatePieceElement(originalPiece);
                            
                            if (shouldVisualize || this.solverState.isPaused) {
                                this.addToHistory({
                                    type: 'island_targeted_backtrack',
                                    state: this.captureCurrentState(),
                                    message: `🔄 Island-targeted backtrack: piece ${originalPiece.id} removed from island ${islandIdx + 1}`,
                                    pieceId: pieceVariant.id
                                });
                                
                                await this.sleep(currentSpeedSetting.delay.backtrack);
                            }
                        }
                    }
                }
            }
        }
        
        return null; // No solution found with island prioritization
    }
    
    // OPTIMIZATION METHODS
    
    async validateConstraintsBeforePlacement(remainingPieces, shouldVisualize, currentSpeedSetting) {
        // Get current empty cells and analyze islands
        const emptyCells = this.getEmptyCells();
        const islands = this.findConnectedComponents(emptyCells);
        
        // Check if we have any islands that are too small for any remaining piece
        for (const island of islands) {
            const canFit = this.canAnyPieceFitInIsland(island, remainingPieces);
            if (!canFit) {
                return {
                    isSolvable: false,
                    reason: `Island of size ${island.length} cannot fit any remaining piece`
                };
            }
        }
        
        // Check if total remaining space matches total remaining piece sizes
        const totalEmptySpace = emptyCells.length;
        const totalPieceSize = remainingPieces.reduce((sum, piece) => sum + piece.shape.length, 0);
        
        if (totalEmptySpace !== totalPieceSize) {
            return {
                isSolvable: false,
                reason: `Space mismatch: ${totalEmptySpace} empty cells vs ${totalPieceSize} piece cells`
            };
        }
        
        // Advanced constraint: Check if small islands have sufficient piece options
        const constrainedIslands = islands.filter(island => island.length <= 6);
        for (const island of constrainedIslands) {
            const fittingPieces = remainingPieces.filter(piece => 
                this.canAnyPieceFitInIsland(island, [piece])
            );
            
            if (fittingPieces.length === 0) {
                return {
                    isSolvable: false,
                    reason: `Constrained island (size ${island.length}) has no fitting pieces`
                };
            }
        }
        
        return { isSolvable: true };
    }
    
    async getOptimizedPlacementOrder(remainingPieces, allOrientations, pieceIndex) {
        const placements = [];
        const emptyCells = this.getEmptyCells();
        const islands = this.findConnectedComponents(emptyCells);
        
        // Sort islands by size (smallest first) for constraint-focused approach
        islands.sort((a, b) => a.length - b.length);
        
        // For each remaining piece, generate all valid placements with constraint scores
        for (let pIdx = pieceIndex; pIdx < remainingPieces.length; pIdx++) {
            const pieceOrientations = allOrientations[pIdx];
            
            for (const pieceVariant of pieceOrientations) {
                // Try placing in constrained areas first (smallest islands)
                for (const island of islands) {
                    for (const cell of island) {
                        if (this.canPlacePieceAtPosition(pieceVariant, cell.row, cell.col)) {
                            const constraintScore = this.calculateConstraintScore(
                                pieceVariant, cell.row, cell.col, island, islands, remainingPieces.slice(pieceIndex)
                            );
                            
                            placements.push({
                                pieceVariant,
                                row: cell.row,
                                col: cell.col,
                                constraintScore,
                                islandSize: island.length,
                                pieceIndex: pIdx
                            });
                        }
                    }
                }
            }
        }
        
        // Sort placements by constraint score (higher score = more constrained = higher priority)
        placements.sort((a, b) => {
            // Primary sort: constraint score (higher first)
            if (b.constraintScore !== a.constraintScore) {
                return b.constraintScore - a.constraintScore;
            }
            // Secondary sort: smaller islands first
            if (a.islandSize !== b.islandSize) {
                return a.islandSize - b.islandSize;
            }
            // Tertiary sort: earlier pieces first
            return a.pieceIndex - b.pieceIndex;
        });
        
        // Limit to reasonable number of top placements to avoid excessive branching
        return placements.slice(0, Math.min(50, placements.length));
    }
    
    calculateConstraintScore(pieceVariant, row, col, targetIsland, allIslands, remainingPieces) {
        let score = 0;
        
        // Higher score for smaller islands (more constrained)
        score += Math.max(0, 10 - targetIsland.length);
        
        // Higher score if this piece fits tightly in the island
        const pieceSize = pieceVariant.shape.length;
        if (pieceSize === targetIsland.length) {
            score += 20; // Perfect fit bonus
        } else if (pieceSize > targetIsland.length * 0.8) {
            score += 10; // Good fit bonus
        }
        
        // Higher score if few pieces can fit in this island
        const fittingPieces = remainingPieces.filter(piece => 
            this.canAnyPieceFitInIsland(targetIsland, [piece])
        );
        score += Math.max(0, 10 - fittingPieces.length);
        
        // Higher score if this placement would create fewer, larger remaining islands
        // (This requires simulation but we'll approximate)
        const cellsCovered = pieceVariant.shape.length;
        if (cellsCovered >= targetIsland.length * 0.5) {
            score += 5; // Good coverage bonus
        }
        
        // Bonus for corner/edge positions (often more constrained)
        const boardEdges = this.countAdjacentBoardEdges(row, col);
        score += boardEdges * 2;
        
        return score;
    }
    
    countAdjacentBoardEdges(row, col) {
        let edges = 0;
        if (row === 0) edges++;
        if (row === this.board.length - 1) edges++;
        if (col === 0) edges++;
        if (col === this.board[0].length - 1) edges++;
        return edges;
    }
    
    async performAdvancedConstraintValidation(remainingPieces, shouldVisualize, currentSpeedSetting) {
        // Get current state after placement
        const emptyCells = this.getEmptyCells();
        const islands = this.findConnectedComponents(emptyCells);
        
        // Check for invalid islands (islands that can't fit any remaining piece)
        for (const island of islands) {
            if (!this.canAnyPieceFitInIsland(island, remainingPieces)) {
                return {
                    isValid: false,
                    reason: `Island of size ${island.length} cannot fit any remaining piece`
                };
            }
        }
        
        // Advanced check: Look ahead to see if small islands will have options after next placement
        const criticalIslands = islands.filter(island => island.length <= 7);
        for (const island of criticalIslands) {
            const fittingPieces = remainingPieces.filter(piece => 
                this.canAnyPieceFitInIsland(island, [piece])
            );
            
            // If only one piece can fit, make sure we're not blocking it elsewhere
            if (fittingPieces.length === 1) {
                const criticalPiece = fittingPieces[0];
                
                // Check if this piece can ONLY fit in this island
                let canFitElsewhere = false;
                for (const otherIsland of islands) {
                    if (otherIsland !== island && this.canAnyPieceFitInIsland(otherIsland, [criticalPiece])) {
                        canFitElsewhere = true;
                        break;
                    }
                }
                
                if (!canFitElsewhere) {
                    // This is good - the piece is constrained to this island
                    continue;
                }
                
                // Check if removing this piece from consideration would make other islands unsolvable
                const otherPieces = remainingPieces.filter(p => p.id !== criticalPiece.id);
                let wouldCreateDeadlock = false;
                
                for (const otherIsland of islands) {
                    if (otherIsland !== island && !this.canAnyPieceFitInIsland(otherIsland, otherPieces)) {
                        wouldCreateDeadlock = true;
                        break;
                    }
                }
                
                if (wouldCreateDeadlock) {
                    return {
                        isValid: false,
                        reason: `Critical piece ${criticalPiece.id} creates deadlock between islands`
                    };
                }
            }
        }
        
        return { isValid: true };
    }
    
    checkEnhancedSolution() {
            // Check if all non-target, non-invalid cells are covered
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[row].length; col++) {
                    const cell = this.board[row][col];
                    if (cell.value !== '' && 
                        !cell.element.classList.contains('target') && 
                        !cell.element.classList.contains('invalid') && 
                        !cell.occupied) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // Enhanced Solver Control Methods
        toggleSolverPause() {
            if (!this.solverState.isRunning) {
                this.showStatus('No active solving session to pause!', 'error');
                return;
            }
            
            this.solverState.isPaused = !this.solverState.isPaused;
            const pauseBtn = document.getElementById('solve-pause-btn');
            
            if (this.solverState.isPaused) {
                pauseBtn.textContent = 'Resume';
                pauseBtn.classList.add('paused');
                this.updateSolverProgress('⏸️ Solving paused - use navigation buttons to step through');
                this.showStatus('Solver paused - use step controls to navigate', 'info');
            } else {
                pauseBtn.textContent = 'Pause';
                pauseBtn.classList.remove('paused');
                this.updateSolverProgress('▶️ Solving resumed...');
                this.showStatus('Solver resumed', 'info');
            }
        }
        
        resetToStartingState() {
            if (!this.solverState.startingState) {
                this.showStatus('No starting state to restore!', 'error');
                return;
            }
            
            this.removeSolverPieces();
            this.updateSolverProgress('🔄 Reset to starting state - removed solver pieces');
            this.showStatus('Reset to starting state - solver pieces removed', 'info');
            
            // Reset history position but keep history
            this.solverState.currentStep = 0;
            this.updateNavigationButtons();
            this.updateBoardId();
        }
        
        removeSolverPieces() {
            // Remove only solver-placed pieces, keep human-placed pieces
            const solverPieces = [];
            for (const [pieceId, source] of this.pieceSourceMap) {
                if (source === 'solver') {
                    solverPieces.push(pieceId);
                }
            }
            
            // Remove solver pieces
            solverPieces.forEach(pieceId => {
                this.removePiece(pieceId);
            });
            
            // Reset piece shapes to original for all pieces
            this.pieces.forEach(piece => {
                const originalShapes = this.getOriginalPieceShapes();
                if (originalShapes[piece.id]) {
                    piece.shape = originalShapes[piece.id].map(coord => [...coord]);
                    this.updatePieceElement(piece);
                }
            });
            
            // Clear solver visual effects
            document.querySelectorAll('.board-cell').forEach(cell => {
                cell.classList.remove('attempt-piece', 'backtrack-highlight', 'invalid-placement', 
                                    'solution-found', 'systematic-placement', 'systematic-backtrack',
                                    'solving-progress', 'invalid-island');
            });
            
            // Clear solver highlighting from pieces
            document.querySelectorAll('.puzzle-piece.solver-placed').forEach(p => {
                p.classList.remove('solver-placed');
            });
        }
        
        removeHumanPieces() {
            // Remove only human-placed pieces, keep solver-placed pieces
            const humanPieces = [];
            for (const [pieceId, source] of this.pieceSourceMap) {
                if (source === 'human') {
                    humanPieces.push(pieceId);
                }
            }
            
            // Remove human pieces
            humanPieces.forEach(pieceId => {
                this.removePiece(pieceId);
            });
            
            // Clear human highlighting from pieces
            document.querySelectorAll('.puzzle-piece.human-placed').forEach(p => {
                p.classList.remove('human-placed');
            });
        }
        
        stepBackward() {
            if (this.solverState.currentStep <= 0) {
                this.showStatus('Already at the beginning!', 'error');
                return;
            }
            
            this.solverState.currentStep--;
            const historyStep = this.solverState.history[this.solverState.currentStep];
            
            this.restoreState(historyStep.state);
            this.updateSolverProgress(`⬅️ ${historyStep.message}`);
            this.showStatus(`Stepped back: ${historyStep.message}`, 'info');
            
            this.updateNavigationButtons();
        }
        
        stepForward() {
            if (this.solverState.currentStep >= this.solverState.history.length - 1) {
                this.showStatus('Already at the latest step!', 'error');
                return;
            }
            
            this.solverState.currentStep++;
            const historyStep = this.solverState.history[this.solverState.currentStep];
            
            this.restoreState(historyStep.state);
            this.updateSolverProgress(`➡️ ${historyStep.message}`);
            this.showStatus(`Stepped forward: ${historyStep.message}`, 'info');
            
            this.updateNavigationButtons();
        }
        
        stopSolver() {
            this.solverState.isRunning = false;
            this.solverState.isPaused = false;
            
            // Clear any island highlights
            this.clearIslandHighlights();
            
            // Hide solver controls
            document.getElementById('solver-controls').style.display = 'none';
            
            // Reset main button
            document.getElementById('solve-btn').textContent = 'Auto Solve';
            document.getElementById('solve-btn').disabled = false;
            
            this.showStatus('Solver stopped', 'info');
        }
        
        // Speed Control Methods
        handleSpeedChange(event) {
            this.currentSpeed = parseInt(event.target.value);
            this.updateSpeedDisplay();
            
            // Save preference to localStorage
            localStorage.setItem('calendarPuzzleSolverSpeed', this.currentSpeed);
            
            const speedSetting = this.speedSettings[this.currentSpeed];
            this.showStatus(`Speed changed to ${speedSetting.name} (${speedSetting.description})`, 'info');
        }
        
        updateSpeedDisplay() {
            const speedSetting = this.speedSettings[this.currentSpeed];
            const displayElement = document.getElementById('speed-display');
            
            displayElement.textContent = `${speedSetting.name} Speed (${speedSetting.description})`;
            
            // Update slider visual feedback
            const slider = document.getElementById('solve-speed');
            slider.value = this.currentSpeed;
            
            // Add color coding based on speed
            const colors = ['#e74c3c', '#f39c12', '#3498db', '#9b59b6'];
            slider.style.background = `linear-gradient(to right, ${colors[this.currentSpeed]} 0%, ${colors[this.currentSpeed]} ${(this.currentSpeed / 3) * 100}%, #ddd ${(this.currentSpeed / 3) * 100}%, #ddd 100%)`;
        }
        
        loadSpeedPreference() {
            const savedSpeed = localStorage.getItem('calendarPuzzleSolverSpeed');
            if (savedSpeed !== null && savedSpeed >= 0 && savedSpeed <= 3) {
                this.currentSpeed = parseInt(savedSpeed);
            }
            this.updateSpeedDisplay();
        }
        
        // Board State Encoding System
        encodeBoardState() {
            // Create a 40-digit board state ID
            // Format: 10 pieces × 4 digits each = PROF
            // P = Placed (0 or 1)
            // R = Row position (0-5)
            // O = Orientation index (0-7: 4 rotations × 2 flips)
            // F = Column position (0-8)
            
            let boardId = '';
            
            for (const piece of this.pieces) {
                if (this.placedPieces.has(piece.id)) {
                    const placedPiece = this.placedPieces.get(piece.id);
                    const orientation = this.getOrientationIndex(piece);
                    
                    boardId += '1'; // Placed
                    boardId += placedPiece.startRow.toString(); // Row (0-5)
                    boardId += orientation.toString(); // Orientation (0-7)
                    boardId += placedPiece.startCol.toString(); // Column (0-8)
                } else {
                    boardId += '0000'; // Not placed
                }
            }
            
            return boardId;
        }
        
        getOrientationIndex(piece) {
            // Calculate orientation index based on piece transformations
            // This is a simplified version - you might need to adjust based on your piece rotation logic
            const originalShapes = this.getOriginalPieceShapes();
            const originalShape = originalShapes[piece.id];
            
            if (!originalShape) return 0;
            
            // Generate all 8 possible orientations (4 rotations × 2 flips)
            const orientations = [];
            let currentShape = [...originalShape];
            
            for (let rotation = 0; rotation < 4; rotation++) {
                // Normal orientation
                orientations.push(this.normalizeShape([...currentShape]));
                
                // Flipped orientation
                const flippedShape = this.flipShape([...currentShape]);
                orientations.push(this.normalizeShape(flippedShape));
                
                // Rotate for next iteration
                currentShape = this.rotateShape(currentShape);
            }
            
            // Find which orientation matches the current piece shape
            const normalizedCurrent = this.normalizeShape(piece.shape);
            
            for (let i = 0; i < orientations.length; i++) {
                if (this.shapesEqual(normalizedCurrent, orientations[i])) {
                    return i;
                }
            }
            
            return 0; // Default to first orientation
        }
        
            getOriginalPieceShapes() {
        // Return the original shapes for all pieces (matching constructor definitions)
        return {
            'A': [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]],
            'B': [[0, 0], [1, 0], [2, 0], [2, 1], [3, 0]],
            'C': [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
            'D': [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
            'E': [[0, 1], [1, 1], [2, 0], [2, 1], [2, 2]],
            'F': [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]],
            'G': [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
            'H': [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
            'I': [[0, 0], [1, 0], [1, 1], [2, 1], [2, 0]],
            'J': [[0, 1], [1, 0], [1, 1], [2, 1], [2, 2]]
        };
    }
        
        shapesEqual(shape1, shape2) {
            if (shape1.length !== shape2.length) return false;
            
            const str1 = JSON.stringify(shape1.sort());
            const str2 = JSON.stringify(shape2.sort());
            return str1 === str2;
        }
        
        updateBoardId() {
            if (!this.boardStateDisplay.enabled) return;
            
            const newId = this.encodeBoardState();
            this.boardStateDisplay.currentId = newId;
            
            const boardIdElement = document.getElementById('board-id');
            if (boardIdElement) {
                boardIdElement.value = newId;
                
                // Add visual feedback for changes
                boardIdElement.style.background = '#e3f2fd';
                setTimeout(() => {
                    boardIdElement.style.background = '#ffffff';
                }, 200);
            }
        }
        
        copyBoardId() {
            const boardIdElement = document.getElementById('board-id');
            if (boardIdElement) {
                boardIdElement.select();
                document.execCommand('copy');
                
                // Visual feedback
                const copyBtn = document.getElementById('copy-board-id');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓';
                copyBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '#007bff';
                }, 1000);
                
                this.showStatus('Board ID copied to clipboard!', 'info');
            }
        }
        

        

        

        
        highlightPlacedPiece(pieceId) {
            const placedPiece = this.placedPieces.get(pieceId);
            if (!placedPiece) return;
            
            // Temporarily highlight the piece with a blue placement effect
            placedPiece.positions.forEach(pos => {
                const cell = this.board[pos.row][pos.col];
                cell.element.classList.add('attempt-piece');
            });
            
            // Remove highlight after a short delay
            setTimeout(() => {
                if (this.placedPieces.has(pieceId)) {
                    const currentPiece = this.placedPieces.get(pieceId);
                    currentPiece.positions.forEach(pos => {
                        const cell = this.board[pos.row][pos.col];
                        cell.element.classList.remove('attempt-piece');
                    });
                }
            }, 300);
        }
        
        highlightBacktrackPiece(pieceId) {
            const placedPiece = this.placedPieces.get(pieceId);
            if (!placedPiece) return;
            
            // Temporarily highlight the piece with a red backtrack effect
            placedPiece.positions.forEach(pos => {
                const cell = this.board[pos.row][pos.col];
                cell.element.classList.add('backtrack-highlight');
            });
            
            // Remove highlight after a short delay
            setTimeout(() => {
                // Note: piece might already be removed, so check if elements still exist
                placedPiece.positions.forEach(pos => {
                    const cell = this.board[pos.row][pos.col];
                    if (cell && cell.element) {
                        cell.element.classList.remove('backtrack-highlight');
                    }
                });
            }, 200);
        }
        
        async visualizeInvalidPlacement(row, col) {
            // Show visual feedback for invalid piece placement
            const currentSpeedSetting = this.speedSettings[this.currentSpeed];
            
            // Add flash effect to the placed piece temporarily
            const allPositions = [];
            this.placedPieces.forEach(placedPiece => {
                placedPiece.positions.forEach(pos => {
                    allPositions.push(pos);
                    this.board[pos.row][pos.col].element.classList.add('invalid-placement');
                });
            });
            
            await this.sleep(currentSpeedSetting.delay.invalid);
            
            // Remove invalid placement highlighting
            allPositions.forEach(pos => {
                this.board[pos.row][pos.col].element.classList.remove('invalid-placement');
            });
        }
        
        async highlightSolutionFound() {
            // Special celebration animation for found solutions
            const allPositions = [];
            this.placedPieces.forEach(placedPiece => {
                placedPiece.positions.forEach(pos => {
                    allPositions.push(pos);
                    this.board[pos.row][pos.col].element.classList.add('solution-found');
                });
            });
            
            // Longer celebration delay
            await this.sleep(1000);
            
            // Clean up celebration styling
            allPositions.forEach(pos => {
                this.board[pos.row][pos.col].element.classList.remove('solution-found');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new CalendarPuzzle();
    }); 