window.interface = new function(){

    var dDroid = tiles.dDroid;
    var action = 0;
    var actionAllowed = false;

    function drawDroidCard(){
        if(droids[onDroid] !== undefined){
            var u = droids[onDroid];
            var usernameLength = ctx.measureText(teams[u.team].u).width;
            var windowWidth = (usernameLength > 92 ? usernameLength + 40 : 128)
            var xp = CW - windowWidth;
            var yp = 0;
            var maxHp = spec[u.type].hp;
            ctx.strokeRect(xp,yp,windowWidth,64);
            ctx.fillStyle = "#000B";
            ctx.fillRect(xp,yp,windowWidth,64);
            ctx.fillStyle = "black";
            ctx.fillRect(xp + 44,yp + 4,80,24);
            ctx.fillStyle = "lime";
            ctx.fillRect(xp + 45,yp + 5,78 * (u.hp / maxHp),22);
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            //ctx.font = "20px Arial";
            ctx.strokeStyle = "black";
            ctx.strokeText(u.hp + " / " + maxHp,xp + 84,yp + 21);
            ctx.fillText(u.hp + " / " + maxHp,xp + 84,yp + 21);
            ctx.textAlign = "left";
            ctx.fillStyle = "white";
            ctx.fillText((u.moving ? (u.target === false ? "Moving" : "Attacking") : "Idle"), xp + 36, yp + 46);
            ctx.fillText(teams[u.team].u,xp + 36,yp + 60);

            var t = teams[u.team] || {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)};
            dDroid(xp,yp,t,u);

            ctx.strokeStyle = "white";//square of droid selected
            ctx.strokeRect(u.x * tileSize - scrollX, u.y * tileSize - scrollY, 32, 32);
        }
    }

    var navsHidden = false;
    function drawSelectedDroidCard(){
        if(droids[selected[0]] !== undefined){
            var xp = 0;
            var yp = 320;
            var u = droids[selected[0]];
            var maxHp = spec[u.type].hp;
            ctx.strokeRect(xp,yp,128,64);
            ctx.fillRect(xp,yp,128,64);
            ctx.fillStyle = "black";
            ctx.fillRect(xp + 44,yp + 4,80,24);
            ctx.fillStyle = "lime";
            ctx.fillRect(xp + 45,yp + 5,78 * (u.hp / maxHp),22);
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            //ctx.font = "20px Arial";
            ctx.strokeText(u.hp + " / " + maxHp,xp + 84,yp + 21);
            ctx.fillText(u.hp + " / " + maxHp,xp + 84,yp + 21);
            ctx.textAlign = "left";
            ctx.fillStyle = "black";
            ctx.fillText((u.moving ? (u.target === false ? "Moving" : "Attacking") : "Idle"),xp + 36,yp + 58);
            if(navsHidden)lookNavs(false);
        }else{
            ctx.strokeRect(0,324,40,1);
            if(!navsHidden)lookNavs(true);
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
                var maxHp = spec[u.type].hp;
                ctx.fillRect(32, ypos + 32 - u.hp * 32 / maxHp,8,u.hp * 32 / maxHp);
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

    function renderHighscores(){
        ctx.strokeRect(CW - 128, 64, 128, highScores.length * 16);
        ctx.fillStyle = '#000B';
        ctx.fillRect(CW - 128, 64, 128, highScores.length * 16);
        ctx.font = '12px Georgia';
        ctx.fillStyle = '#FFF';
        for(var i = 0; i < highScores.length; i++){
            ctx.textAlign = 'left';
            ctx.fillText((i + 1) + '. ' + highScores[i].name + ':', CW - 128, 78 + i * 16, 96);
            ctx.textAlign = 'right';
            ctx.fillText(highScores[i].score.toString(), CW - 1, 78 + i * 16, 32);
        }
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
            ctx.font = '20px Consolas';
            ctx.fillText(big.m,CW / 2,CH / 4);
            ctx.strokeText(big.m,CW / 2,CH / 4);
            ctx.globalAlpha = 1;
        };
    }

    this.draw = function(){
        drawDroidCard();
        renderHighscores();
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
        this.tip = '';
        this.onclick = function(){};
        this.wasPressed = false;
        this.followed = false;
        this.hidden = false;
        this.draw = function(){
            if(!this.hidden) {
                ctx.font = this.font;
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x,this.y,this.width,this.height);
                ctx.fillStyle = this.textColor;
                ctx.strokeRect(this.x,this.y,this.width,this.height);
                ctx.textAlign = 'center';
                if (typeof this.text === 'string')
                    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
                else
                    tiles.drawImg(this.text, this.x, this.y);
                if (this.wasPressed) {
                    ctx.fillStyle = '#0004';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                } else if (this.followed) {
                    ctx.fillStyle = '#FFF4';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            }
        };
        buttons.push(this);
    };

    this.removeButton = function(str){
        buttons.filter(function(btn){return btn.text !== str});
    };

    this.processButtons = function(mouseX, mouseY, active){
        var anyPressed = false;
        var anyFollowed = false;
        for(var i = 0; i < buttons.length; i++){
            var btn = buttons[i];
            if(btn.hidden)continue;
            if(isPointInBox(btn.x, btn.y, btn.width, btn.height, mouseX, mouseY)) {
                if(active) {
                    if (!btn.wasPressed) {
                        btn.onclick();
                        btn.wasPressed = true;
                        anyPressed = true;
                    }
                }else{
                    btn.wasPressed = false;
                }
                btn.followed = true;
                anyFollowed = true;
                lastX = mouseX;
                lastY = mouseY;
                tip = btn.tip;
            }else{
                btn.followed = false;
                btn.wasPressed = false;
            }
        }
        if(!anyFollowed)tip = '';

        return anyPressed;
    };

    this.getBtn = function(idx){
        return buttons[idx];
    };

    var tip = '';
    var lastX, lastY;
    var tileX, tileY;
    function drawButtons(){
        for(var i = 0; i < buttons.length; i++){
            buttons[i].draw();
        }
        if(!navsHidden){
            ctx.fillStyle = '#08F4';
            ctx.fillRect(action * 32, 384, 32, 32);
        }

        ctx.fillStyle = '#222E'; // draw tip
        ctx.fillRect(lastX, lastY - 18, ctx.measureText(tip).width, 18);
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.fillText(tip, lastX, lastY - 1);

        if(action > 0){
            if (actionAllowed) {
                ctx.fillStyle = '#2D28'
            } else {
                ctx.fillStyle = '#D228'
            }
            ctx.fillRect(tileX * 32 - scrollX, tileY * 32 - scrollY, 32, 32);
        }
    }

    var navs = [
        new this.createCanvasButton(0, 384, 32, 32, 11, '#111C', '#FFF'),
        new this.createCanvasButton(32, 384, 32, 32, 12, '#111C', '#FFF'),
        new this.createCanvasButton(64, 384, 32, 32, 13, '#111C', '#FFF'),
        new this.createCanvasButton(96, 384, 32, 32, 14, '#111C', '#FFF'),
    ];

    navs[0].tip = 'Move units';
    navs[1].tip = 'Build droid factory';
    navs[2].tip = 'Build turret';
    navs[3].tip = 'Build wall';

    navs[0].onclick = () => {action = 0};
    navs[1].onclick = () => {if(countActors() >= 5)action = 1; else bigs.push({t: 90, m: 'You need at least 5 selected droids'})};
    navs[2].onclick = () => {if(countActors() >= 5)action = 2; else bigs.push({t: 90, m: 'You need at least 5 selected droids'})};
    navs[3].onclick = () => {if(findActorDroid() !== undefined)action = 3; else bigs.push({t: 90, m: 'You need at least 1 basic droid'})};

    function lookNavs(bool){
        for(var i = 0; i < 4; i++){
            navs[i].hidden = bool;
        }
        navsHidden = bool;
        if(!bool)action = 0;
    }

    this.lockAction = function(bool, tx, ty){
        actionAllowed = bool;
        tileX = tx;
        tileY = ty;
    };

    this.getAction = function(){
        return action;
    };
    this.setAction = function(a){
        action = a;
    }
}();