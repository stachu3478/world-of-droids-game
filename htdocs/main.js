var can = document.getElementById("c");
can.width = window.innerWidth;
can.height = window.innerHeight;
var CW = can.width;
var CH = can.height;
window.onchange = function(){
	can.width = window.innerWidth;
	can.height = window.innerHeight;
	CW = can.width;
	CH = can.height;
	if(menuOn)render(m,scrollX,scrollY);
};
var ctx = can.getContext("2d");
var tileSize = 32;

var pressed = {
	a: false,
	s: false,
	d: false,
	w: false,
};
document.body.onkeydown = function(evt){
	pressed[evt.key] = true;
	if(evt.key == " "){
		selected = [];
		evt.preventDefault();
	};
};
document.body.onkeyup = function(evt){
	pressed[evt.key] = false;
};

const droidTypes = 4;
loading = 0;
function incl(){
	if(++loading == 16){
		preinit();
	};
};

var dirwgtype = {
	
	"0,-1": 0,
	"0,1": 2,
	"1,0": 1,
	"-1,0": 3,
	"NaN,NaN": 0,
};
var imgArray = [];
var dImages = [];
for(var it = 1;it <= droidTypes;it++){
	dImages.push({
	r: new Image(),
	g: new Image(),
	b: new Image(),
	});
	var i = it - 1;
	dImages[i].r.src = "tiles/d" + it + "r.png";
	dImages[i].r.onload = incl;
	dImages[i].g.src = "tiles/d" + it + "g.png";
	dImages[i].g.onload = incl;
	dImages[i].b.src = "tiles/d" + it + "b.png";
	dImages[i].b.onload = incl;
};
function dDroid(x,y,t,u){
	var tp1 = u.dir || 0;
	var a = u.dmg ? 0.5 : 1;
	ctx.globalAlpha = a * t.r / t.cs;
	ctx.drawImage(dImages[tp1].r,x,y);
	ctx.globalAlpha = a * t.g / t.cs;
	ctx.drawImage(dImages[tp1].g,x,y);
	ctx.globalAlpha = a * t.b / t.cs;
	ctx.drawImage(dImages[tp1].b,x,y);
	ctx.globalAlpha = 1;
};
for(var i = 1;i < 5;i++){
	var img = new Image();
	img.src = "tiles/" + i + ".bmp";
	img.onload = incl;
	imgArray.push(img);
};

var mx = 0;
var my = 0;
var smx = 0;
var smy = 0;
var tmx = 0;
var tmy = 0;
var marking = false;
var myTeam = -1;
var selected = [];
var oSelected = {};
var moving = [];
var droids = [];
var onDroid = false;
var tick = function(){
	var ref = false;
	for(var i = 0;i < moving.length;i++){
		var d = moving[i];
		if(d){
			var p = d.path;
			if(p.length == 0){
				delete moving[i];
				ref = true;
				d.moving = false;
			}else if(p && (m[p[0]][p[1]].u == null)){
				var target = droids[d.target];
				if(target && (dist(d.x - target.x,d.y - target.y) <= 5)){
					attack(d,target);
				}else{
					m[d.x][d.y].u = null;
					d.dir = dirwgtype[(p[0] - d.x) + "," + (p[1] - d.y)] || 3;
					d.lastX = d.x;
					d.lastY = d.y;
					d.x = p[0];
					d.y = p[1];
					m[d.x][d.y].u = d;
					p.shift();
					p.shift();
					d.moving = true;
					d.tol = 0;
					d.maxOffset = 1;
				}
			}else{
				//if(d.tol >= 1){
				//	d.path = pathTo(d.x,d.y,d.targetX,d.targetY);
				//	d.tol = Math.round(Math.random() * -2);
				//};
				//d.tol++;
			};
		}else{
			ref = true;
		};
	};
	if(ref)moving = moving.filter(function(a){if(a && (a.hp > 0))return a});
	if(window.innerHeight !== can.height || window.innerWidth !== can.width){
		can.width = window.innerWidth;
		can.height = window.innerHeight;
		CW = can.width;
		CH = can.height;
		if(menuOn)render(m,scrollX,scrollY);
	};
};
var inter = setInterval(tick,500);
var iStart = Date.now();
function Team(id,r,g,b){
	this.id = id;
	this.r = r || Math.floor(Math.random() * 255);
	this.g = g || Math.floor(Math.random() * 255);
	this.b = b || Math.floor(Math.random() * 255);
	this.cdec = "rgb("+this.r+","+this.g+","+this.b+")";
	this.dcdec = "rgba("+this.r+","+this.g+","+this.b+",0.5)";
};
var teams = [];

