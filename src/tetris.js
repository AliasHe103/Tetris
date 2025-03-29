import lodash from "lodash";
export class Falling {
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
                        || this.cells[row][column - 1] || this.cells[row + 1][column - 1] || this.cells[row + 2][column - 1]
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
                        || this.cells[row - 2][column + 2] || this.cells[row - 1][column + 2] || this.cells[row][column + 2]
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
                if (row - 1 >= 0 && row + 2 < 20) {
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
                        || this.cells[row][column - 1] || this.cells[row + 1][column - 1] || this.cells[row + 2][column - 1]
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
                        || this.cells[row - 2][column + 2] || this.cells[row - 1][column + 2] || this.cells[row][column + 2]
                    );
                }
                else return false;
            }
            else throw new Error('invalid rotation value!');
        }
        else if (this.kind === 4) {
            if (this.rotation === 0) {
                if (row - 1 >= 0) {//越界检查
                    return !(this.cells[row + 1][column + 1] || this.cells[row + 1][column - 1]
                        || this.cells[row - 1][column] || this.cells[row - 1][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 90) {
                if (column + 1 < 10) {
                    return !(this.cells[row - 1][column + 1] || this.cells[row - 1][column - 1]
                        || this.cells[row][column + 2] || this.cells[row + 1][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 180) {
                if (row + 1 < 20) {
                    return !(this.cells[row - 1][column - 1] || this.cells[row - 1][column + 1]
                        || this.cells[row + 1][column] || this.cells[row + 1][column + 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 270) {
                if (column - 1 >= 0) {
                    return !(this.cells[row][column - 1] || this.cells[row + 1][column - 1]
                        || this.cells[row - 1][column + 1] || this.cells[row + 1][column + 1]
                    );
                }
                else return false;
            }
            else throw new Error('invalid rotation value!');
        }
        else if (this.kind === 5) {
            if (this.rotation === 0) {
                if (column - 1 >= 0 && row + 2 < 20) {
                    return !(this.cells[row][column - 1]
                        || this.cells[row + 1][column - 1] || this.cells[row + 1][column + 1] || this.cells[row + 1][column + 2]
                        || this.cells[row + 2][column] || this.cells[row + 2][column + 1] || this.cells[row + 2][column + 2]
                    );
                }
                else return false;
            }
            else if (this.rotation === 90) {
                if (row - 1 >= 0 && column - 2 >= 0) {
                    return !(this.cells[row - 1][column]
                        || this.cells[row][column - 2] || this.cells[row + 1][column - 2] || this.cells[row + 2][column - 2]
                        || this.cells[row - 1][column - 1] || this.cells[row + 1][column - 1] || this.cells[row + 2][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 180) {
                if (row - 2 >= 0 && column + 1 < 10) {
                    return !(this.cells[row][column + 1]
                        || this.cells[row - 1][column - 2] || this.cells[row - 1][column - 1] || this.cells[row - 1][column + 1]
                        || this.cells[row - 2][column - 2] || this.cells[row - 2][column - 1] || this.cells[row - 2][column]
                    );
                }
                else return false;
            }
            else if (this.rotation === 270) {
                if (column + 2 < 10 && row + 1 < 20) {
                    return !(this.cells[row + 1][column]
                        || this.cells[row - 2][column + 1] || this.cells[row - 1][column + 1] || this.cells[row + 1][column + 1]
                        || this.cells[row - 2][column + 2] || this.cells[row - 1][column + 2] || this.cells[row][column + 2]
                    );
                }
                else return false;
            }
            else throw new Error('invalid rotation value!');
        }
        else if (this.kind === 6) {
            if (this.rotation === 0) {
                if (row - 1 >= 0 && row + 2 < 20) {
                    return !(this.cells[row - 1][column - 1] || this.cells[row - 1][column]
                        || this.cells[row + 1][column - 1]
                        || this.cells[row + 2][column] || this.cells[row + 2][column + 1] || this.cells[row + 2][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 90) {
                if (column + 1 < 10 && column - 2 >= 0) {
                    return !(this.cells[row - 1][column + 1] || this.cells[row][column + 1]
                        || this.cells[row][column - 2] || this.cells[row + 1][column - 2] || this.cells[row - 1][column - 2]
                        || this.cells[row - 1][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 180) {
                if (row - 2 >= 0 && row + 1 < 20) {
                    return !(this.cells[row + 1][column + 1] || this.cells[row + 1][column]
                        || this.cells[row - 1][column + 1]
                        || this.cells[row - 2][column - 1] || this.cells[row - 2][column + 1] || this.cells[row - 2][column]
                    );
                }
                else return false;
            }
            else if (this.rotation === 270) {
                if (column + 2 < 10 && column - 1 >= 0) {
                    return !(this.cells[row + 1][column - 1] || this.cells[row][column - 1]
                        || this.cells[row + 1][column + 1]
                        || this.cells[row - 1][column + 2] || this.cells[row + 1][column + 2] || this.cells[row][column + 2]
                    );
                }
                else return false;
            }
            else throw new Error('invalid rotation value!');
        }
        else if (this.kind === 7) {
            if (this.rotation === 0) {
                if (row - 1 >= 0) {
                    return !(this.cells[row - 1][column - 1] || this.cells[row - 1][column]
                        || this.cells[row + 1][column + 1]
                        || this.cells[row][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 90) {
                if (column + 1 < 10) {
                    return !(this.cells[row - 1][column + 1] || this.cells[row][column + 1]
                        || this.cells[row - 1][column]
                        || this.cells[row + 1][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 180) {
                if (row + 1 < 20) {
                    return !(this.cells[row + 1][column + 1] || this.cells[row][column + 1]
                        || this.cells[row + 1][column]
                        || this.cells[row - 1][column - 1]
                    );
                }
                else return false;
            }
            else if (this.rotation === 270) {
                if (column - 1 >= 0) {
                    return !(this.cells[row + 1][column - 1] || this.cells[row][column - 1]
                        || this.cells[row - 1][column + 1]
                        || this.cells[row + 1][column]
                    );
                }
                else return false;
            }
            else throw new Error('invalid rotation value!');
        }
        else {
            throw new Error('invalid kind of Teris');
        }
    }

    async rotate(updateCells) {
        if (this.status === 'fall') {
            this.status = 'rotate';
            let copy = lodash.cloneDeep(this);
            if (this.kind === 1) {
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
                this.status = 'fall';
                return;
            }
            else if (this.kind === 3) {
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
            else if (this.kind === 4) {
                if (this.rotation === 0) {
                    copy.ele0.row--;
                    copy.ele0.column++;
                    copy.ele2.row++;
                    copy.ele2.column--;
                    copy.ele3.row--;
                    copy.ele3.column--;
                } else if (this.rotation === 90) {
                    copy.ele0.row++;
                    copy.ele0.column++;
                    copy.ele2.row--;
                    copy.ele2.column--;
                    copy.ele3.row--;
                    copy.ele3.column++;
                } else if (this.rotation === 180) {
                    copy.ele0.row++;
                    copy.ele0.column--;
                    copy.ele2.row--;
                    copy.ele2.column++;
                    copy.ele3.row++;
                    copy.ele3.column++;
                } else if (this.rotation === 270) {
                    copy.ele0.row--;
                    copy.ele0.column--;
                    copy.ele2.row++;
                    copy.ele2.column++;
                    copy.ele3.row++;
                    copy.ele3.column--;
                } else {
                    throw new Error('invalid rotation value!');
                }
            }
            else if (this.kind === 5) {
                if (this.rotation === 0) {
                    copy.ele0.row--;
                    copy.ele0.column--;
                    copy.ele2.row++;
                    copy.ele2.column--;
                    copy.ele3.row += 2;
                    copy.ele3.column -= 2;
                } else if (this.rotation === 90) {
                    copy.ele0.row--;
                    copy.ele0.column++;
                    copy.ele2.row--;
                    copy.ele2.column--;
                    copy.ele3.row -= 2;
                    copy.ele3.column -= 2;
                } else if (this.rotation === 180) {
                    copy.ele0.row++;
                    copy.ele0.column++;
                    copy.ele2.row--;
                    copy.ele2.column++;
                    copy.ele3.row -= 2;
                    copy.ele3.column += 2;
                } else if (this.rotation === 270) {
                    copy.ele0.row++;
                    copy.ele0.column--;
                    copy.ele2.row++;
                    copy.ele2.column++;
                    copy.ele3.row += 2;
                    copy.ele3.column += 2;
                } else {
                    throw new Error('invalid rotation value!');
                }
            }
            else if (this.kind === 6) {
                if (this.rotation === 0) {
                    copy.ele0.row--;
                    copy.ele0.column++;
                    copy.ele2.row--;
                    copy.ele2.column--;
                    copy.ele3.column -= 2;
                } else if (this.rotation === 90) {
                    copy.ele0.row++;
                    copy.ele0.column++;
                    copy.ele2.row--;
                    copy.ele2.column++;
                    copy.ele3.row -= 2;
                } else if (this.rotation === 180) {
                    copy.ele0.row++;
                    copy.ele0.column--;
                    copy.ele2.row++;
                    copy.ele2.column++;
                    copy.ele3.column += 2;
                } else if (this.rotation === 270) {
                    copy.ele0.row--;
                    copy.ele0.column--;
                    copy.ele2.row++;
                    copy.ele2.column--;
                    copy.ele3.row += 2;
                } else {
                    throw new Error('invalid rotation value!');
                }
            }
            else if (this.kind === 7) {
                if (this.rotation === 0) {
                    copy.ele0.row++;
                    copy.ele0.column--;
                    copy.ele2.row--;
                    copy.ele2.column--;
                    copy.ele3.row -= 2;
                } else if (this.rotation === 90) {
                    copy.ele0.row--;
                    copy.ele0.column--;
                    copy.ele2.row--;
                    copy.ele2.column++;
                    copy.ele3.column += 2;
                } else if (this.rotation === 180) {
                    copy.ele0.row--;
                    copy.ele0.column++;
                    copy.ele2.row++;
                    copy.ele2.column++;
                    copy.ele3.row += 2;
                } else if (this.rotation === 270) {
                    copy.ele0.row++;
                    copy.ele0.column++;
                    copy.ele2.row++;
                    copy.ele2.column--;
                    copy.ele3.column -= 2;
                } else {
                    throw new Error('invalid rotation value!');
                }
            }
            else throw new Error('invalid kind of Teris');
            const check = await this.checkRotation(this.cells);
            if (check) {
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
            const valid = Falling.checkShift(this.cells, before, after);
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

export const initialFalling = (cells) => {
    const randomKind = Math.floor(Math.random() * 7 + 1);
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
    else if (randomKind === 4) {
        const randomStartColumn = Math.floor(Math.random() * 8);
        return {//2行，一行1个方块，二行3个方块，一行方块在中间
            arr: [0, randomStartColumn, 0, randomStartColumn + 1, 0, randomStartColumn + 2, 1, randomStartColumn + 1],
            kind: 4,
            cells: cells
        }
    }
    else if (randomKind === 5) {
        const randomStartColumn = Math.floor(Math.random() * 8);
        return {//2行，一行1个方块，二行3个方块，一行方块在右端
            arr: [1, randomStartColumn, 0, randomStartColumn, 0, randomStartColumn + 1, 0, randomStartColumn + 2],
            kind: 5,
            cells: cells
        }
    }
    else if (randomKind === 6) {
        const randomStartColumn = Math.floor(Math.random() * 8);
        return {//2行，每行2个方块，一行边缘方块在左端
            arr: [0, randomStartColumn, 0, randomStartColumn + 1, 1, randomStartColumn + 1, 1, randomStartColumn + 2],
            kind: 6,
            cells: cells
        }
    }
    else if (randomKind === 7) {
        const randomStartColumn = Math.floor(Math.random() * 8);
        return {//2行，每行2个方块，一行边缘方块在左端
            arr: [0, randomStartColumn + 2, 0, randomStartColumn + 1, 1, randomStartColumn + 1, 1, randomStartColumn],
            kind: 7,
            cells: cells
        }
    }
    else throw new Error('invalid randomKind');
}

export function Block({top, left}) {
    return (
        <span className={"blockBorder"} style={{position: "absolute", top: `${top}px`, left: `${left}px`}}>
          <span className={"innerBlock"}>
          </span>
        </span>
    );
}

export const AuthorLink = () => {
    return (
        <div className={"authorLink"} style={{
            position: "fixed",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            width: "200px",
            height: "50px",
            right: "0",
            bottom: "0"
        }}>
            <div className={"hrefItem"}>
                <svg d="1712372709839" className="githubIcon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5301" width="200" height="200"><path d="M512 42.666667A464.64 464.64 0 0 0 42.666667 502.186667 460.373333 460.373333 0 0 0 363.52 938.666667c23.466667 4.266667 32-9.813333 32-22.186667v-78.08c-130.56 27.733333-158.293333-61.44-158.293333-61.44a122.026667 122.026667 0 0 0-52.053334-67.413333c-42.666667-28.16 3.413333-27.733333 3.413334-27.733334a98.56 98.56 0 0 1 71.68 47.36 101.12 101.12 0 0 0 136.533333 37.973334 99.413333 99.413333 0 0 1 29.866667-61.44c-104.106667-11.52-213.333333-50.773333-213.333334-226.986667a177.066667 177.066667 0 0 1 47.36-124.16 161.28 161.28 0 0 1 4.693334-121.173333s39.68-12.373333 128 46.933333a455.68 455.68 0 0 1 234.666666 0c89.6-59.306667 128-46.933333 128-46.933333a161.28 161.28 0 0 1 4.693334 121.173333A177.066667 177.066667 0 0 1 810.666667 477.866667c0 176.64-110.08 215.466667-213.333334 226.986666a106.666667 106.666667 0 0 1 32 85.333334v125.866666c0 14.933333 8.533333 26.88 32 22.186667A460.8 460.8 0 0 0 981.333333 502.186667 464.64 464.64 0 0 0 512 42.666667" fill="#231F20" p-id="5302"></path></svg>
                <a href={"https://github.com/AliasHe103"} >made by @AliasHe103</a>
            </div>
        </div>
    );
}