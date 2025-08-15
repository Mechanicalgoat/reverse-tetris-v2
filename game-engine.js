/**
 * ゲームエンジン - リバーステトリス v2
 * 完全なバグ修正版
 */

// テトリミノ定義
const TETROMINOS = {
    I: { shape: [[1,1,1,1]], color: '#60a5fa' },
    O: { shape: [[1,1],[1,1]], color: '#fbbf24' },
    T: { shape: [[0,1,0],[1,1,1]], color: '#c084fc' },
    S: { shape: [[0,1,1],[1,1,0]], color: '#34d399' },
    Z: { shape: [[1,1,0],[0,1,1]], color: '#f87171' },
    J: { shape: [[1,0,0],[1,1,1]], color: '#38bdf8' },
    L: { shape: [[0,0,1],[1,1,1]], color: '#fb923c' }
};

// ゲーム定数
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 30;
const DROP_SPEED = 20; // ミリ秒/ステップ
const LINE_CLEAR_DELAY = 400; // ライン消去の遅延
const HIGHLIGHT_DURATION = 300; // ハイライト表示時間

/**
 * ゲームエンジンクラス
 */
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-piece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // ゲーム状態
        this.state = {
            isPlaying: false,
            isPaused: false,
            isGameClear: false,
            isProcessing: false
        };
        
        // ゲームデータ
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.piecesSent = 0;
        this.linesCleared = 0;
        this.currentPiece = null;
        this.selectedPiece = null;
        this.highlightedLines = [];
        
        // キュー管理
        this.pieceQueue = [];
        this.maxQueueSize = 5;
        
        // 難易度
        this.difficulty = 'normal';
        
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        this.setupCanvas();
        this.draw();
    }
    
    /**
     * キャンバス設定
     */
    setupCanvas() {
        this.canvas.width = GRID_WIDTH * CELL_SIZE;
        this.canvas.height = GRID_HEIGHT * CELL_SIZE;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    /**
     * 空のグリッドを作成
     */
    createEmptyGrid() {
        return Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
    }
    
    /**
     * ゲーム開始
     */
    start() {
        if (this.state.isPlaying) return;
        
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.isGameClear = false;
        this.state.isProcessing = false;
        
        this.updateUI();
        this.draw();
        
        console.log('Game started');
    }
    
    /**
     * ゲーム一時停止/再開
     */
    togglePause() {
        if (!this.state.isPlaying) return;
        
        this.state.isPaused = !this.state.isPaused;
        this.updateUI();
        
        console.log('Game', this.state.isPaused ? 'paused' : 'resumed');
    }
    
    /**
     * ゲームリセット
     */
    reset() {
        this.state = {
            isPlaying: false,
            isPaused: false,
            isGameClear: false,
            isProcessing: false
        };
        
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.piecesSent = 0;
        this.linesCleared = 0;
        this.currentPiece = null;
        this.selectedPiece = null;
        this.highlightedLines = [];
        this.pieceQueue = [];
        
        this.updateUI();
        this.draw();
        
        console.log('Game reset');
    }
    
    /**
     * ピース選択
     */
    selectPiece(type) {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameClear) return;
        
        // キューに追加
        if (this.state.isProcessing || this.currentPiece) {
            if (this.pieceQueue.length < this.maxQueueSize) {
                this.pieceQueue.push(type);
                this.updateQueueDisplay();
            }
            return;
        }
        
        this.processPiece(type);
    }
    
    /**
     * ピース処理
     */
    async processPiece(type) {
        this.state.isProcessing = true;
        this.selectedPiece = type;
        
        // 次のピース表示
        this.displayNextPiece(type);
        
        // AIに配置を計算させる
        const placement = window.aiEngine ? 
            window.aiEngine.findBestPlacement(this.grid, TETROMINOS[type].shape, this.difficulty) :
            this.getDefaultPlacement(type);
        
        if (!placement) {
            this.state.isProcessing = false;
            this.processQueue();
            return;
        }
        
        // ピースをアニメーション付きで配置
        await this.animatePieceDrop(type, placement);
        
        // 配置完了後の処理
        this.piecesSent++;
        this.updateScore();
        
        // ライン消去チェック（遅延を入れて確実に処理）
        setTimeout(() => {
            this.checkAndClearLines();
        }, 50);
    }
    
    /**
     * デフォルト配置（AI不在時）
     */
    getDefaultPlacement(type) {
        const shape = TETROMINOS[type].shape;
        const x = Math.floor((GRID_WIDTH - shape[0].length) / 2);
        const y = this.findDropPosition(shape, x);
        return { x, y, rotation: 0, shape };
    }
    
    /**
     * 落下位置を計算
     */
    findDropPosition(shape, x) {
        for (let y = 0; y <= GRID_HEIGHT - shape.length; y++) {
            if (!this.canPlacePiece(shape, x, y)) {
                return Math.max(0, y - 1);
            }
        }
        return GRID_HEIGHT - shape.length;
    }
    
    /**
     * ピース配置可能チェック
     */
    canPlacePiece(shape, x, y) {
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const boardX = x + dx;
                    const boardY = y + dy;
                    
                    if (boardX < 0 || boardX >= GRID_WIDTH || boardY >= GRID_HEIGHT) {
                        return false;
                    }
                    
                    if (boardY >= 0 && this.grid[boardY][boardX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * ピース落下アニメーション
     */
    async animatePieceDrop(type, placement) {
        return new Promise(resolve => {
            const piece = {
                type,
                shape: placement.shape,
                color: TETROMINOS[type].color,
                x: placement.x,
                y: 0,
                targetY: placement.y
            };
            
            this.currentPiece = piece;
            
            const animate = () => {
                if (piece.y < piece.targetY) {
                    piece.y = Math.min(piece.y + 2, piece.targetY);
                    this.draw();
                    requestAnimationFrame(animate);
                } else {
                    // 配置完了
                    this.placePieceOnGrid(piece);
                    this.currentPiece = null;
                    this.draw();
                    resolve();
                }
            };
            
            animate();
        });
    }
    
    /**
     * グリッドにピースを配置
     */
    placePieceOnGrid(piece) {
        for (let dy = 0; dy < piece.shape.length; dy++) {
            for (let dx = 0; dx < piece.shape[dy].length; dx++) {
                if (piece.shape[dy][dx]) {
                    const boardX = piece.x + dx;
                    const boardY = piece.y + dy;
                    
                    if (boardY >= 0 && boardY < GRID_HEIGHT && 
                        boardX >= 0 && boardX < GRID_WIDTH) {
                        this.grid[boardY][boardX] = piece.type;
                    }
                }
            }
        }
        
        console.log('Piece placed at', piece.x, piece.y);
    }
    
    /**
     * ライン消去チェック
     */
    checkAndClearLines() {
        // 完成ラインを検出
        const completedLines = [];
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
            let isComplete = true;
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x] === 0) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                completedLines.push(y);
            }
        }
        
        if (completedLines.length > 0) {
            console.log('Completed lines found:', completedLines);
            this.clearLines(completedLines);
        } else {
            this.checkGameState();
        }
    }
    
    /**
     * ライン消去処理
     */
    clearLines(lines) {
        // ハイライト表示
        this.highlightedLines = lines;
        this.draw();
        
        // 一定時間後に消去
        setTimeout(() => {
            // 下から順に削除（インデックスのずれを防ぐ）
            lines.sort((a, b) => b - a);
            
            for (const line of lines) {
                this.grid.splice(line, 1);
                this.grid.unshift(Array(GRID_WIDTH).fill(0));
            }
            
            this.linesCleared += lines.length;
            this.score += lines.length * 10;
            this.highlightedLines = [];
            
            console.log('Lines cleared:', lines.length, 'Total:', this.linesCleared);
            
            this.updateUI();
            this.draw();
            
            // ゲーム状態チェック
            setTimeout(() => {
                this.checkGameState();
            }, 50);
            
        }, HIGHLIGHT_DURATION);
    }
    
    /**
     * ゲーム状態チェック
     */
    checkGameState() {
        // ゲームクリア判定（上部3行にブロックがある）
        let hasBlocksInTop = false;
        
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x] !== 0) {
                    hasBlocksInTop = true;
                    break;
                }
            }
            if (hasBlocksInTop) break;
        }
        
        if (hasBlocksInTop) {
            console.log('Game Clear! Blocks reached top 3 rows');
            this.handleGameClear();
        } else {
            // 次の処理
            this.state.isProcessing = false;
            this.processQueue();
        }
    }
    
    /**
     * ゲームクリア処理
     */
    handleGameClear() {
        this.state.isGameClear = true;
        this.state.isPlaying = false;
        
        // ボーナススコア
        const difficultyBonus = {
            easy: 50,
            normal: 100,
            hard: 200
        };
        this.score += difficultyBonus[this.difficulty] || 100;
        
        this.updateUI();
        this.showGameMessage('🎉 ゲームクリア！', `スコア: ${this.score}`);
    }
    
    /**
     * キュー処理
     */
    processQueue() {
        if (this.pieceQueue.length > 0 && !this.state.isProcessing) {
            const nextPiece = this.pieceQueue.shift();
            this.updateQueueDisplay();
            this.processPiece(nextPiece);
        }
    }
    
    /**
     * 描画処理
     */
    draw() {
        // 背景クリア
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッド線
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CELL_SIZE, 0);
            this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
            this.ctx.stroke();
        }
        
        // グリッドのブロック描画
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const cell = this.grid[y][x];
                if (cell) {
                    this.drawBlock(x, y, TETROMINOS[cell].color);
                }
            }
        }
        
        // ハイライトされたライン
        if (this.highlightedLines.length > 0) {
            for (const line of this.highlightedLines) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.fillRect(0, line * CELL_SIZE, this.canvas.width, CELL_SIZE);
            }
        }
        
        // 落下中のピース
        if (this.currentPiece) {
            const piece = this.currentPiece;
            for (let dy = 0; dy < piece.shape.length; dy++) {
                for (let dx = 0; dx < piece.shape[dy].length; dx++) {
                    if (piece.shape[dy][dx]) {
                        this.drawBlock(piece.x + dx, piece.y + dy, piece.color, 0.8);
                    }
                }
            }
        }
    }
    
    /**
     * ブロック描画
     */
    drawBlock(x, y, color, alpha = 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );
        
        // ハイライト
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * CELL_SIZE + 2,
            y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            3
        );
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * 次のピース表示
     */
    displayNextPiece(type) {
        const tetromino = TETROMINOS[type];
        const ctx = this.nextCtx;
        const canvas = this.nextCanvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cellSize = 20;
        const shape = tetromino.shape;
        const offsetX = (canvas.width - shape[0].length * cellSize) / 2;
        const offsetY = (canvas.height - shape.length * cellSize) / 2;
        
        ctx.fillStyle = tetromino.color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    ctx.fillRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize - 2,
                        cellSize - 2
                    );
                }
            }
        }
    }
    
    /**
     * スコア更新
     */
    updateScore() {
        const heightPenalty = this.getMaxHeight() * 2;
        this.score = Math.max(0, 400 - this.piecesSent * 10 + this.linesCleared * 10 - heightPenalty);
    }
    
    /**
     * 最大高さ取得
     */
    getMaxHeight() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x] !== 0) {
                    return GRID_HEIGHT - y;
                }
            }
        }
        return 0;
    }
    
    /**
     * UI更新
     */
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('pieces-sent').textContent = this.piecesSent;
        document.getElementById('lines-cleared').textContent = this.linesCleared;
        document.getElementById('max-height').textContent = this.getMaxHeight();
        
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        startBtn.disabled = this.state.isPlaying;
        pauseBtn.disabled = !this.state.isPlaying;
        pauseBtn.textContent = this.state.isPaused ? '再開' : '一時停止';
    }
    
    /**
     * キュー表示更新
     */
    updateQueueDisplay() {
        document.getElementById('queue-count').textContent = this.pieceQueue.length;
    }
    
    /**
     * ゲームメッセージ表示
     */
    showGameMessage(title, message) {
        const messageEl = document.getElementById('game-message');
        messageEl.innerHTML = `
            <h2>${title}</h2>
            <p>${message}</p>
            <p>送ったミノ: ${this.piecesSent}</p>
            <p>消去ライン: ${this.linesCleared}</p>
        `;
        messageEl.classList.remove('hidden');
    }
    
    /**
     * 難易度設定
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        console.log('Difficulty set to:', difficulty);
    }
}