function clearSelect(){
	oSelected = {};
	selected = [];
};

function dist(x12,y12){
	return Math.sqrt(x12 * x12 + y12 * y12);
};

function pathTo(x1,y1,x2,y2){
	if(m[x2][y2].t == 0 && (Math.abs(x1 - x2) < 2) && Math.abs(y1 - y2) < 2 && Math.abs(x1 - x2 + y1 - y2) < 2)return [x2,y2];
	var pm = new Array(100);
	for(var i = 0;i < 100;i++){
		pm[i] = new Int8Array(100);
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
			if(c1 && m[d1][y].t == 0 && m[d1][y].u == null && pm[d1][y] == 0){
				if(d1 == x2 && y == y2){
					done = true;
					break;
				}else{
					arr1.push(d1,y);
					pm[d1][y] = step;
					failed = false;
				};
			};
			if(c2 && m[d2][y].t == 0 && m[d2][y].u == null && pm[d2][y] == 0){
				if(d2 == x2 && y == y2){
					done = true;
					break;
				}else{
					arr1.push(d2,y);
					pm[d2][y] = step;
					failed = false;
				};
			};
			if(c3 && m[x][d3].t == 0 && m[x][d3].u == null && pm[x][d3] == 0){
				if(x == x2 && d3 == y2){
					done = true;
					break;
				}else{
					arr1.push(x,d3);
					pm[x][d3] = step;
					failed = false;
				};
			};
			if(c4 && m[x][d4].t == 0 && m[x][d4].u == null && pm[x][d4] == 0){
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
		};
		if(min == 1){
			if(path.length == 2){
				return [x2,y2];
			}else{
				return path;
			};
		};
		px = minx;
		py = miny;
		path.unshift(minx,miny);
	};
	return path;
};

function delDroid(d){
	if(d){
		if(d.moving)
		for(var i = 0;i < moving.length;i++){
			if(moving[i] == d)delete moving[i];
		};
		for(var i = 0;i < droids.length;i++){
			var d2 = droids[i];
			if(d2.id > d.id)d2.id--;
			if(d2.target == d.id){
				d2.target = false;
			}else if(d2.target > d.id)d2.target--;
		};
		m[d.x][d.y].u = null;
		droids[d.id] = null;
		droids = droids.filter(function(a){return a}); //add hp condition if possible
	};
};
function attack(d1,d2){
	if(d1.r == 0){
		if(d2.hp <= 0){
			delDroid(d2);
			d1.target = null;
			return false;
		}else if(!d2.target && !d2.moving){
			d2.target = d1.id;
			d2.targetX = d1.x;
			d2.targetY = d1.y;
			d2.path = pathTo(d2.x,d2.y,d1.x,d1.y);
			moving.push(d2);
		};
		d1.r = 4;
		d2.hp -= 5;
		d2.dmg = true;
		if(d2.hp <= 0){
			delDroid(d2);
			d1.target = null;
			return true;
		};
	}else{
		d1.r--;
	};
};

