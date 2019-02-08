window.interface = new function(){

    var dDroid = tiles.dDroid;

    function drawDroidCard(){
        if(droids[onDroid] !== undefined){
            var u = droids[onDroid];
            var usernameLength = ctx.measureText(teams[u.team].u).width;
            var windowWidth = (usernameLength > 92 ? usernameLength + 40 : 128)
            var xp = CW - windowWidth;
            var yp = 0;
            ctx.strokeRect(xp,yp,windowWidth,64);
            ctx.fillStyle = "#000B";
            ctx.fillRect(xp,yp,windowWidth,64);
            ctx.fillStyle = "black";
            ctx.fillRect(xp + 44,yp + 4,80,24);
            ctx.fillStyle = "lime";
            ctx.fillRect(xp + 45,yp + 5,78 * (u.hp / 50),22);
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            //ctx.font = "20px Arial";
            ctx.strokeStyle = "black";
            ctx.strokeText(u.hp + " / " + 50,xp + 84,yp + 21);
            ctx.fillText(u.hp + " / " + 50,xp + 84,yp + 21);
            ctx.textAlign = "left";
            ctx.fillStyle = "white";
            ctx.fillText((u.moving ? (u.target === false ? "Moving" : "Attacking") : "Idle"), xp + 36, yp + 46);
            ctx.fillText(teams[u.team].u,xp + 36,yp + 60);

            var t = teams[u.team] || {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)};
            dDroid(xp,yp,t,u);

            ctx.strokeStyle = "white";//square of droid selected
            ctx.strokeRect(u.x * tileSize - scrollX, u.y * tileSize - scrollY, 32, 32);
        };
    }

    function drawSelectedDroidCard(){
        if(droids[selected[0]] !== undefined){
            var xp = 0;
            var yp = 320;
            var u = droids[selected[0]];
            ctx.strokeRect(xp,yp,128,64);
            ctx.fillRect(xp,yp,128,64);
            ctx.fillStyle = "black";
            ctx.fillRect(xp + 44,yp + 4,80,24);
            ctx.fillStyle = "lime";
            ctx.fillRect(xp + 45,yp + 5,78 * (u.hp / 50),22);
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            //ctx.font = "20px Arial";
            ctx.strokeText(u.hp + " / " + 50,xp + 84,yp + 21);
            ctx.fillText(u.hp + " / " + 50,xp + 84,yp + 21);
            ctx.textAlign = "left";
            ctx.fillStyle = "black";
            ctx.fillText((u.moving ? (u.target === false ? "Moving" : "Attacking") : "Idle"),xp + 36,yp + 58);
        }else{
            ctx.strokeRect(0,324,40,1);
        };
    }

    function drawSelectedDroids(){
        ctx.fillStyle = "grey";
        ctx.strokeStyle = "lightGrey";
        ctx.strokeRect(0,0,41,320);
        ctx.fillRect(0,0,40,325);
        drawSelectedDroidCard();
        ctx.fillStyle = "grey";
        ctx.strokeStyle = "lightGrey";
        ctx.fillStyle = "green";
        for(var i = 0;i < selected.length;i++){
            var u = droids[selected[i]];
            if(u !== null && u !== undefined){
                var ypos = 320 - i * 32;
                var t = teams[u.team] || {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)};
                dDroid(0,ypos,t,u);
                u.dmg = false;
                ctx.fillRect(32, ypos + 32 - u.hp * 0.64,8,u.hp * 0.64);
            };
        };
        var interfacePos = selected.indexOf(onDroid);
        if(interfacePos !== -1){//interface droid frame
            ctx.strokeRect(0, 320 - interfacePos * 32, 32, 32);
        };
    }

    function drawMap(){
        if(mapEnabled){ //map drawing
            var x = CW - 300;
            var y = CH - 300;
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.strokeRect(x, y, 300, 300);
            ctx.fillRect(x, y, 300, 300);
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.strokeRect(x + 3 * (scrollX / tileSize), y + 3 * (scrollY / tileSize), 3 * CW / tileSize, 3 * CH / tileSize);
            ctx.fillRect(x + 3 * (scrollX / tileSize), y + 3 * (scrollY / tileSize), 3 * CW / tileSize, 3 * CH / tileSize);
            for(var i in droids){
                var u = droids[i];
                if(u !== null){
                    var t = teams[u.team] || {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)};
                    ctx.fillStyle = t.dcdec || "grey";
                    ctx.fillRect(x + u.x * 3,y + u.y * 3,3,3);
                };
            };
        };
    }

    function drawMarkingArea() {
        var txt = "";
        var tex = Math.floor(mx / tileSize);
        var tey = Math.floor(my / tileSize);
        if (marking) {
            txt = "X: " + tmx + " - " + tex + ", Y: " + tmy + " - " + tey;
            ctx.strokeStyle = "lime";
            ctx.fillStyle = "rgba(0,128,0,0.3)";
            var sx = Math.min(smx, mx) - scrollX;
            var sy = Math.min(smy, my) - scrollY;
            var width = Math.abs(smx - mx);
            var height = Math.abs(smy - my);
            ctx.fillRect(sx, sy, width, height);
            ctx.strokeRect(sx, sy, width, height);
        } else {
            txt = "X: " + tex + ", Y: " + tey;
        }
        ;

        txt += " " + serverLoad + " % / " + clientLoad + " %"; // right down bar
        ctx.fillStyle = "black";
        ctx.font = "12px Consolas";
        var len = ctx.measureText(txt).width + 2;
        ctx.textAlign = "right";
        ctx.fillRect(CW - len, CH - 14, len, 14);
        ctx.fillStyle = "white";
        ctx.fillText(txt, CW - 1, CH - 1);
    }

    function leftDownBar(){
        var txt = "";
        if(selected.length > 0){
            if(onDroid !== undefined){
                if(droids[onDroid] && droids[onDroid].team == myTeam){
                    if(selected.indexOf(onDroid) == -1){
                        txt = "Ctrl + click to select.";
                    }else{
                        txt = "Shift + click to deselect.";
                    };
                }else{
                    txt = "Click to attack.";
                };
            }else{
                if(marking){
                    txt = "Press space to cancel.";
                }else{
                    txt = "Control + click and drag to mark an another area of droid selection. Spacebar - (de)select all. Click to move units.";
                };
            };
        }else{
            if(droids[onDroid] && droids[onDroid].team == myTeam){
                txt = "Click to select.";
            }else{
                if(marking){
                    txt = "Press space to cancel.";
                }else{
                    txt = "Click and drag to mark an area of droid selection.";
                };
            };
        };
        ctx.fillStyle = "black";
        var len = ctx.measureText(txt).width + 2;
        ctx.textAlign = "left";
        ctx.fillRect(0,CH - 14,len,14);
        ctx.fillStyle = "white";
        ctx.fillText(txt,1,CH - 1);
    }

    function drawBigNotification(){
        var big = bigs[0];
        if(big){//render big notification
            ctx.globalAlpha = 0;
            if(big.t < 30){
                ctx.globalAlpha = big.t / 30;
            }else if(big.t < 150){
                ctx.globalAlpha = 1;
            }else if(big.t < 180){
                ctx.globalAlpha = (30 - big.t) / 30;
            }else{
                bigs.shift();
            };
            big.t++;
            ctx.textAlign = "center";
            ctx.fillText(big.m,CW / 2,CH / 4);
            ctx.strokeText(big.m,CW / 2,CH / 4);
            ctx.globalAlpha = 1;
        };
    }

    this.draw = function(){
        drawDroidCard();
        drawSelectedDroids();
        drawMap();
        drawMarkingArea();
        leftDownBar();
        drawBigNotification();
        drawButtons();
    }

    var buttons = [];
    this.createCanvasButton = function(x, y, width, height, text, color, textColor, font){
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.text = text || 'I\'m a button! ;d';
        this.color = color || 'black';
        this.textColor = textColor || 'white';
        this.font = font || '16px Consolas';
        this.onclick = function(){};
        this.wasPressed = false;
        this.followed = false
        this.draw = function(){
            ctx.font = this.font;//register button
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x,this.y,this.width,this.height);
            ctx.fillStyle = this.textColor;
            ctx.strokeRect(this.x,this.y,this.width,this.height);
            ctx.textAlign = 'center';
            ctx.fillText(this.text,this.x + this.width / 2,this.y + this.height / 2);
            if(this.wasPressed){
                ctx.fillStyle = '#0004';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }else if(this.followed){
                ctx.fillStyle = '#FFF4';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        };
        buttons.push(this);
    }

    this.removeButton = function(str){
        buttons.filter(function(btn){return btn.text == str ? true : false});
    }

    this.processButtons = function(mouseX, mouseY, active){
        for(var i = 0; i < buttons.length; i++){
            var btn = buttons[i];
            if(isPointInBox(btn.x, btn.y, btn.width, btn.height, mouseX, mouseY)) {
                if(active) {
                    if (!btn.wasPressed) {
                        btn.onclick();
                        btn.wasPressed = true;
                    }
                }else{
                    btn.wasPressed = false;
                }
                btn.followed = true;
            }else{
                btn.followed = false;
                btn.wasPressed = false;
            }
        }
    }

    this.getBtn = function(idx){
        return buttons[idx];
    }

    function drawButtons(){
        for(var i = 0; i < buttons.length; i++){
            buttons[i].draw();
        }
    }
}();