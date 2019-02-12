var msgs = document.getElementById("msgs");
var input = document.getElementById("chat_input");
var overlay = document.getElementById("overlay");
var lpanel = document.getElementById("login");
var rpanel = document.getElementById("register");
can.width = window.innerWidth;
can.height = window.innerHeight;
var CW = can.width;
var CH = can.height;

var cv2 = document.createElement("canvas"); //secondary canvas element for converting imageData to Image
cv2.width = 32;
cv2.height = 32;
var ctx2 = cv2.getContext("2d");

var sfx = [
	new Audio('laser1.mp3'),
	new Audio('explode1.mp3'),
	new Audio('factory.mp3'),
];

window.onresize = function(){
	can.width = window.innerWidth;
	can.height = window.innerHeight;
	CW = can.width;
	CH = can.height
	render(map,scrollX,scrollY, menu.hidden);
};
var chatting = false;
input.onfocus = function(){
	chatting = true;
};
input.onblur = function(){
	chatting = false;
};
input.onkeypress = function(evt){
	if(evt.key === "Enter"){
		var val = input.value;
		if(val[0] === cmdPrefix){
			chat.sendCmd(val.slice(1));
		}else{
			chat.send(val);
		}
		input.value = "";
	}
};
var tileSize = 32;

var pressed = {
	a: false,
	s: false,
	d: false,
	w: false,
};

function f(v){ // internet explorer why
	return v
}

function selectAll(){
	for(var i in droids){
		var u = droids[i];
		if(u && u.team === myTeam && u.type !== 3){
			if(selected.indexOf(u.id) === -1)selected.push(u.id);
		}
	}
}

function countActors(){
	var n = 0;
	for(var i in selected){
		var d = droids[selected[i]];
		if(d.type === 0)n++
	}
	return n;
}

function findActorDroid(){
	for(var i in selected){
		var d = droids[selected[i]];
		if(d.type === 0)return d.id;
	}
}

document.body.onkeydown = function(evt){
	pressed[evt.key] = true;
	switch(evt.key){
	case " ": case "Spacebar":{
		if(marking){
			marking = false;
		}else if(selected.length > 0){
			selected = [];
			if(!chatting)evt.preventDefault();
		}else{
			selectAll();
		}
	}break;
	case "m":{
		mapEnabled = !mapEnabled;
	}break;
		case 'Up':{
			pressed.ArrowUp = true;
		}break;
		case 'Down':{
			pressed.ArrowDown = true;
		}break;
		case 'Left':{
			pressed.ArrowLeft = true;
		}break;
		case 'Right':{
			pressed.ArrowRight = true;
		}break;
	}
};
document.body.onkeyup = function(evt){
	pressed[evt.key] = false;
	switch(evt.key){
		case "Spacebar":{
			pressed[' '] = false;
		}break;
		case "Up":{
			pressed.ArrowUp = false;
		}break;
		case "Down":{
			pressed.ArrowDown = false;
		}break;
		case 'Left':{
			pressed.ArrowLeft = false;
		}break;
		case 'Right':{
			pressed.ArrowRight = false;
		}break;
	}
};

function checkp(){
	if((document.getElementById("password_reg1").value === document.getElementById("password_reg2").value) && (document.getElementById("agree").checked)){
		document.getElementById("regbtn").disabled = false;
	}else{
		document.getElementById("regbtn").disabled = true;
	}
}
function register(){
	var ob = {
		u: document.getElementById("username_reg").value,
		p: document.getElementById("password_reg1").value,
		e: document.getElementById("email").value,
	};
	socket.emit("register",ob);
}
function backReg(){
	lpanel.hidden = false;
	rpanel.hidden = true;
	overlay.hidden = true;
}

var dirsbytype = {
	
	"0,-1": 0,
	"0,1": 2,
	"1,0": 1,
	"-1,0": 3,
	"NaN,NaN": 0,
};

var mx = 0, my = 0;
var smx = 0, smy = 0;
var tmx = 0, tmy = 0;
var marking = false;
var mapDragging = false;
var myTeam = -1;
var selected = [];
var oSelected = {};
var moving = [];
var droids = [];
var onDroid = false;
var bigs = [];
var iStart = Date.now();
var teams = [];

