/**
 * メインアプリケーション - リバーステトリス v2
 * UIとゲームエンジンの統合
 */

class ReverseTetricsApp {
    constructor() {
        this.gameEngine = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    /**
     * アプリケーション初期化
     */
    init() {
        // DOM読み込み完了を待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    /**
     * セットアップ
     */
    setup() {
        try {
            // ゲームエンジン初期化
            this.gameEngine = new GameEngine();
            
            // UI要素の設定
            this.setupPieceSelector();
            this.setupControls();
            this.setupDifficulty();
            
            // 初期UI更新
            this.gameEngine.updateUI();
            
            this.isInitialized = true;
            console.log('Reverse Tetris v2 initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('ゲームの初期化に失敗しました。ページを再読み込みしてください。');
        }
    }
    
    /**
     * ピースセレクターの設定
     */
    setupPieceSelector() {
        const selector = document.getElementById('piece-selector');
        if (!selector) return;
        
        selector.innerHTML = '';
        
        Object.entries(TETROMINOS).forEach(([type, tetromino]) => {
            const btn = document.createElement('button');
            btn.className = 'piece-btn';
            btn.dataset.type = type;
            btn.title = `${type}ピース`;
            
            // ミニキャンバス作成
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            
            // ピース描画
            this.drawMiniPiece(ctx, tetromino.shape, tetromino.color, 50, 50);
            
            btn.appendChild(canvas);
            
            // クリックイベント
            btn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                
                // ビジュアルフィードバック
                btn.classList.add('selected');
                setTimeout(() => btn.classList.remove('selected'), 200);
                
                // ピース選択
                this.gameEngine.selectPiece(type);
            });
            
            selector.appendChild(btn);
        });
    }
    
    /**
     * ミニピース描画
     */
    drawMiniPiece(ctx, shape, color, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        const cellSize = Math.min(
            (width - 10) / shape[0].length,
            (height - 10) / shape.length
        );
        const offsetX = (width - shape[0].length * cellSize) / 2;
        const offsetY = (height - shape.length * cellSize) / 2;
        
        ctx.fillStyle = color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    ctx.fillRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize - 1,
                        cellSize - 1
                    );
                }
            }
        }
    }
    
    /**
     * コントロールボタンの設定
     */
    setupControls() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                this.gameEngine.start();
                this.hideGameMessage();
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                this.gameEngine.togglePause();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (!this.isInitialized) return;
                this.gameEngine.reset();
                this.hideGameMessage();
            });
        }
    }
    
    /**
     * 難易度設定
     */
    setupDifficulty() {
        const difficultySelect = document.getElementById('difficulty');
        if (!difficultySelect) return;
        
        difficultySelect.addEventListener('change', (e) => {
            if (!this.isInitialized) return;
            
            const difficulty = e.target.value;
            this.gameEngine.setDifficulty(difficulty);
            
            // 新規ゲームでない場合は警告
            if (this.gameEngine.state.isPlaying) {
                this.showTemporaryMessage('難易度変更は次のゲームから反映されます');
            }
        });
    }
    
    /**
     * ゲームメッセージを非表示
     */
    hideGameMessage() {
        const messageEl = document.getElementById('game-message');
        if (messageEl) {
            messageEl.classList.add('hidden');
        }
    }
    
    /**
     * 一時的なメッセージ表示
     */
    showTemporaryMessage(message) {
        const messageEl = document.getElementById('game-message');
        if (!messageEl) return;
        
        messageEl.innerHTML = `<p>${message}</p>`;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 2000);
    }
    
    /**
     * エラー表示
     */
    showError(message) {
        alert(message);
    }
}

// アプリケーション開始
const app = new ReverseTetricsApp();

// グローバルアクセス用
window.reverseTetricsApp = app;

// デバッグ用ヘルパー
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugGame = () => {
        console.log('Game State:', app.gameEngine?.state);
        console.log('Grid:', app.gameEngine?.grid);
        console.log('Score:', app.gameEngine?.score);
        console.log('AI Engine:', window.aiEngine);
    };
    
    console.log('Debug mode enabled. Use debugGame() to inspect game state.');
}