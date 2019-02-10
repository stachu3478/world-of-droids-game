function dist(x12,y12){
    return Math.sqrt(x12 * x12 + y12 * y12);
};

function isPointInBox(bx, by, width, height, x, y){
    return x > bx && x < bx + width && y > by && y < by + height;
}

function pathTo(x1,y1,x2,y2){
    if(map.getBlock(x2, y2).i == 0 && (Math.abs(x1 - x2) < 2) && Math.abs(y1 - y2) < 2 && Math.abs(x1 - x2 + y1 - y2) < 2)return [x2,y2];
    var pm = new Array(128);
    for(var i = 0;i < 100;i++){
        pm[i] = new Int8Array(128);
        //for(var j = 0;j < y;j++){
        //	pm[i][j] = 0;
        //};
    };
    var done = false;
    var arr = [x1,y1];
    pm[x1][y1] = 1;
    for(var step = 2;(step < 100) && (done == false);step++){
        var arr1 = [];
        var failed = true;
        for(var i = 0;i < arr.length;i += 2){
            var x = arr[i];
            var y = arr[i + 1];
            var d1 = x + 1;
            var d2 = x - 1;
            var d3 = y + 1;
            var d4 = y - 1;
            var c1 = d1 >= 0 && d1 < 100;
            var c2 = d2 >= 0 && d2 < 100;
            var c3 = d3 >= 0 && d3 < 100;
            var c4 = d4 >= 0 && d4 < 100;
            var b1 = map.getBlock(d1, y);
            if(c1 && b1 && b1.i == 0 && !b1.u && pm[d1][y] == 0){
                if(d1 == x2 && y == y2){
                    done = true;
                    break;
                }else{
                    arr1.push(d1,y);
                    pm[d1][y] = step;
                    failed = false;
                };
            };
            var b2 = map.getBlock(d2, y);
            if(c2 && b2 && b2.i == 0 && !b2.u && pm[d2][y] == 0){
                if(d2 == x2 && y == y2){
                    done = true;
                    break;
                }else{
                    arr1.push(d2,y);
                    pm[d2][y] = step;
                    failed = false;
                };
            };
            var b3 = map.getBlock(x, d3);
            if(c3 && b3 && b3.i == 0 && !b3.u && pm[x][d3] == 0){
                if(x == x2 && d3 == y2){
                    done = true;
                    break;
                }else{
                    arr1.push(x,d3);
                    pm[x][d3] = step;
                    failed = false;
                };
            };
            var b4 = map.getBlock(x, d4);
            if(c4 && b4 && b4.i == 0 && !b4.u && pm[x][d4] == 0){
                if(x == x2 && d4 == y2){
                    done = true;
                    break;
                }else{
                    arr1.push(x,d4);
                    pm[x][d4] = step;
                    failed = false;
                };
            };
        };
        arr = arr1;
        if(failed)return false;
    };
    var px = x2;
    var py = y2;
    var path = [x2,y2];
    for(var l = 0;l < 101;l++){
        var d1 = px + 1;
        var d2 = px - 1;
        var d3 = py + 1;
        var d4 = py - 1;
        var c1 = d1 >= 0 && d1 < 100;
        var c2 = d2 >= 0 && d2 < 100;
        var c3 = d3 >= 0 && d3 < 100;
        var c4 = d4 >= 0 && d4 < 100;
        var min = 101;
        var minx = px;
        var miny = py;
        if(c1 && (pm[d1][py] !== 0) && (pm[d1][py] < min)){
            min = pm[d1][py] + 0;
            minx = d1;
            miny = py;
            pm[d1][py] = 127;
        };
        if(c2 && (pm[d2][py] !== 0) && (pm[d2][py] < min)){
            min = pm[d2][py] + 0;
            minx = d2;
            miny = py;
            pm[d2][py] = 127;
        };
        if(c3 && (pm[px][d3] !== 0) && (pm[px][d3] < min)){
            min = pm[px][d3] + 0;
            minx = px;
            miny = d3;
            pm[px][d3] = 127;
        };
        if(c4 && (pm[px][d4] !== 0) && (pm[px][d4] < min)){
            min = pm[px][d4] + 0;
            minx = px;
            miny = d4;
            pm[px][d4] = 127;
        }
        if(min === 1){ // ended finding path
            if(path.length === 2){
                return [x2,y2];
            }else{
                return path;
            }
        }
        px = minx;
        py = miny;
        path.unshift(minx,miny);
    }
    return false;
}

const spec = [
    {
        canMove: true,
        canShot: true,
        canTarget: true,
        canMakeDroids: false,
        hp: 50,
        transformTime: 0,
    },
    {
        canMove: false,
        canShot: false,
        canTarget: false,
        canMakeDroids: true,
        hp: 200,
        transformTime: 8,
    },
    {
        canMove: false,
        canShot: true,
        canTarget: true,
        canMakeDroids: false,
        hp: 250,
        transformTime: 12,
    },
    {
        canMove: false,
        canShot: false,
        canTarget: false,
        canMakeDroids: false,
        hp: 200,
        transformTime: 16,
    },
    {
        canMove: false,
        canShot: false,
        canTarget: false,
        canMakeDroids: false,
        hp: 200,
    }
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
var canForm = function(x, y, type){
    for(var i = 0; i < 9; i++){
        var bi = map.getBlock(x + rowMan[i][0], y + rowMan[i][1]).i;
        if(bi && patterns[type][i])return false
    }
    return true
};