function Entity(x, y, id, lifetime, tx, ty){
	this.x = x;
	this.y = y;
	this.id = id || 0;
	this.tx = tx || 0;
	this.ty = ty || 0;
	this.v = 40;
	this.lifetime = lifetime || 10;
	this.startLifetime = lifetime || 10;
}
Entity.prototype.draw = tiles.drawEntity;
entities = [];

function clearSelect(){
	oSelected = {};
	selected = [];
}

function attack(d1,d2){
	if(d1.r === 0){
		if(d2.hp <= 0){
			d1.target = null;
			return false;
		}else if(!d2.target && !d2.moving){
			d2.target = d1.id;
			d2.targetX = d1.x;
			d2.targetY = d1.y;
			d2.path = pathTo(d2.x,d2.y,d1.x,d1.y);
			moving.push(d2);
		}
		d1.r = 4;
		d2.hp -= 5;
		d2.dmg = true;
		if(d2.hp <= 0){
			d1.target = null;
			return true;
		}
	}else{
		d1.r--;
	}
}

var scrollX = tileSize * 50 - CW / 2;
var scrollY = tileSize * 50 - CH / 2;

function valiScroll(){
	if(scrollX < 0)
		scrollX = 0;
	else if(scrollX > mapSizePx - CW)
		scrollX = mapSizePx - CW;
	
	if(scrollY < 1)
		scrollY = 1;
	else if(scrollY > mapSizePx - CH)
		scrollY = mapSizePx - CH;
}

function scrollToDroid(droidId){
	var d = droids[droidId];
	if(d){
		scrollX = (d.x * tileSize) - (CW / 2);
		scrollY = (d.y * tileSize) - (CH / 2);
		valiScroll();
	}
}

function scrollToMyDroids(){
	for(var i in droids){//scrolls to your army
		var d = droids[i];
		if(d.team === myTeam){
			scrollToDroid(i);
			scrolledToMyDroids = true;
			entities.push(new Entity(d.x * 32 + 16, d.y * 32 + 16, 2, 30, 0, 0));
		}
	}
}

var mapEnabled = true;
function render(map,x,y,g){
	ctx.clearRect(0,0,CW,CH);

	tiles.drawTileMap(map, x, y, g);
	tiles.drawUnits();

	for(var i = 0; i < entities.length; i++){
		entities[i].draw();
	}

	interface.draw();

}
function Droid(x,y,team,type = 0){
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
		this.type = 0;
	//map.setBlockU(this.x, this.y, this);
}
function Mapp(){
	map.init();
}

function preinit(){
	can.width++;
	can.width--;
	Mapp();
	for(var i = 0;i < 10;i++){
		do{
			var x = 45 + Math.round(Math.random() * 10);
			var y = 45 + Math.round(Math.random() * 10);
			var done = false;
			var block = map.getBlock(x, y, true);
			if((block.i == 0) && (block.u == null)){
				done = true;
				droids.push(new Droid(x,y,0));
			}
		}while(!done);
	}
	myTeam = 0;
	teams = [{img: tiles.prepareDroidTiles(Math.random() * 255, Math.random() * 255,Math.random() * 255), temp: false}];
	render(map,scrollX,scrollY, true);//draw that background
}
function red(str){//just span with red color
	var el = document.createElement("span");
	el.style.color = "red";
	el.innerText = str;
	return el;
}

var cmdPrefix = "/";
var chat = {
	
	history: [],
	historyPos: 0,
	cssClasses: [
		
		"chat_quest",
		"chat_member",
		"chat_admin",
	],
	prefixes: [
		
		"[G]",
		"[M]",
		"[A]",
	],
	send: function(msg){
		
		if(msg == '')return false;
		var hl = this.history.length - 1;
		if(this.history[hl] !== msg)this.history.push(msg);
		this.historyPos = hl;
		return socket.emit("msg", msg);
	},
	sendCmd: function(msg){
		
		var hl = this.history.length - 1;
		var m = cmdPrefix + msg;
		if(this.history[this.history.length] !== m)this.history.push(m);
		this.historyPos = hl;
		return socket.emit("cmd", msg);
	},
	receive: function(evt){
		
		var el = document.createElement("li");
		var rId = evt.rank;
		if(evt.type === "msg"){
			
			el.className = chat.cssClasses[rId];
			el.innerText = chat.prefixes[rId] + teams[evt.id].u + ": " + evt.msg;
		}else if(evt.type === "server"){
			el.className = "chat_server";
			el.innerText = "[SERVER] " + evt.msg;
		}else if(evt.type === "console"){
			el.className = "chat_console";
			el.innerText = evt.msg;
		}else if(evt.type === "private"){
			el.className = "chat_private";
			el.innerText = "From: " + chat.prefixes[rId] + teams[evt.id].u + ": " + evt.msg;
		}else if(evt.type === "bprivate"){
			el.className = "chat_private";
			el.innerText = "To: " + chat.prefixes[rId] + teams[evt.id].u + ": " + evt.msg;
		}
		msgs.appendChild(el);
	},
};