var scrollX = tileSize * 50 - CW / 2;
var scrollY = tileSize * 50 - CH / 2;
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
function hpBar(p,x,y){
	var sx = x + 30;
	var sy = y + 29;
	var loops = Math.ceil(p / 12.5) + 1;
	for(var i = 1;i < loops;i++){
		ctx.strokeStyle = bCols[i];
		ctx.beginPath();
		ctx.moveTo(sx - i,sy);
		ctx.lineTo(sx,sy);
		ctx.stroke();
		//ctx.strokeRect(sx - i,sy,i,0);
		sy -= 2;
	};
};
function render(map,x,y){
	var oX = x % tileSize;
	var oY = y % tileSize;
	var sX = Math.floor(x / tileSize);
	var sY = Math.floor(y / tileSize);
	var eX = sX + Math.ceil(CW / tileSize);
	var eY = sY + Math.ceil(CH / tileSize);
	var now = Date.now();
	ctx.clearRect(0,0,CW,CH);
	//ctx.drawImage(tileimg,160,160);
	//return false;
	for(var i = sX, px = -oX;i <= eX;i++, px += tileSize){ //first loop for backdrop tiles
		for(var j = sY ,py = -oY;j <= eY;j++ ,py += tileSize){
			var exists = (i >= 0) && (j >= 0) && (i < 100) && (j < 100);
			if(exists){
				var t = map[i][j].t;
				if(t == 0){
					ctx.drawImage(imgArray[0],px,py);
				}else if(t == 1){
					ctx.drawImage(imgArray[1],px,py);
				}else{
					ctx.drawImage(imgArray[2],px,py);
				};
			}else{
				ctx.drawImage(imgArray[3],px,py);
			};
		};
	};
	for(var i = 0;i < droids.length;i++){
		var u = droids[i];
		if(u !== null){
			var px = u.x * tileSize - scrollX;
			var py = u.y * tileSize - scrollY;
			var t = teams[u.team] || {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)};
			var offsetX = 0;
			var offsetY = 0;
			if(u.moving){
				var stamp = 1 - (((now - iStart) % 500) / 500);
				if(stamp < u.maxOffset){
					offsetX += (u.lastX - u.x) * stamp * tileSize;
					offsetY += (u.lastY - u.y) * stamp * tileSize;
					u.maxOffset = stamp;
				};
			};
			if(isNaN(u.dir))u.dir = dirwgtype[(u.x - u.lastX) + "," + (u.y - u.lastY)] || 0;
			dDroid(px + offsetX,py + offsetY,t,u);
			u.dmg = false;
			if(selected.indexOf(u.id) > -1)hpBar(u.hp * 2,px + offsetX,py + offsetY);
		};
	};
	ctx.fillStyle = "grey";
	ctx.strokeStyle = "lightGrey";
	ctx.strokeRect(0,0,41,320);
	ctx.fillRect(0,0,40,325);
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
	ctx.fillStyle = "grey";
	ctx.strokeStyle = "lightGrey";
	if(droids[onDroid] !== undefined){
		var xp = CW - 128;
		var yp = 0;
		var u = droids[onDroid];
		ctx.strokeRect(xp,yp,128,64);
		ctx.fillRect(xp,yp,128,64);
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
		ctx.fillStyle = "black";
		ctx.fillText((u.moving ? (u.target === false ? "Moving" : "Attacking") : "Idle"),xp + 36,yp + 46);
		ctx.fillText(teams[u.team].u,xp + 36,yp + 60);
		var t = teams[u.team] || {r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255)};
		dDroid(xp,yp,t,u);
	};
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
	var txt = "";
	var tex = Math.floor(mx / tileSize);
	var tey = Math.floor(my / tileSize);
	if(marking){
		txt = "X: " + tmx + " - " + tex + ", Y: " + tmy + " - " + tey;
		ctx.strokeStyle = "lime";
		ctx.fillStyle = "rgba(0,128,0,0.2)";
		var sx = Math.min(smx,mx) - scrollX;
		var sy = Math.min(smy,my) - scrollY;
		var width = Math.abs(smx - mx); 
		var height = Math.abs(smy - my); 
		ctx.fillRect(sx,sy,width,height);
		ctx.strokeRect(sx,sy,width,height);
	}else{
		txt = "X: " + tex + ", Y: " + tey;
	};
	ctx.fillStyle = "black";
	ctx.font = "12px Consolas";
	var len = ctx.measureText(txt).width + 2;
	ctx.textAlign = "right";
	ctx.fillRect(CW - len,CH - 14,len,14);
	ctx.fillStyle = "white";
	ctx.fillText(txt,CW - 1,CH - 1);
};
function Droid(x,y,team){
	this.x = x;
	this.y = y;
	this.hp = 50;
	this.r = 0;
	this.path = [];
	this.tm = 0;
	this.lastX = 0;
	this.lastY = 0;
	this.lastTime = 0;
	this.moving = false;
	this.targetX = x;
	this.targetY = y;
	this.target = false;
	this.tol = 0;
	this.maxOffset = 0;
	this.team = team;
	this.dmg = false;
	this.dir = 0,
	//this.wcd = 0;//walking cooldown
	m[x][y].u = this;
};
function Map(x,y){
	this.map = new Array(x);
	for(var i = 0;i < x;i++){
		this.map[i] = new Array(y);
		for(var j = 0;j < y;j++){
			this.map[i][j] = {t: Math.random() > 0.0625 ? 0 : 1,u: null};
		};
	};
};

