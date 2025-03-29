import './App.css';
import arrow from './images/arrow.svg'
import {produce} from 'immer'
import {Block, Falling, initialFalling, AuthorLink} from "./tetris";
import {useCallback, useEffect, useRef, useState} from "react";
//Todo:检查游戏结束的逻辑
//游戏基本设计：20 * 10 的方格， 每次刷新方块掉落一格
function App() {
    const [cells, setCells] = useState(Array(20).fill(false).map(() => Array(10).fill(false)));
    const [playerScore, setPlayerScore] = useState(0);
    const [gameStart, setGameStart] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const cellsRef = useRef(cells);
    const fallingRef = useRef(null);
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    //useEffect1: 生成新的掉落方块，已经在generateNewBlock函数中防止重新生成
    useEffect(() => {
        if (fallingRef.current === null && !gameOver && gameStart) {
            setTimeout(() => generateNewBlock(), 1000);
        }
    }, [fallingRef.current, gameOver, gameStart]);
    //useEffect2: 实时维持cellsRef保存cells的最新状态，使相关调用正确运行
    useEffect(() => {
        cellsRef.current = cells;
    }, [cells]);
    //useEffect3: 在这里执行那些只需要执行一次的部分
    useEffect(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, []);

    const updateCells = useCallback((row, column, value) => {
        setCells((prevCells) =>
            produce(prevCells, (draft)=> {
                draft[row][column] = value;
            })
        );
    }, []);

    const handleKeydown = (event) => {
        if (fallingRef.current && fallingRef.current.status === 'fall') {
            if (event.key === 'ArrowUp') {
                fallingRef.current.rotate(updateCells);
            }
            else if (event.key === 'ArrowDown') {
                fallingRef.current.fallDown(updateCells);
            }
            else if (event.key === 'ArrowLeft') {
                fallingRef.current.shift('left', 1, updateCells);
            }
            else if (event.key === 'ArrowRight') {
                fallingRef.current.shift('right', 1, updateCells);
            }
        }
    }

    function checkLines(cells) {
        let lines = [];
        cells.forEach((row, index) => {
            const value = row.reduce((acc, cur) => (acc << 1) | !!cur, 0);
            if (value === (1 << 10) - 1) {
                lines.push(index);
            }
        });
        return {
            validity: lines.length > 0,
            lines: lines
        };
    }

    const execCheckLines = () => {
        const result = checkLines(cellsRef.current);
        if (result.validity) {
            result.lines.forEach(line => {
                const lineCells = document.getElementById(`line${line}`);
                lineCells.classList.add('clear');
                setTimeout(() => lineCells.classList.remove('clear'), 600);
            });
            setTimeout(() => {
                let updatedCells = cellsRef.current.map(row => [...row]);
                result.lines.forEach(line => {
                    updatedCells[line] = updatedCells[line].fill(false);
                });
                for (let row = 19; row >= 0; row--) {
                    let offset = 0;
                    for (let i = 0; i < result.lines.length; i++) {
                        if (row < result.lines[i]) {
                            offset++;
                        }
                    }
                    if (offset > 0) {
                        updatedCells[row + offset] = updatedCells[row];
                    }
                }
                setCells(updatedCells);
                setPlayerScore(playerScore + 100 * result.lines.length);
            }, 500);
        }
    }

    function execCheckGameOver() {
        const cells = cellsRef.current;
        const firstRow = cells[0];
        if (firstRow.some(cell => cell === true)) {
            setGameOver(true);
        }
    }

    function generateNewBlock() {
        if (fallingRef.current) {//An instance is already running or game is over
            return;
        }
        if (gameOver) {
            clearInterval(fallingRef.current.generator);
            fallingRef.current = null;
            return;
        }
        fallingRef.current = new Falling(initialFalling(cellsRef.current));
        let falling = fallingRef.current;
        falling.apply(updateCells);
        fallingRef.current.generator = setInterval(async () => {
            if (falling.status === 'static') {
                execCheckLines();
                execCheckGameOver();
                clearInterval(fallingRef.current.generator);
                fallingRef.current = null;
            }
            while (falling.status === 'rotate' || falling.status === 'shift') {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            await falling.remove(updateCells);
            await falling.fall(1, cellsRef.current);
            await falling.apply(updateCells);
        }, 1000);
    }

    const restartGame = () => {
        if (fallingRef.current && fallingRef.current.generator) {
            clearInterval(fallingRef.current.generator);
            fallingRef.current.remove(updateCells);
            fallingRef.current = null;
        }
        setGameOver(false);
        setCells(Array(20).fill(false).map(() => Array(10).fill(false)));
        setPlayerScore(0);
    }

    return (
        <div className={"mainBoard"}>
            <div className={"leftBar"}>
                <h1>Have fun with Teris!</h1>
                <div className={"score"}>{`分数 ${playerScore}`}</div>
            </div>
            <div className={"rightBar"}>
                <button className={'restartBtn btn1'} onClick={() => setGameStart(true)}>开始游戏</button>
                <button className={'restartBtn btn2'} onClick={restartGame}>重新开始</button>
                <div className={"arrowContainer"}>
                    <img src={arrow} alt={"left arrow"} className={"arrow"}
                         onClick={() => (fallingRef.current && fallingRef.current.status === 'fall') && fallingRef.current.shift('left', 1, updateCells)}/>
                    <img src={arrow} alt={"up arrow"} className={"arrow"}
                         onClick={() => (fallingRef.current && fallingRef.current.status === 'fall') && fallingRef.current.rotate(updateCells)}/>
                    <img src={arrow} alt={"right arrow"} className={"arrow"}
                         onClick={() => (fallingRef.current && fallingRef.current.status === 'fall') && fallingRef.current.shift('right', 1, updateCells)}/>
                    <img src={arrow} alt={"down arrow"} className={"arrow"}
                         onClick={() => (fallingRef.current && fallingRef.current.status === 'fall') && fallingRef.current.fallDown(updateCells)}/>
                </div>
            </div>
            <div className="gameBoard" style={{opacity: gameOver? 0.5: 1.0}}>
                {cells.map((rowCells, row) =>
                    <div className={'line'} id={`line${row}`}>
                        {rowCells.map((cell, column) =>
                            cell && <Block key={`${row * 10 + column} Block`} top={0.05 * row * windowHeight} left={0.025 * column * windowWidth}></Block>)
                        }
                    </div>
                )}
            </div>
            {gameOver && <div className={"gameOverText"}>游戏结束</div>}
            <AuthorLink/>
        </div>
    );
}

export default App;