//io stuff
var firstLogin = true;
var serverLoad = 0;
var clientLoad = 0;
var ue = document.getElementById("username");
var pe = document.getElementById("password");
var out = document.getElementById('noticeArea');
var out2 = document.getElementById('rnoticeArea');
var menu = document.getElementById('overlay');
var scrolledToMyDroids = false;
var tryLogin = function(){
	socket.emit("login",{u: ue.value,p: pe.value});
}; //login
socket.on("err",function(err){
	switch(err.msg){
		case "Temporary account created": {tryLogin();out.innerText = "Logging in..."};break;
		case "Password needed": {pe.hidden = false;out.innerText = "Type password"};break;
		case "Wrong password": {out.innerHTML = red("Wrong password or login.")};break;
		case "Your army was destroyed!": {menu.hidden = false;deinit();out.innerText = "Your army has been destroyed!"};break;
		case "Kicked": {menu.hidden = false;deinit();out.innerHTML = red("You were kicked from the server.")};break;
		case "Invalid email": {out2.innerText = "Invalid e-mail"};break;
		case "Same email or nickname exists": {out2.innerText = "Same email or nickname exists"};break;
		case "Register_done": {out2.innerText = "You have been registered.";backReg()};break;
	}
});
socket.on("disconnect",function(evt){
	menu.hidden = false;
	out.innerText = "Connection lost.";
	deinit();
});
socket.on("map",function(evt){
	map.data.chunks = evt.m;
	teams = evt.t;
	for(var i = 0;i < teams.length;i++){
		var t = teams[i];
		t.cs = t.r + t.g + t.b;
		t.img = tiles.prepareDroidTiles(t.r, t.g, t.b);
	}
	for(var i = 0;i < evt.c.length;i++){
		chat.receive(evt.c[i]);
	}
	myTeam = evt.i;
	if(firstLogin){
		socket.on("d",function(evt){
			var dl = evt.d;
			var offsets = [];
			for(var i = 0;i < dl.length;i++){
				entities.push(new Entity(dl[i].x * 32, dl[i].y * 32, 1, 7));
				map.setBlockU(dl[i].x, dl[i].y, null);
				sfx[1].play();
			}
			for(var i in droids){
				var d = droids[i];
				map.setBlockU(d.x, d.y, null);
				//offsets[d.id] = d.maxOffset;
				delete droids[1];
			}
			droids = [];
			for(var i = 0;i < evt.r.length;i++){
				var d = evt.r[i];
				map.setBlockU(d.x, d.y, d);
				d.dir = dirsbytype[(d.x - d.lastX) + "," + (d.y - d.lastY)] || 2;
				if(!d.moving)d.maxOffset = offsets[d.id];
				droids[d.id] = d;
			}
			if(!scrolledToMyDroids)scrollToMyDroids();
			moving = evt.m;
			if(Math.abs((Date.now() - iStart) % 500) > 50){ //sets tick time offset relative to server one
				iStart = Date.now();
			}
			if(dl.length > 0)selected = selected.filter((id) => droids[id]);
			serverLoad = Math.round(evt.load);
		});
		socket.on("teams",function(evt){
			
			teams = evt;
			for(var i = 0;i < teams.length;i++){
				var t = teams[i];
				t.cs = t.r + t.g + t.b;
				t.img = tiles.prepareDroidTiles(t.r, t.g, t.b);
			}
		});
		firstLogin = false;
		socket.on('msg', function(evt){chat.receive(evt)});
		socket.on('big_msg',function(evt){
			bigs.push({m: evt, t: 0});
		});
		socket.on('register_done',function(){
			backReg();
		});

		socket.on('chunks',function(chunks){
			for(var id in chunks){
				map.data.chunks[id] = chunks[id];
			}
		});

		socket.on('attacks', function(attacks){
			for(var i = 0; i < attacks.length; i++){
				var d1 = droids[attacks[i]], d2 = droids[attacks[i + 1]];
				if(d1 && d2){
					entities.push(new Entity(d1.x * 32, d1.y * 32, 0, 10, d2.x * 32, d2.y * 32));
					sfx[0].play();
				}
			}
		});

		socket.on('highScores', function(evt){
			highScores = evt;
		});
		socket.on('factorized', function(evt){
			for(var i = 0; i < evt.length; i++){
				sfx[2].play();
			}
		});
	}
	init();
	menu.hidden = true;
});

