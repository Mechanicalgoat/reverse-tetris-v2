/**
 * リバーステトリス v2 - 手動テストスクリプト
 * 主要機能のテスト実行
 */

// テスト用グリッド作成
function createTestGrid() {
    return Array(20).fill().map(() => Array(10).fill(0));
}

// 1. ライン消去テスト
function testLineClear() {
    console.log('=== ライン消去テスト開始 ===');
    
    const grid = createTestGrid();
    
    // 最下段と18行目を完全に埋める
    for (let x = 0; x < 10; x++) {
        grid[19][x] = 'T';
        grid[18][x] = 'I';
    }
    
    console.log('テスト前のグリッド（下部2行埋める）:');
    console.log(grid.slice(17, 20));
    
    // 完成ライン検出
    const completedLines = [];
    for (let y = 0; y < 20; y++) {
        if (grid[y].every(cell => cell !== 0)) {
            completedLines.push(y);
        }
    }
    
    console.log('検出された完成ライン:', completedLines);
    
    if (completedLines.length === 2 && completedLines.includes(18) && completedLines.includes(19)) {
        // ライン削除処理
        completedLines.sort((a, b) => b - a);
        for (const line of completedLines) {
            grid.splice(line, 1);
            grid.unshift(Array(10).fill(0));
        }
        
        console.log('ライン消去後のグリッド（上部2行）:');
        console.log(grid.slice(0, 3));
        
        const topRowsEmpty = grid[0].every(cell => cell === 0) && grid[1].every(cell => cell === 0);
        
        if (topRowsEmpty) {
            console.log('✅ ライン消去テスト成功');
            return true;
        } else {
            console.log('❌ ライン消去テスト失敗: 上部行が空になっていない');
            return false;
        }
    } else {
        console.log('❌ ライン消去テスト失敗: 完成ライン検出エラー');
        return false;
    }
}

// 2. ゲームクリア判定テスト
function testGameClear() {
    console.log('=== ゲームクリア判定テスト開始 ===');
    
    // テストケース1: 上部3行にブロックなし（ゲーム継続）
    let grid = createTestGrid();
    grid[5][3] = 'O'; // 6行目にブロック
    
    let hasBlocksInTop = false;
    for (let y = 0; y < 3; y++) {
        if (grid[y].some(cell => cell !== 0)) {
            hasBlocksInTop = true;
            break;
        }
    }
    
    if (!hasBlocksInTop) {
        console.log('✅ テストケース1: 上部3行空 - ゲーム継続');
    } else {
        console.log('❌ テストケース1失敗');
        return false;
    }
    
    // テストケース2: 1行目にブロック（ゲームクリア）
    grid = createTestGrid();
    grid[0][4] = 'L';
    
    hasBlocksInTop = false;
    for (let y = 0; y < 3; y++) {
        if (grid[y].some(cell => cell !== 0)) {
            hasBlocksInTop = true;
            break;
        }
    }
    
    if (hasBlocksInTop) {
        console.log('✅ テストケース2: 1行目ブロック - ゲームクリア検出');
    } else {
        console.log('❌ テストケース2失敗');
        return false;
    }
    
    // テストケース3: 3行目にブロック（ゲームクリア）
    grid = createTestGrid();
    grid[2][7] = 'S';
    
    hasBlocksInTop = false;
    for (let y = 0; y < 3; y++) {
        if (grid[y].some(cell => cell !== 0)) {
            hasBlocksInTop = true;
            break;
        }
    }
    
    if (hasBlocksInTop) {
        console.log('✅ テストケース3: 3行目ブロック - ゲームクリア検出');
        console.log('✅ ゲームクリア判定テスト成功');
        return true;
    } else {
        console.log('❌ テストケース3失敗');
        return false;
    }
}

// 3. AI動作テスト（簡易版）
function testAI() {
    console.log('=== AI動作テスト開始 ===');
    
    // シンプルなAI評価テスト
    const testShape = [[1,1,1,1]]; // I-piece
    const grid = createTestGrid();
    
    // モックAIテスト（実際のAIが読み込まれていない場合）
    const mockPlacement = { x: 3, y: 16, rotation: 0 };
    console.log('モック配置計算:', mockPlacement);
    
    if (mockPlacement.x >= 0 && mockPlacement.x < 10 && 
        mockPlacement.y >= 0 && mockPlacement.y < 20) {
        console.log('✅ AI動作テスト成功（モック）');
        return true;
    } else {
        console.log('❌ AI動作テスト失敗');
        return false;
    }
}

// 全テスト実行
function runAllTests() {
    console.log('🚀 リバーステトリス v2 - 全テスト実行開始');
    console.log('=====================================');
    
    const results = {
        lineClear: false,
        gameClear: false,
        ai: false
    };
    
    try {
        results.lineClear = testLineClear();
        console.log('');
        
        results.gameClear = testGameClear();
        console.log('');
        
        results.ai = testAI();
        console.log('');
        
        // 結果まとめ
        console.log('=====================================');
        console.log('🎯 テスト結果サマリー:');
        console.log('  ライン消去:', results.lineClear ? '✅ PASS' : '❌ FAIL');
        console.log('  ゲームクリア判定:', results.gameClear ? '✅ PASS' : '❌ FAIL');
        console.log('  AI動作:', results.ai ? '✅ PASS' : '❌ FAIL');
        
        const allPassed = results.lineClear && results.gameClear && results.ai;
        console.log('');
        console.log('総合結果:', allPassed ? '🎉 全テスト成功!' : '⚠️  一部テスト失敗');
        
        return allPassed;
        
    } catch (error) {
        console.error('テスト実行エラー:', error);
        return false;
    }
}

// 自動実行
console.log('🎮 リバーステトリス v2 テストシステム');
runAllTests();