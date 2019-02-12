var can = document.getElementById("c");
var ctx = can.getContext("2d");

window.tiles = new function(){

    var bCols = ["",
        "rgb(255,0,0)",
        "rgb(224,32,0)",
        "rgb(192,64,0)",
        "rgb(160,96,0)",
        "rgb(128,128,0)",
        "rgb(96,160,32)",
        "rgb(64,192,64)",
        "rgb(32,224,96)",
    ];

    const droidTypes = 8;
    loading = 0;
    function incl(){
        if(++loading === 19){
            init();
            preinit();
        }
    }

    var pat1;
    var dImagesData = [];
    function init(){
        pat1 = ctx.createPattern(imgArray[0], 'repeat'); // background pattern 3x faster i hope
        for(var i = 0;i < dImages.length;i++){//convert images to imageData objects
            var img = dImages[i];
            ctx.clearRect(0,0,32,32);
            ctx.drawImage(img,0,0);
            dImagesData.push(ctx.getImageData(0,0,32,32));
        }
    }

    var imgArray = [];
    var dImages = [];
    for(var it = 1;it <= droidTypes;it++){ // import images
        dImages.push(new Image());
        var i = it - 1;
        dImages[i].src = "tiles/d" + it + "r.png";
        dImages[i].onload = incl;
    }

    for(var i = 1;i < 5;i++){
        var img = new Image();
        img.src = "tiles/" + i + ".bmp";
        img.onload = incl;
        imgArray.push(img);
    }

    for(var i = 1;i < 8;i++){
        var img = new Image();
        img.src = "tiles/explode" + i + ".png";
        img.onload = incl;
        imgArray.push(img);
    }

    for(var i = 1;i < 8;i++){
        var img = new Image();
        img.src = "tiles/button" + i + ".png";
        img.onload = incl;
        imgArray.push(img);
    }

    this.drawImg = function(i, x, y){
        return ctx.drawImage(imgArray[i], x, y);
    };

    function drawLaser(x, y, tx, ty, l){
        ctx.beginPath();
        ctx.strokeStyle = 'pink';
        ctx.lineWidth = 5;
        var ex = 0, ey = 0;
        var rx = tx - x, ry = ty - y;
        var lp = (10 - l) * 40;
        var d = dist(rx, ry);
        if(l > 5){
            ctx.moveTo(x - scrollX, y - scrollY);
            if(d > lp){
                ctx.lineTo(x + rx * lp / d - scrollX, y + ry * lp / d - scrollY);
            }else{
                ctx.lineTo(tx - scrollX, ty - scrollY);
                for(var i = 0; i < 5; i++){
                    ex += Math.random() * 4 - 2;
                    ey += Math.random() * 4 - 2;
                    ctx.lineTo(tx + ex - scrollX, ty + ey - scrollY);
                }
            }
        }else{
            var sp = (5 - l) * 40;
            if(d > sp){
                ctx.moveTo(x + rx * sp / d - scrollX, y + ry * sp / d - scrollY);
            }else{
                ctx.moveTo(tx - scrollX, ty - scrollY);
            }
            if(d > lp){
                ctx.lineTo(x + rx * lp / d - scrollX, y + ry * lp / d - scrollY);
            }else{
                ctx.lineTo(tx - scrollX, ty - scrollY);
                for(var i = 0; i < 5; i++){
                    ex += Math.random() * 4 - 2;
                    ey += Math.random() * 4 - 2;
                    ctx.lineTo(tx + ex - scrollX, ty + ey - scrollY);
                }
            }
        }
        ctx.stroke();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function dDroid(x,y,t,u){
        var tp1 = u.dir || 0;
        switch(u.type){
            case 1: tp1 = 4;break;
            case 2: tp1 = 5;break;
            case 3: tp1 = 6;break;
            case 4: tp1 = 7;break;
        }
        ctx.drawImage(teams[u.team].img[tp1],x,y);
        if(u.type === 4){
            ctx.fillStyle = '#2D2A';
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 16);
            ctx.lineTo(x + 16, y - 4);
            ctx.arc(x + 16, y + 16, 20, -Math.PI / 2, (1 - (u.tol / spec[u.metaMorph].transformTime)) * Math.PI * 2 - Math.PI / 2, false);
            ctx.fill();
        }
    }
    this.dDroid = dDroid;

    function hpBar(p,x,y){
        var sx = x + 30;
        var sy = y + 29;
        var loops = Math.ceil(p * 8) + 1;
        for(var i = 1;i < loops;i++){
            ctx.strokeStyle = bCols[i];
            ctx.beginPath();
            ctx.moveTo(sx - i,sy);
            ctx.lineTo(sx,sy);
            ctx.stroke();
            //ctx.strokeRect(sx - i,sy,i,0);
            sy -= 2;
        }
    }

    this.drawEntity = function() {
        switch (this.id) {
            case 0:
                drawLaser(this.x + 16, this.y + 16, this.tx + 16, this.ty + 16, this.lifetime);
                break;
            case 1:
                ctx.drawImage(imgArray[Math.ceil(10 - this.lifetime)], this.x - scrollX, this.y - scrollY);
                break; // explode - max lifetime : 8
        }
        if (this.lifetime-- <= 0) {
            delete entities[entities.indexOf(this)];
            entities = entities.filter(f);
        }
    };

    function prerenderTile(imgId, r, g, b){
        var img = dImagesData[imgId];
        var imgData = ctx.createImageData(32,32);
        var dat = img.data;
        for(var i = 0;i < imgData.data.length;i += 4){
            var base = (dat[i + 1] + dat[i + 2]) / 2;
            var m = dat[i] - base; //color strength xd
            imgData.data[i] = base + Math.round((m / 255) * r);
            imgData.data[i + 1] = base + Math.round((m / 255) * g);
            imgData.data[i + 2] = base + Math.round((m / 255) * b);
            imgData.data[i + 3] = Math.round(img.data[i + 3]);
        }
        ctx2.clearRect(0,0,32,32);
        ctx2.putImageData(imgData,0,0);
        var img2 = new Image();
        img2.src = cv2.toDataURL("image/png");
        return img2;
    }

    this.prepareDroidTiles = function(r, g, b){
        var arr = [];
        for(var j = 0;j < dImagesData.length;j++){
            arr.push(prerenderTile(j,r,g,b));
        }
        return arr;
    };

    this.drawTileMap = function(map, x, y, generateIfNotExists) {
        var oX = x % tileSize;
        var oY = y % tileSize;
        var sX = Math.floor(x / tileSize);
        var sY = Math.floor(y / tileSize);
        var eX = sX + Math.ceil(CW / tileSize);
        var eY = sY + Math.ceil(CH / tileSize);
        ctx.save(); // draw background pattern
        moveX = -((scrollX) % imgArray[0].naturalWidth);
        moveY = -((scrollY) % imgArray[0].naturalHeight);
        ctx.translate(moveX, moveY);
        ctx.fillStyle = pat1;
        ctx.fillRect(0, 0, CW + 32, CH + 32);
        ctx.restore();
        for (var i = sX, px = -oX; i <= eX; i++, px += tileSize) { //first loop for backdrop tiles
            for (var j = sY, py = -oY; j <= eY; j++ , py += tileSize) {
                if (map.exists(i, j)) {
                    var block = map.getBlock(i, j, generateIfNotExists);
                    if (block) {
                        var t = block.i;
                        if (t > 0) ctx.drawImage(imgArray[t] || imgArray[2], px, py);
                    } else {
                        ctx.drawImage(imgArray[2], px, py);
                    }
                } else {
                    //ctx.drawImage(imgArray[0],px,py);
                    ctx.fillStyle = '#0008';
                    ctx.fillRect(px, py, 33, 33);
                }
            }
        }
    };

    this.drawUnits = function(){
        for(var i in droids){//second one for droids
            var u = droids[i];
            if(u !== null){
                var px = u.x * tileSize - scrollX;
                var py = u.y * tileSize - scrollY;
                if((px > -32) && (px < (CW + 32)) && (py > -32) && (py < (CH + 32))){
                    var t = teams[u.team] || {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)};
                    var offsetX = 0;
                    var offsetY = 0;
                    if(u.moving){
                        var stamp = 1 - (((Date.now() - iStart) % 500) / 500);
                        if(stamp < u.maxOffset){
                            offsetX += (u.lastX - u.x) * stamp * tileSize;
                            offsetY += (u.lastY - u.y) * stamp * tileSize;
                            u.maxOffset = stamp;
                        };
                    };
                    if(isNaN(u.dir))u.dir = dirsbytype[(u.x - u.lastX) + "," + (u.y - u.lastY)] || 0;
                    dDroid(px + offsetX,py + offsetY,t,u);
                    //if(u.dmg){
                    //sfx[0].play();
                    u.dmg = false;
                    //};
                    if(selected.indexOf(u.id) > -1)hpBar((u.hp / spec[u.type].hp),px + offsetX,py + offsetY);
                }
            }
        }
    };
}();