function scrol(x,y){
	var v1 = scrollX, v2 = scrollY;
	scrollX += x;
	scrollY += y;
	valiScroll();
	mx += scrollX - v1;
	my += scrollY - v2;
}
var mapSizePx = 100 * tileSize;
var loopFunc = function(){
	
	var then = Date.now();
	
	if(!chatting){
		var x = 0, y = 0;
		if(pressed.w || pressed.ArrowUp){
			if(scrollY > 8)y = -8;
		}else if(pressed.s || pressed.ArrowDown){
			if(scrollY < mapSizePx - CH)y = 8;
		}
		if(pressed.d || pressed.ArrowRight){
			if(scrollX < mapSizePx - CW)x = 8;
		}else if(pressed.a || pressed.ArrowLeft){
			if(scrollX > 0)x = -8;
		}
		scrol(x,y);
		render(map,scrollX,scrollY)
	}
	
	clientLoad = Math.round((Date.now() - then) / 0.3);
};
var loop = 0;
var menuOn = true;
var highScores = [];
function init(){
	can.onmousedown = function(evt){
		if(interface.processButtons(evt.offsetX, evt.offsetY, true))return;
		if((evt.offsetX > CW - 300) && (evt.offsetY > CH - 300)){ // clicks on map
			scrollX = Math.round((evt.offsetX - CW + 300) * tileSize / 3 - CW / 2);
			scrollY = Math.round((evt.offsetY - CH + 300) * tileSize / 3 - CH / 2);
			valiScroll();
			mapDragging = true;
		}else if((evt.offsetX > 40) || (evt.offsetY > 352 )){//out of interface
			smx = evt.offsetX + scrollX;
			smy = evt.offsetY + scrollY;
			tmx = Math.floor(smx / tileSize);
			tmy = Math.floor(smy / tileSize);
			marking = true;
		}else{//in interface
			var id = Math.ceil((320 - evt.offsetY) / 32);
			if(pressed.Control){//select only the clicked one
				selected = [selected[id]];
			}else if(pressed.Shift){//deselect clicked one
				selected[id] = null;
				selected = selected.filter(function(a){if(a !== null)return a});
			}else{
				var tmp = selected[id];
				if(typeof selected[id] == 'number' ){
					selected[id] = selected[0];
					selected[0] = tmp;
					scrollToDroid(selected[0]);
				}
			}
		}
	}
	can.onmouseup = function(evt){
		if(marking){
			var emx = evt.offsetX + scrollX;
			var emy = evt.offsetY + scrollY;
			var tex = Math.floor(emx / tileSize);
			var tey = Math.floor(emy / tileSize);
			var block = map.getBlock(tex, tey);
			if(block)
			if(tmx === tex && tmy === tey){
				var action = interface.getAction();
				switch(action) {
					case 0: {
						var u = block.u;
						if (u && (u.team === myTeam)) {
							if (pressed.Shift && selected.indexOf(u.id) !== -1) {
								var id = selected.indexOf(u.id);
								selected[id] = null;
								selected = selected.filter(function (a) {
									if (a !== null) return a
								});
							} else {
								if (!pressed.Control) clearSelect();
								if (selected.indexOf(u.id) === -1) selected.push(u.id);
							}
						} else {
							var arr = [];
							var attack = u && (u.id !== undefined);
							var dir = 0;
							var w1 = 0;
							var w2 = 0.5;
							var dArrx = [0, 1, 0, -1];
							var dArry = [-1, 0, 1, 0];
							for (var i = 0; i < selected.length; i++) {
								var d = droids[selected[i]];
								if(!spec[d.type].canMove)continue
								if (d && (d.team === myTeam)) {
									if (!d.moving) {
										moving.push(d);
										d.moving = true;
									}
									d.path = pathTo(d.x, d.y, tmx, tmy);
									d.targetX = tmx;
									d.targetY = tmy;
									if (attack) d.target = u.id;

									do {
										w1++;
										tmx += dArrx[dir];
										tmy += dArry[dir];
										if (w1 >= w2) {
											w1 = 0;
											w2 += 0.5;
											dir = (dir + 1) % 4;
										}
										block = map.getBlock(tmx, tmy);
									} while (!block || (block.i === 1) || (block.u));
									arr.push({i: d.id, x: d.targetX, y: d.targetY});
								}
							}
							if(selected.length > 0){
								socket.emit("action", {d: arr, i: attack ? u.id : false});
								entities.push(new Entity(tex * tileSize + 16, tey * tileSize + 16, 2, 30, 0, 0));
							}
							console.log(arr);
						}
					}break;
					default:{
						if(canForm(tex, tey, action)){
							var data = {
								x: tex,
								y: tey,
								d: findActorDroid(),
								type: action,
								preferredDroids: selected.slice(1),
							};
							socket.emit('transform', data);
							console.log(data);
							interface.setAction(0);
						}
					}
				}
			}else{
				var ex = Math.max(tmx,tex);
				var ey = Math.max(tmy,tey);
				var sx = Math.min(tmx,tex);
				var sy = Math.min(tmy,tey);
				if(!pressed.Control)clearSelect();
				for(var i = sx;i <= ex;i++){
					for(var j = sy;j <= ey;j++){
						var u = map.getBlock(i, j).u;
						if(u && u.team === myTeam){
							if(selected.indexOf(u.id) === -1 && u.type !== 3)selected.push(u.id);
						}
					}
				}
			}
		marking = false;
		}
		mapDragging = false;
	};
	can.onmousemove = function(evt){

		var actionAllowed = false;
		if(!evt)return false;
		if((evt.offsetX > 40) || (evt.offsetY > 352 )){//out of interface
			mx = evt.offsetX + scrollX;
			my = evt.offsetY + scrollY;
			var action = interface.getAction();
			var tex = Math.floor(mx / tileSize);
			var tey = Math.floor(my / tileSize);
			if(action > 0){
				interface.lockAction(canForm(tex, tey, action), tex, tey);
			}
			var block = map.getBlock(tex, tey);
			var u = block && block.u;
			if(u){
				onDroid = u.id;
			}else if(droids[selected[0]] && (droids[selected[0]].target !== false)){
				onDroid = droids[selected[0]].target;
			}else onDroid = undefined;
			
		}else{//in interface
			var id = Math.ceil((352 - evt.offsetY) / 32) - 1;
			if(selected[id]){
				onDroid = selected[id];
			}else{
				onDroid = droids[selected[0]] && droids[selected[0]].target || undefined;
			}
		}
		
		if(mapDragging){
			scrollX = Math.round((evt.offsetX - CW + 300) * tileSize / 3 - CW / 2);
			scrollY = Math.round((evt.offsetY - CH + 300) * tileSize / 3 - CH / 2);
		}

		interface.processButtons(evt.offsetX, evt.offsetY, false);
	};

	if(teams[myTeam].t) {
		var registerButton = new interface.createCanvasButton(0, 0, 75, 20, 'Register');
		registerButton.onclick = function() {
			lpanel.hidden = true;
			rpanel.hidden = false;
			overlay.hidden = false;
			document.getElementById("username_reg").value = teams[myTeam].u;
		}
	}

	valiScroll();
	loop = setInterval(loopFunc,30);
	menuOn = false;
}
function deinit(){
	scrolledToMyDroids = false;
	can.onmousedown = null;
	can.onmouseup = null;
	can.onmousemove = null;
	clearInterval(loop);
	menuOn = true;
	interface.removeButton('Register');
	selected = [];
}