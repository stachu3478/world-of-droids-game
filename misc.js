module.exports = class Misc {

    constructor(chunksClass) {
        var chunks = chunksClass;

        this.dist = function (x12, y12) {
            return Math.sqrt(x12 * x12 + y12 * y12);
        };
        this.pathTo = function (x1, y1, x2, y2) {
            if(!(x1 && y1))return false;
            if (chunks.getBlock(x2, y2).i === 0 && (Math.abs(x1 - x2) < 2) && Math.abs(y1 - y2) < 2 && Math.abs(x1 - x2 + y1 - y2) < 2) return [x2, y2];
            var pm = new Array(128);
            for (var i = 0; i < 128; i++) {
                pm[i] = new Int8Array(128);
            }
            var done = false;
            var arr = [x1, y1];
            pm[x1][y1] = 1;
            for (var step = 2; (step < 100) && (done === false); step++) {
                var arr1 = [];
                var failed = true;
                for (var i = 0; i < arr.length; i += 2) {
                    var x = arr[i];
                    var y = arr[i + 1];
                    var d1 = x + 1;
                    var d2 = x - 1;
                    var d3 = y + 1;
                    var d4 = y - 1;
                    var c1 = d1 >= 0 && d1 < 128;
                    var c2 = d2 >= 0 && d2 < 128;
                    var c3 = d3 >= 0 && d3 < 128;
                    var c4 = d4 >= 0 && d4 < 128;
                    var b1 = chunks.getBlock(d1, y);
                    if (c1 && b1 && !b1.i && !b1.u && pm[d1][y] === 0) {
                        if (d1 === x2 && y === y2) {
                            done = true;
                            break;
                        } else {
                            arr1.push(d1, y);
                            pm[d1][y] = step;
                            failed = false;
                        }
                    }
                    var b2 = chunks.getBlock(d2, y);
                    if (c2 && b2 && !b2.i && !b2.u && pm[d2][y] === 0) {
                        if (d2 === x2 && y === y2) {
                            done = true;
                            break;
                        } else {
                            arr1.push(d2, y);
                            pm[d2][y] = step;
                            failed = false;
                        }
                    }
                    var b3 = chunks.getBlock(x, d3);
                    if (c3 && b3 && !b3.i && !b3.u && pm[x][d3] === 0) {
                        if (x === x2 && d3 === y2) {
                            done = true;
                            break;
                        } else {
                            arr1.push(x, d3);
                            pm[x][d3] = step;
                            failed = false;
                        }
                    }
                    var b4 = chunks.getBlock(x, d4);
                    if (c4 && b4 && !b4.i && !b4.u && pm[x][d4] === 0) {
                        if (x === x2 && d4 === y2) {
                            done = true;
                            break;
                        } else {
                            arr1.push(x, d4);
                            pm[x][d4] = step;
                            failed = false;
                        }
                    }
                }
                arr = arr1;
                if (failed) {return false;}
            }
            if(!done)return false;
            var px = x2;
            var py = y2;
            var path = [x2, y2];
            for (var l = 0; l < 101; l++) {
                var d1 = px + 1;
                var d2 = px - 1;
                var d3 = py + 1;
                var d4 = py - 1;
                var c1 = d1 >= 0 && d1 < 128;
                var c2 = d2 >= 0 && d2 < 128;
                var c3 = d3 >= 0 && d3 < 128;
                var c4 = d4 >= 0 && d4 < 128;
                var min = 101;
                var minx = px;
                var miny = py;
                if (c1 && (pm[d1][py] !== 0) && (pm[d1][py] < min)) {
                    min = pm[d1][py] + 0;
                    minx = d1;
                    miny = py;
                    pm[d1][py] = 127;
                }
                if (c2 && (pm[d2][py] !== 0) && (pm[d2][py] < min)) {
                    min = pm[d2][py] + 0;
                    minx = d2;
                    miny = py;
                    pm[d2][py] = 127;
                }
                if (c3 && (pm[px][d3] !== 0) && (pm[px][d3] < min)) {
                    min = pm[px][d3] + 0;
                    minx = px;
                    miny = d3;
                    pm[px][d3] = 127;
                }
                if (c4 && (pm[px][d4] !== 0) && (pm[px][d4] < min)) {
                    min = pm[px][d4] + 0;
                    minx = px;
                    miny = d4;
                    pm[px][d4] = 127;
                }
                if (min === 1) { // ended finding path
                    if (path.length === 2) {
                        return [x2, y2];
                    } else {
                        return path;
                    }
                }
                px = minx;
                py = miny;
                path.unshift(minx, miny);
            }
            return false;
        };

        var dirs = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
        ];

        function dir(d){
            return dirs[d % 4]
        }

        function isBlocked(x, y){
            var block = chunks.getBlock(x, y);
            return block.i || block.u
        }

        this.fastPath = function(x1, y1, x2, y2){
            if(!(x1 && y1))return false;
            if (chunks.getBlock(x2, y2).i === 0 && (Math.abs(x1 - x2) < 2) && Math.abs(y1 - y2) < 2 && Math.abs(x1 - x2 + y1 - y2) < 2) return [x2, y2];
            var done = false;
            var arr = [
                0, 0, 0, 0,
                x1, y1, 64,
                x1, y1, 65,
                x1, y1, 66,
                x1, y1, 67,
            ];
            var js = [
                3, 3, 3, 3, 3,
            ];
            var seqs = [
                [],
                [],
                [],
                [],
            ];
            for (var step = 2; (step < 100) && (done === false); step++) {
                var arr1 = [];
                var failed = true;
                for (var i = js[0]; i + 2 < arr.length; i += js[i / 3]) {
                    failed = false;
                    var x = arr[i];
                    var y = arr[i + 1];
                    var d = arr[i + 2];
                    var dr = dir(d);
                    var dx = x + dr[0];
                    var dy = y - dr[1];
                    if (!isBlocked(dx, dy)) {
                        arr[i] = dx;
                        arr[i + 1] = dy;
                        seqs[i / 3].push(dx, dy);
                        if (dx === x2 && dy === y2) {
                            done = true;
                            return seqs[i / 3];
                        }
                    }else{
                        var d1r = dir(d + 1);
                        var d2r = dir(d - 1);
                        var d1x = x + d1r[0];
                        var d1y = y - d1r[1];
                        var d2x = x + d2r[0];
                        var d2y = y - d2r[1];
                        var dt1 = isBlocked(d1x, d1y);
                        var dt2 = isBlocked(d2x, d2y);
                        switch(dt1 + dt2 * 2){
                            case 0: {
                                arr[i + 2] = d1r;
                                arr.push(x, y, d2r);
                                seqs.push(seqs[i / 3].slice(0));
                            }break;
                            case 1: {
                                arr[i + 2] = d2r;
                            }break;
                            case 2: {
                                arr[i + 2] = d1r;
                            }break;
                            case 3: {
                                js[i / 3 - 1] += 3; // bye bye
                                continue;
                            }
                        }
                        if(dt1 && dt2)js[i / 3] += 3;
                        continue;
                    }

                    if(dx === x2 || dy === y2){
                        arr.push(dx, dy, dr + 1);
                        arr.push(dx, dy, dr + 2);
                        arr.push(dx, dy, dr + 3);
                    }
                }
                if (failed) {return false;}
            }
            return false;
        };

        this.spec = [
            {
                canMove: true,
                canShot: true,
                canTarget: true,
                canMakeDroids: false,
                hp: 50,
                transformTime: 0,
                score: 1,
                obtainScore: 0,
            },
            {
                canMove: false,
                canShot: false,
                canTarget: false,
                canMakeDroids: true,
                hp: 200,
                transformTime: 8,
                score: 10,
                obtainScore: 20,
            },
            {
                canMove: false,
                canShot: true,
                canTarget: true,
                canMakeDroids: false,
                hp: 250,
                transformTime: 12,
                score: 20,
                obtainScore: 40,
            },
            {
                canMove: false,
                canShot: false,
                canTarget: false,
                canMakeDroids: false,
                hp: 200,
                transformTime: 16,
                score: 1,
                obtainScore: 1,
            },
            {
                canMove: false,
                canShot: false,
                canTarget: false,
                canMakeDroids: false,
                hp: 200,
                score: 1,
                obtainScore: 0,
            }
        ];

        this.cfg = {
            hp: 50,
            factoringTime: 80,
            buildingTime: 4,
        };

        this.maze = [
            [0, -1],
            [1, -1],
            [1, 0],
            [1, 1],
            [0, 1],
            [-1, 1],
            [-1, 0],
            [-1, -1],
        ];

        var rowMan = [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [0, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
        ];
        var patterns = [
            [
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ],
            [
                0, 1, 0,
                1, 1, 1,
                0, 1, 0,
            ],
            [
                1, 0, 1,
                0, 1, 0,
                1, 0, 1,
            ],
            [
                0, 0, 0,
                0, 1, 0,
                0, 0, 0,
            ],
        ];
        this.canForm = function(x, y, type){
            for(var i = 0; i < 9; i++){
                var bi = chunks.getBlock(x + rowMan[i][0], y + rowMan[i][1]).i;
                if(bi && patterns[type][i])return false
            }
            return true
        }
        this.checkPattern = function(x, y, type){
            for(var i = 0; i < 9; i++){
                var d = chunks.getBlock(x + rowMan[i][0], y + rowMan[i][1]).u;
                if(patterns[type][i] === 1 && !(d && d.type === 0)){
                    console.log(i + ' xd ' + (d && d.id));
                    return false
                }
            }
            return true
        };
        this.getToRemove = function(x, y, type){
            var xys = [];
            for(var i = 0; i < 9; i++){
                if(patterns[type][i] && i !== 4)xys.push(x + rowMan[i][0], y + rowMan[i][1])
            }
            return xys
        }
    }
};