function preinit(){
	var map = new Map(100,100);
	m = map.map;
	for(var i = 0;i < 10;i++){
		do{
			var x = 45 + Math.round(Math.random() * 10);
			var y = 45 + Math.round(Math.random() * 10);
			var done = false;
			if((m[x][y].t == 0) && (m[x][y].u == null)){
				done = true;
				droids.push(new Droid(x,y,0));
			};
		}while(!done);
	};
		do{
			var x = 10 + Math.round(Math.random() * 80);
			var y = 10 + Math.round(Math.random() * 80);
			var done = false;
			if((m[x][y].t == 0) && (m[x][y].u == null)){
				done = true;
				droids.push(new Droid(x,y,1));
			};
		}while(!done);
	render(m,scrollX,scrollY);
};
function red(str){
	var el = document.createElement("span");
	el.style.color = "red";
	el.innerText = str;
	return el;
};

//io stuff
var firstLogin = true;
var ue = document.getElementById("username");
var pe = document.getElementById("password");
var out = document.getElementById('noticeArea');
var menu = document.getElementById('overlay');
var scrolledToMyDroids = false;
var tryLogin = function(){
	socket.emit("login",{u: ue.value,p: pe.value});
}; //login
socket.on("err",function(err){
	switch(err.msg){
		case "Temporary account created": {tryLogin();out.innerText = "Logging in..."};break;
		case "Password needed": {pe.hidden = false;out.innerText = "Type password"};break;
		case "Wrong password": {out.innerText = red("Wrong password or login.")};break;
		case "Your army was destroyed!": {menu.hidden = false;deinit();out.innerText = "Your army has been destroyed!"};break;
		case "Kicked": {menu.hidden = false;deinit();out.innerText = "You were kicked from the server."};break;
	};
});
socket.on("disconnect",function(evt){
	menu.hidden = false;
	out.innerText = "Connection lost.";
	deinit();
});
socket.on("map",function(evt){
	m = evt.m;
	teams = evt.t;
	for(var i = 0;i < teams.length;i++){
		teams[i].cs = teams[i].r + teams[i].g + teams[i].b;
	};
	myTeam = evt.i;
	if(firstLogin){
		socket.on("d",function(evt){
			for(var i = 0;i < droids.length;i++){
				var d = droids[i];
				m[d.x][d.y].u = null;
			};
			droids = evt.r;
			for(var i = 0;i < evt.r.length;i++){
				var d = evt.r[i];
				m[d.x][d.y].u = d;
				d.dir = dirwgtype[(d.x - d.lastX) + "," + (d.y - d.lastY)] || 2;
			};
			if(!scrolledToMyDroids)for(var i = 0;i < droids.length;i++){//scrolls to your army
				var d = droids[i];
				if(d.team == myTeam){
					scrollX = (d.x * tileSize) - (CW / 2);
					scrollY = (d.y * tileSize) - (CH / 2);
					scrolledToMyDroids = true;
					break;
				};
			};
			moving = evt.m;
			if(Math.abs((Date.now() - iStart) % 500) > 50){ //sets tick time offset relative to server one
				clearInterval(inter);
				inter = setInterval(tick,500);
				iStart = Date.now();
				console.log("Equalizing server tick.");
			};
			var dl = evt.d;
			var ref = false;
			for(var i = 0;i < dl.length;i++){
				var id = dl[i];
				for(var j = 0;j < selected.length;j++){
					var d = droids[selected[j]];
					if(selected[j] !== undefined){
						if(selected[j] > id){
							selected[j]--;
						}else if(selected[j] == id){
							delete selected[j];
							ref = true;
						}//else if(d && d.target >= id)d.target--; this is performed for server already
					}else{
						ref = true;
					};
				};
			};
			if(ref)selected = selected.filter(function(a){return a});
		});
		socket.on("teams",function(evt){
			teams = evt.t;
			for(var i = 0;i < teams.length;i++){
				teams[i].cs = teams[i].r + teams[i].g + teams[i].b;
			};
		})
		firstLogin = false;
	};
	init();
	menu.hidden = true;
});
/*
var chat = document.getElementById("ch");
var txt = document.getElementById('msg');
document.getElementById("sendChat").onclick = function(){
	socket.emit('msg',txt.value);
	txt.value = "";
};
document.getElementById("userSet").onclick = function(){
	socket.emit('userset',document.getElementById('username').value);
};
socket.on('msg',function(evt){
	chat.innerHTML += "<br>"+evt.user+": "+evt.msg;
});
socket.on('userset',function(evt){
	chat.innerHTML += "<br>"+evt.old+" zmienia nick na: "+evt.snew;
});
socket.on('hi',function(evt){
	chat.innerHTML += "<br>"+evt.user+" dołącza do rozmowy.";
});
socket.on('bye',function(evt){
	chat.innerHTML += "<br>"+evt.user+" wychodzi.";
});
socket.on('buffer',function(evt){
	for(var i = 0;i < evt.length;i++){
		var e = evt[i];
		if(e.m == 'msg'){
			chat.innerHTML += "<br>"+e.e.user+": "+e.e.msg;
		}else if(e.m == 'userset'){
			chat.innerHTML += "<br>"+e.e.old+" zmienia nick na: "+e.e.snew;
		}else if(e.m == 'hi'){
			chat.innerHTML += "<br>"+evt.user+" dołącza do rozmowy.";
		}else if(e.m == 'bye'){
			chat.innerHTML += "<br>"+evt.user+" wychodzi.";
		};
	};
})*/

