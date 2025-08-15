/**
 * AIエンジン - リバーステトリス v2
 * 高性能AI思考エンジン
 */

class AIEngine {
    constructor() {
        this.difficultyParams = {
            easy: {
                heightWeight: -0.3,
                linesWeight: 0.5,
                holesWeight: -0.5,
                bumpinessWeight: -0.2,
                randomness: 0.3
            },
            normal: {
                heightWeight: -0.5,
                linesWeight: 1.0,
                holesWeight: -1.0,
                bumpinessWeight: -0.3,
                randomness: 0.1
            },
            hard: {
                heightWeight: -0.8,
                linesWeight: 1.5,
                holesWeight: -2.0,
                bumpinessWeight: -0.5,
                randomness: 0.0
            }
        };
    }
    
    /**
     * 最適な配置を検索
     */
    findBestPlacement(grid, shape, difficulty = 'normal') {
        const params = this.difficultyParams[difficulty] || this.difficultyParams.normal;
        let bestScore = -Infinity;
        let bestPlacement = null;
        
        // 全ての回転状態を試す
        for (let rotation = 0; rotation < 4; rotation++) {
            const rotatedShape = this.rotateShape(shape, rotation);
            
            // 全ての横位置を試す
            for (let x = 0; x <= GRID_WIDTH - rotatedShape[0].length; x++) {
                const y = this.findDropPosition(grid, rotatedShape, x);
                
                if (y >= 0) {
                    // 仮想ボードで評価
                    const testGrid = this.cloneGrid(grid);
                    this.placePieceOnGrid(testGrid, rotatedShape, x, y);
                    
                    const score = this.evaluateGrid(testGrid, params);
                    const finalScore = score + (Math.random() - 0.5) * params.randomness;
                    
                    if (finalScore > bestScore) {
                        bestScore = finalScore;
                        bestPlacement = {
                            x: x,
                            y: y,
                            rotation: rotation,
                            shape: rotatedShape
                        };
                    }
                }
            }
        }
        
        return bestPlacement;
    }
    
    /**
     * シェイプ回転
     */
    rotateShape(shape, times) {
        let rotated = shape.map(row => [...row]);
        
        for (let i = 0; i < times % 4; i++) {
            const rows = rotated.length;
            const cols = rotated[0].length;
            const newShape = [];
            
            for (let col = 0; col < cols; col++) {
                const newRow = [];
                for (let row = rows - 1; row >= 0; row--) {
                    newRow.push(rotated[row][col]);
                }
                newShape.push(newRow);
            }
            rotated = newShape;
        }
        
        return rotated;
    }
    
    /**
     * 落下位置計算
     */
    findDropPosition(grid, shape, x) {
        for (let y = 0; y <= GRID_HEIGHT - shape.length; y++) {
            if (!this.canPlaceShape(grid, shape, x, y)) {
                return Math.max(0, y - 1);
            }
        }
        return GRID_HEIGHT - shape.length;
    }
    
    /**
     * 配置可能チェック
     */
    canPlaceShape(grid, shape, x, y) {
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const boardX = x + dx;
                    const boardY = y + dy;
                    
                    if (boardX < 0 || boardX >= GRID_WIDTH || boardY >= GRID_HEIGHT) {
                        return false;
                    }
                    
                    if (boardY >= 0 && grid[boardY][boardX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * グリッドにピース配置
     */
    placePieceOnGrid(grid, shape, x, y) {
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const boardX = x + dx;
                    const boardY = y + dy;
                    
                    if (boardY >= 0 && boardY < GRID_HEIGHT && 
                        boardX >= 0 && boardX < GRID_WIDTH) {
                        grid[boardY][boardX] = 1;
                    }
                }
            }
        }
    }
    
    /**
     * グリッド評価
     */
    evaluateGrid(grid, params) {
        const height = this.getMaxHeight(grid);
        const lines = this.countCompleteLines(grid);
        const holes = this.countHoles(grid);
        const bumpiness = this.getBumpiness(grid);
        
        return (
            params.heightWeight * height +
            params.linesWeight * lines +
            params.holesWeight * holes +
            params.bumpinessWeight * bumpiness
        );
    }
    
    /**
     * 最大高さ取得
     */
    getMaxHeight(grid) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x]) {
                    return GRID_HEIGHT - y;
                }
            }
        }
        return 0;
    }
    
    /**
     * 完成ライン数カウント
     */
    countCompleteLines(grid) {
        let lines = 0;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            if (grid[y].every(cell => cell !== 0)) {
                lines++;
            }
        }
        return lines;
    }
    
    /**
     * 穴の数カウント
     */
    countHoles(grid) {
        let holes = 0;
        
        for (let x = 0; x < GRID_WIDTH; x++) {
            let blockFound = false;
            for (let y = 0; y < GRID_HEIGHT; y++) {
                if (grid[y][x]) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        
        return holes;
    }
    
    /**
     * 凸凹度計算
     */
    getBumpiness(grid) {
        const heights = [];
        
        for (let x = 0; x < GRID_WIDTH; x++) {
            let height = 0;
            for (let y = 0; y < GRID_HEIGHT; y++) {
                if (grid[y][x]) {
                    height = GRID_HEIGHT - y;
                    break;
                }
            }
            heights.push(height);
        }
        
        let bumpiness = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        
        return bumpiness;
    }
    
    /**
     * グリッドクローン
     */
    cloneGrid(grid) {
        return grid.map(row => [...row]);
    }
}

// グローバルAIエンジンインスタンス
window.aiEngine = new AIEngine();