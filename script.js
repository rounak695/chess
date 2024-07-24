class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.timeLeft = 20;
        this.level = 1;
        this.timer = null;
        this.moveHistory = [];
        this.halfMoveClock = 0;
        this.initializeDOM();
    }

    initializeBoard() {
        return [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
    }

    initializeDOM() {
        const chessboard = document.getElementById('chessboard');
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.classList.add('square', (i + j) % 2 === 0 ? 'white' : 'black');
                square.dataset.row = i;
                square.dataset.col = j;
                square.addEventListener('click', (e) => this.handleSquareClick(e));
                chessboard.appendChild(square);
            }
        }
        this.renderBoard();
        this.startTimer();
    }

    renderBoard() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            square.textContent = this.getPieceSymbol(this.board[row][col]);
        });
    }

    getPieceSymbol(piece) {
        const symbols = {
            'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
            'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
        };
        return symbols[piece] || '';
    }

    handleSquareClick(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);

        if (this.selectedPiece) {
            this.movePiece(row, col);
        } else {
            this.selectPiece(row, col);
        }
    }

    selectPiece(row, col) {
        const piece = this.board[row][col];
        if (piece !== ' ' && this.isCurrentPlayerPiece(piece)) {
            this.selectedPiece = { row, col };
            this.highlightSquare(row, col, 'selected');
            this.showValidMoves(row, col);
        }
    }

    movePiece(toRow, toCol) {
        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;

        if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            const capturedPiece = this.board[toRow][toCol];
            this.board[toRow][toCol] = this.board[fromRow][fromCol];
            this.board[fromRow][fromCol] = ' ';

            if (this.isPawnPromotion(toRow, toCol)) {
                this.promotePawn(toRow, toCol);
            }

            this.moveHistory.push({
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                piece: this.board[toRow][toCol],
                captured: capturedPiece
            });

            if (capturedPiece !== ' ' || this.board[toRow][toCol].toLowerCase() === 'p') {
                this.halfMoveClock = 0;
            } else {
                this.halfMoveClock++;
            }

            if (this.isCheckmate(this.currentPlayer === 'white' ? 'black' : 'white')) {
                alert(`Checkmate! ${this.currentPlayer} wins!`);
            } else if (this.isDraw()) {
                alert("The game is a draw!");
            } else {
                this.endTurn();
            }
        }

        this.clearHighlights();
        this.selectedPiece = null;
        this.renderBoard();
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!this.isCurrentPlayerPiece(piece)) return false;

        if (this.isValidCastling(fromRow, fromCol, toRow, toCol)) return true;
        if (this.isValidEnPassant(fromRow, fromCol, toRow, toCol)) return true;

        switch (piece.toLowerCase()) {
            case 'r': return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'n': return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'b': return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'q': return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'k': return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
            case 'p': return this.isValidPawnMove(fromRow, fromCol, toRow, toCol);
            default: return false;
        }
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
        const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
        
        for (let i = 1; i < Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol)); i++) {
            if (this.board[fromRow + i * rowStep][fromCol + i * colStep] !== ' ') {
                r