function scrol(x,y){
	if(scrollX % 4 !== 0){
		scrollX = Math.ceil(scrollX / 4) * 4;
	};
	if(scrollY % 4 !== 0){
		scrollY = Math.ceil(scrollY / 4) * 4;
	};
	scrollX += x;
	scrollY += y;
	mx += x;
	my += y;
};
var mapSizePx = 100 * tileSize;
var loopFunc = function(){
	if(pressed.w){
		if(scrollY > 0)scrol(0,-4);
	}else if(pressed.s){
		if(scrollY < mapSizePx - CH)scrol(0,4);
	};
	if(pressed.d){
		if(scrollX < mapSizePx - CW)scrol(4,0);
	}else if(pressed.a){
		if(scrollX > 0)scrol(-4,0);
	};
	render(m,scrollX,scrollY)
};
var loop = 0;
var menuOn = true;
function init(){
	can.onmousedown = function(evt){
		if((evt.offsetX > 40) || (evt.offsetY > 320)){//out of interface
			smx = evt.offsetX + scrollX;
			smy = evt.offsetY + scrollY;
			tmx = Math.floor(smx / tileSize);
			tmy = Math.floor(smy / tileSize);
			marking = true;
		}else{//in interface
			var id = Math.ceil((320 - evt.offsetY) / 32);
			if(pressed.Control){
				selected = [selected[id]];
			}else if(pressed.Shift){
				selected[id] = null;
				selected = selected.filter(function(a){if(a !== null)return a});
			}else{
				var tmp = selected[id];
				selected[id] = selected[0];
				selected[0] = tmp;
				console.log("exchange" + id);
			};
		};
	};
	can.onmouseup = function(evt){
		if(marking){
			var emx = evt.offsetX + scrollX;
			var emy = evt.offsetY + scrollY;
			var tex = Math.floor(emx / tileSize);
			var tey = Math.floor(emy / tileSize);
			if(m[tex] && m[tex][tey])
			if(tmx == tex && tmy == tey){
				var u = m[tmx][tmy].u;
				if((u !== null) && (u.team == myTeam)){
					if(!pressed.Control)clearSelect();
					selected.push(u.id);
					//oSelected[u.id] = true;
				}else{
					//find path and :>>>
					var arr = [];
					var attack = u !== null;
					var dir = 0;
					var w1 = 0;
					var w2 = 0.5;
					var dArrx = [0,1,0,-1];
					var dArry = [-1,0,1,0];
					for(var i = 0;i < selected.length;i++){
						var d = droids[selected[i]];
						if(d && (d.team == myTeam)){
							if(!d.moving){
								moving.push(d);
								d.moving = true;
							};
							d.path = pathTo(d.x,d.y,tmx,tmy);
							d.targetX = tmx;
							d.targetY = tmy;
							if(attack)d.target = u.id;
						do{
						w1++;
						tmx += dArrx[dir];
						tmy += dArry[dir];
						if(w1 >= w2){
							w1 = 0;
							w2 += 0.5;
							dir = (dir + 1) % 4;
						};
						}while(!(m[tmx]) || !(m[tmx][tmy]) || (m[tmx][tmy].t == 1) || (m[tmx][tmy].u !== null));
						arr.push({i: d.id, x: d.targetX, y: d.targetY});
						};
					};
					socket.emit("action",{d: arr, i: attack ? u.id : false});
				};
			}else{
				var ex = Math.max(tmx,tex);
				var ey = Math.max(tmy,tey);
				var sx = Math.min(tmx,tex);
				var sy = Math.min(tmy,tey);
				if(!pressed.Control)clearSelect();
				for(var i = sx;i <= ex;i++){
					for(var j = sy;j <= ey;j++){
						var u = m[i][j].u;
						if(u !== null && u.team == myTeam){
							selected.push(u.id);
							//oSelected[u.id] = true;
						}
					}
				}
			};
		marking = false;
		};
	};
	can.onmousemove = function(evt){
		mx = evt.offsetX + scrollX;
		my = evt.offsetY + scrollY;
		var tex = Math.floor(mx / tileSize);
		var tey = Math.floor(my / tileSize);
		var u = m[tex][tey].u;
		if(u){
			onDroid = u.id;
		}else if(droids[selected[0]] && (droids[selected[0]].target !== false)){
			onDroid = droids[selected[0]].target;
		}else onDroid = false;
	};
	loop = setInterval(loopFunc,30);
	console.log("loaded");
	menuOn = false;
};
function deinit(){
	scrolledToMyDroids = false;
	can.onmousedown = null;
	can.onmouseup = null;
	can.onmousemove = null;
	clearInterval(loop);
	menuOn = true;
};
//init();