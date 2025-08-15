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
        
        const cellSize = Math.min(\n            (width - 10) / shape[0].length,\n            (height - 10) / shape.length\n        );\n        const offsetX = (width - shape[0].length * cellSize) / 2;\n        const offsetY = (height - shape.length * cellSize) / 2;\n        \n        ctx.fillStyle = color;\n        \n        for (let y = 0; y < shape.length; y++) {\n            for (let x = 0; x < shape[y].length; x++) {\n                if (shape[y][x]) {\n                    ctx.fillRect(\n                        offsetX + x * cellSize,\n                        offsetY + y * cellSize,\n                        cellSize - 1,\n                        cellSize - 1\n                    );\n                }\n            }\n        }\n    }\n    \n    /**\n     * コントロールボタンの設定\n     */\n    setupControls() {\n        const startBtn = document.getElementById('start-btn');\n        const pauseBtn = document.getElementById('pause-btn');\n        const resetBtn = document.getElementById('reset-btn');\n        \n        if (startBtn) {\n            startBtn.addEventListener('click', () => {\n                if (!this.isInitialized) return;\n                this.gameEngine.start();\n                this.hideGameMessage();\n            });\n        }\n        \n        if (pauseBtn) {\n            pauseBtn.addEventListener('click', () => {\n                if (!this.isInitialized) return;\n                this.gameEngine.togglePause();\n            });\n        }\n        \n        if (resetBtn) {\n            resetBtn.addEventListener('click', () => {\n                if (!this.isInitialized) return;\n                this.gameEngine.reset();\n                this.hideGameMessage();\n            });\n        }\n    }\n    \n    /**\n     * 難易度設定\n     */\n    setupDifficulty() {\n        const difficultySelect = document.getElementById('difficulty');\n        if (!difficultySelect) return;\n        \n        difficultySelect.addEventListener('change', (e) => {\n            if (!this.isInitialized) return;\n            \n            const difficulty = e.target.value;\n            this.gameEngine.setDifficulty(difficulty);\n            \n            // 新規ゲームでない場合は警告\n            if (this.gameEngine.state.isPlaying) {\n                this.showTemporaryMessage('難易度変更は次のゲームから反映されます');\n            }\n        });\n    }\n    \n    /**\n     * ゲームメッセージを非表示\n     */\n    hideGameMessage() {\n        const messageEl = document.getElementById('game-message');\n        if (messageEl) {\n            messageEl.classList.add('hidden');\n        }\n    }\n    \n    /**\n     * 一時的なメッセージ表示\n     */\n    showTemporaryMessage(message) {\n        const messageEl = document.getElementById('game-message');\n        if (!messageEl) return;\n        \n        messageEl.innerHTML = `<p>${message}</p>`;\n        messageEl.classList.remove('hidden');\n        \n        setTimeout(() => {\n            messageEl.classList.add('hidden');\n        }, 2000);\n    }\n    \n    /**\n     * エラー表示\n     */\n    showError(message) {\n        alert(message);\n    }\n}\n\n// アプリケーション開始\nconst app = new ReverseTetricsApp();\n\n// グローバルアクセス用\nwindow.reverseTetricsApp = app;\n\n// デバッグ用ヘルパー\nif (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {\n    window.debugGame = () => {\n        console.log('Game State:', app.gameEngine?.state);\n        console.log('Grid:', app.gameEngine?.grid);\n        console.log('Score:', app.gameEngine?.score);\n        console.log('AI Engine:', window.aiEngine);\n    };\n    \n    console.log('Debug mode enabled. Use debugGame() to inspect game state.');\n}"