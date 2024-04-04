import './App.css';
import arrow from './images/arrow.svg'
import lodash from 'lodash';
import {produce} from 'immer'
import {Block} from "./teris";
import {useCallback, useEffect, useRef, useState} from "react";

class Falling {
    constructor({arr, kind, cells}) {
        this.status = 'fall';
        this.kind = kind;
        this.rotation = 0;
        const [row0, column0, row1, column1, row2, column2, row3, column3] = arr;
        this.ele0 = {row: row0, column: column0};
        this.ele1 = {row: row1, column: column1};
        this.ele2 = {row: row2, column: column2};
        this.ele3 = {row: row3, column: column3};
        this.keys = ['ele0', 'ele1', 'ele2', 'ele3'];
        this.cells = cells;
        this.startCheckCollision(cells);
    }
    log() {
        console.log(this);
    }
    copyEle(copy) {
        for (let key in this) {
            if (key.startsWith('ele')) {
                this[key].row = copy[key].row;
                this[key].column = copy[key].column;
            }
        }
    }
    async fall(height) {
        if (this.status === 'fall') {
            for (let key of this.keys) {
                if (this[key].row + height < 20) {
                    this[key].row += height;
                }
            }
        }
    }
    async apply(updateCells) {
        updateCells(this.ele0.row, this.ele0.column, true);
        updateCells(this.ele1.row, this.ele1.column, true);
        updateCells(this.ele2.row, this.ele2.column, true);
        updateCells(this.ele3.row, this.ele3.column, true);
        return Promise.resolve('applied!');
    }
    async remove(updateCells) {
        updateCells(this.ele0.row, this.ele0.column, false);
        updateCells(this.ele1.row, this.ele1.column, false);
        updateCells(this.ele2.row, this.ele2.column, false);
        updateCells(this.ele3.row, this.ele3.column, false);
    }
    async advancedFall(height, updateCells) {
        if (this.status === 'fall') {
            await this.remove(updateCells);
            await this.fall(height, this.cells);
            await this.apply(updateCells);
        }
    }
    async fallDown(updateCells) {
        if (this.status === 'fall') {
            this.status = 'static';
            let rows = [];
            let cols = [];
            for (let key of this.keys) {
                if (!cols.includes(this[key].column)) {
                    cols.push(this[key].column);
                    rows.push(this[key].row);
                }
                else {
                    rows[cols.indexOf(this[key].column)] = Math.max(rows[cols.indexOf(this[key].column)], this[key].row);
                }
            }
            if (rows.length !== cols.length) {
                throw new Error('length of rows doesn\'t match that of cols');
            }
            console.log('row col', rows, cols);
            const maxRow = Math.max(...rows);
            let addition = 1;
            let endMark = false;
            while (maxRow + addition < 20) {
                for (let i = 0; i < rows.length; i++) {
                    if (this.cells[rows[i] + addition][cols[i]]) {
                        endMark = true;
                        break;
                    }
                }
                if (endMark) break;
                addition++;
            }
            addition--;
            console.log(addition);
            await this.remove(updateCells);
            this.ele0.row += addition;
            this.ele1.row += addition;
            this.ele2.row += addition;
            this.ele3.row += addition;
            await this.apply(updateCells);
        }
    }
    async checkCollision() {
        if (this.status === 'static') {
            this.stopCheckCollision();
            return true;
        }
        if (this.ele0.row === 19 || this.ele1.row === 19 || this.ele2.row === 19 || this.ele3.row === 19) {
            this.status = 'static';
            return true;
        }
        let rows = [this.ele0.row];
        let cols = [this.ele0.column];
        for (let key of this.keys) {
            if (cols.includes(this[key].column)) {
                const index = cols.indexOf(this[key].column);
                rows[index] = Math.max(rows[index], this[key].row);
            }
            else {
                rows.push(this[key].row);
                cols.push(this[key].column);
            }
        }
        if (rows.length === cols.length) {
            for (let i = 0; i < rows.length; i++) {
                if (this.cells[rows[i] + 1][cols[i]]) {
                    this.status = 'static';
                    return true;
                }
            }
        }
        else throw new Error('length of rows doesn\'t match that of cols');
        return false;
    }
    startCheckCollision() {
        this.checkCollisionInterval = setInterval(async() => {
            await this.checkCollision(this.cells);
        }, 100);
    }
    stopCheckCollision() {
        if (this.checkCollisionInterval) {
            clearInterval(this.checkCollisionInterval);
            this.checkCollisionInterval = null;
        }
    }
    static checkShift(cells, before, after) {
        for (let ele of after) {
            // 检查新位置是否超出游戏区域边界
            if (ele.row < 0 || ele.row >= 20 || ele.column < 0 || ele.column >= 10) {
                return false;
            }
            // 检查新位置是否与其他方块重叠
            if (cells[ele.row][ele.column]) {
                let next = false;
                for (let i = 0; i < before.length; i++) {
                    if (before[i].row === ele.row && before[i].column === ele.column) {
                        next = true;
                        break;
                    }
                }
                if (next) continue;
                return false;
            }
        }
        return true;
    }
    checkRotation() {
        const row = this.ele1.row;
        const column = this.ele1.column;
        if (this.kind === 1) {
            if (this.rotation === 0) {
                if (row - 1 >= 0 && row + 2 < 20) {//越界检查
                    return !(this.cells[row - 1][column - 1] || this.cells[row - 1][column]
                        || this.cells[row + 1][column] || this.cells[row + 1][column + 1] || this.cells[row + 1][column + 2]
                        || this.cells[row + 2][column] || this.cells[row + 2][column + 1] || this.cells[row + 2][column + 2]
                    );
                }
                else return false;
            }
            else if (this.rotation === 90) {
                if (column + 1 < 10 && column - 2 >= 0) {
                    return !(this.cells[row - 1][column + 1] || this.cells[row][column + 1]
                        || this.cells[row][column - 2] || this.cells[row + 1][column - 2] || this.cells[row + 2][column - 2]
                        || this.cells[row][column - 1] || this.cells[row + 1][column - 1] || this.cells[row + 1][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 180) {
                if (row - 2 >= 0 && row + 1 < 20) {
                    return !(this.cells[row + 1][column] || this.cells[row + 1][column + 1]
                        || this.cells[row - 1][column - 2] || this.cells[row - 1][column - 1] || this.cells[row - 1][column]
                        || this.cells[row - 2][column - 2] || this.cells[row - 2][column - 1] || this.cells[row - 2][column]
                    );
                }
                else return false;
            }
            else if (this.rotation === 270) {
                if (column + 2 < 10 && column - 1 >= 0) {
                    return !(this.cells[row + 1][column - 1] || this.cells[row][column - 1]
                        || this.cells[row - 2][column + 1] || this.cells[row - 1][column + 1] || this.cells[row][column + 1]
                        || this.cells[row - 2][column + 2] || this.cells[row - 2][column + 2] || this.cells[row - 2][column + 2]
                    );
                }
                else return false;
            }
            else throw new Error('invalid rotation value!');
        }
        else if (this.kind === 2) {
            return false;
        }
        else if (this.kind === 3) {
            if (this.rotation === 0) {
                if (row - 1 >= 0 && row + 2 < 20) {//越界检查
                    return !(this.cells[row - 1][column + 1]
                        || this.cells[row + 1][column] || this.cells[row + 1][column + 1] || this.cells[row + 1][column + 2]
                        || this.cells[row + 2][column] || this.cells[row + 2][column + 1] || this.cells[row + 2][column + 2]
                    );
                }
                else return false;
            }
            else if (this.rotation === 90) {
                if (column + 1 < 10 && column - 2 >= 0) {
                    return !(this.cells[row + 1][column + 1]
                        || this.cells[row][column - 2] || this.cells[row + 1][column - 2] || this.cells[row + 2][column - 2]
                        || this.cells[row][column - 1] || this.cells[row + 1][column - 1] || this.cells[row + 1][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 180) {
                if (row - 2 >= 0 && row + 1 < 20) {
                    return !(this.cells[row + 1][column - 1]
                        || this.cells[row - 1][column - 2] || this.cells[row - 1][column - 1] || this.cells[row - 1][column]
                        || this.cells[row - 2][column - 2] || this.cells[row - 2][column - 1] || this.cells[row - 2][column]
                    );
                }
                else return false;
            }
            else if (this.rotation === 270) {
                if (column + 2 < 10 && column - 1 >= 0) {
                    return !(this.cells[row - 1][column - 1]
                        || this.cells[row - 2][column + 1] || this.cells[row - 1][column + 1] || this.cells[row][column + 1]
                        || this.cells[row - 2][column + 2] || this.cells[row - 2][column + 2] || this.cells[row - 2][column + 2]
                    );
                }
                else return false;
            }
            else throw new Error('invalid rotation value!');
        }
    }

    async rotate(updateCells) {
        if (this.status === 'fall') {
            this.status = 'rotate';
            let copy = lodash.cloneDeep(this);
            if (this.kind === 1) {//kind=1  长条形，绕着ele1旋转
                if (this.rotation === 0) {
                    copy.ele0.row--;
                    copy.ele0.column++;
                    copy.ele2.row++;
                    copy.ele2.column--;
                    copy.ele3.row += 2;
                    copy.ele3.column -= 2;
                } else if (this.rotation === 90) {
                    copy.ele0.row++;
                    copy.ele0.column++;
                    copy.ele2.row--;
                    copy.ele2.column--;
                    copy.ele3.row -= 2;
                    copy.ele3.column -= 2;
                } else if (this.rotation === 180) {
                    copy.ele0.row++;
                    copy.ele0.column--;
                    copy.ele2.row--;
                    copy.ele2.column++;
                    copy.ele3.row -= 2;
                    copy.ele3.column += 2;
                } else if (this.rotation === 270) {
                    copy.ele0.row--;
                    copy.ele0.column--;
                    copy.ele2.row++;
                    copy.ele2.column++;
                    copy.ele3.row += 2;
                    copy.ele3.column += 2;
                } else {
                    throw new Error('invalid rotation value!');
                }
            }
            else if (this.kind === 2) {
                //这类的方块是不可旋转的
            }
            else if (this.kind === 3) {//kind=3
                if (this.rotation === 0) {
                    copy.ele0.row++;
                    copy.ele0.column++;
                    copy.ele2.row++;
                    copy.ele2.column--;
                    copy.ele3.row += 2;
                    copy.ele3.column -= 2;
                } else if (this.rotation === 90) {
                    copy.ele0.row++;
                    copy.ele0.column--;
                    copy.ele2.row--;
                    copy.ele2.column--;
                    copy.ele3.row -= 2;
                    copy.ele3.column -= 2;
                } else if (this.rotation === 180) {
                    copy.ele0.row--;
                    copy.ele0.column--;
                    copy.ele2.row--;
                    copy.ele2.column++;
                    copy.ele3.row -= 2;
                    copy.ele3.column += 2;
                } else if (this.rotation === 270) {
                    copy.ele0.row--;
                    copy.ele0.column++;
                    copy.ele2.row++;
                    copy.ele2.column++;
                    copy.ele3.row += 2;
                    copy.ele3.column += 2;
                } else {
                    throw new Error('invalid rotation value!');
                }
            }
            const check = await this.checkRotation(this.cells);
            console.log('check', check)
            if (check) {
                console.log('change')
                await this.remove(updateCells);
                this.copyEle(copy);
                this.rotation = (this.rotation + 90) % 360;
                await this.apply(updateCells);
            }
            this.status = 'fall';
        }
    }
    async shift(direction, size, updateCells) {
        if (this.status === 'fall' && typeof size === 'number') {
            this.status = 'shift';
            const addition = direction === 'right' ? size : -size;
            const before = [
                { row: this.ele0.row, column: this.ele0.column },
                { row: this.ele1.row, column: this.ele1.column },
                { row: this.ele2.row, column: this.ele2.column },
                { row: this.ele3.row, column: this.ele3.column },
            ];
            const after = [
                { row: this.ele0.row, column: this.ele0.column + addition },
                { row: this.ele1.row, column: this.ele1.column + addition },
                { row: this.ele2.row, column: this.ele2.column + addition },
                { row: this.ele3.row, column: this.ele3.column + addition },
            ];
            const valid = await Falling.checkShift(this.cells, before, after);
            if (valid) {
                await this.remove(updateCells);
                this.ele0.column += addition;
                this.ele1.column += addition;
                this.ele2.column += addition;
                this.ele3.column += addition;
                await this.apply(updateCells);
                this.status = 'fall';
                return true;
            } else {
                this.status = 'fall';
                return false;
            }
        }
    }
}

const initialFalling = (cells) => {
    const randomKind = Math.floor(Math.random() * 3 + 1);
    if (randomKind === 1) {
        const randomStartColumn = Math.floor(Math.random() * 7);
        return {//1行，4个方块
            arr: [0, randomStartColumn, 0, randomStartColumn + 1, 0, randomStartColumn + 2, 0, randomStartColumn + 3],
            kind: 1,
            cells: cells
        };
    }
    else if (randomKind === 2) {
        const randomStartColumn = Math.floor(Math.random() * 9);
        return {//2行，每行2个方块的正方形
            arr: [0, randomStartColumn, 0, randomStartColumn + 1, 1, randomStartColumn, 1, randomStartColumn + 1],
            kind: 2,
            cells: cells
        };
    }
    else if (randomKind === 3) {
        const randomStartColumn = Math.floor(Math.random() * 8);
        return {//2行，一行1个方块，二行3个方块，一行方块在左端
            arr: [0, randomStartColumn, 1, randomStartColumn, 1, randomStartColumn + 1, 1, randomStartColumn + 2],
            kind: 3,
            cells: cells
        }
    }
    else throw new Error('invalid randomKind');
}

//游戏基本设计：20 * 10 的方格， 每次刷新方块掉落一格
function App() {
    const [cells, setCells] = useState(Array(20).fill(false).map(() => Array(10).fill(false)));
    const [playerScore, setPlayerScore] = useState(0);
    const cellsRef = useRef(cells);
    const fallingRef = useRef(null);
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    //useEffect1: 生成新的掉落方块，已经在generateNewBlock函数中防止重新生成
    useEffect(() => {
        if (fallingRef.current === null)
        setTimeout(() => generateNewBlock(), 1000);
    }, [fallingRef.current]);
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
        // setCells(prevCells =>
        //     prevCells.map((rowCells, currentRow) =>
        //         rowCells.map((cell, currentColumn) => {
        //             return (row === currentRow && column === currentColumn) ? value : cell;
        //         }))
        // );
    }, []);

    const updateLineOfCells = (row, value) => {
        setCells(prevCells =>
            prevCells.map((rowCells, currentRow) => currentRow === row ?
            rowCells.map(() => value) : rowCells
            )
        );
    }

    const handleKeydown = (event) => {
        if (fallingRef.current && fallingRef.current.status === 'fall') {
            if (event.key === 'ArrowUp') {
                handleRotate();
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

    function generateNewBlock() {
        if (fallingRef.current) {
            // console.log('An instance has already been running');
            return;
        }
        console.log('generate an instance');
        fallingRef.current = new Falling(initialFalling(cellsRef.current));
        let falling = fallingRef.current;
        falling.apply(updateCells);
        const interval = setInterval(async () => {
            if (falling.status === 'static') {
                execCheckLines();
                fallingRef.current = null;
                clearInterval(interval);
            }
            console.log('status', falling.status);
            while (falling.status === 'rotate' || falling.status === 'shift') {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            await falling.remove(updateCells);
            await falling.fall(1, cellsRef.current);
            await falling.apply(updateCells);
        }, 1000);
    }

    const handleRotate = () => {
        if (fallingRef.current && fallingRef.current.status === 'fall') {
            fallingRef.current.rotate(updateCells);
        }
    }
    const handleLeft = () => {
        fallingRef.current.shift('left', 1, cellsRef.current, updateCells)
        console.log('validity', fallingRef.current && fallingRef.current.status === 'fall')
    };
    return (
        <div className={"mainBoard"}>
            <div className={"leftBar"}>
                <div className={"score"}>{`分数 ${playerScore}`}</div>
            </div>
            <div className={"rightBar"}>
                <div className={"arrowContainer"}>
                    <img src={arrow} alt={"left arrow"} className={"arrow"}
                         onClick={handleLeft}/>
                    <img src={arrow} alt={"up arrow"} className={"arrow"}
                         onClick={() => (fallingRef.current && fallingRef.current.status === 'fall') && handleRotate()}/>
                    <img src={arrow} alt={"right arrow"} className={"arrow"}
                         onClick={() => (fallingRef.current && fallingRef.current.status === 'fall') && fallingRef.current.shift('right', 1, cells, updateCells)}/>
                    <img src={arrow} alt={"down arrow"} className={"arrow"}
                         onClick={() => (fallingRef.current && fallingRef.current.status === 'fall') && fallingRef.current.fallDown(cellsRef.current, updateCells)}/>
                </div>
            </div>
            <div className="gameBoard">
                {cells.map((rowCells, row) =>
                    <div className={'line'} id={`line${row}`}>
                        {rowCells.map((cell, column) =>
                            cell && <Block key={`${row * 10 + column} Block`} top={0.05 * row * windowHeight} left={0.025 * column * windowWidth}></Block>)
                        }
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
