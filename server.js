var fs = require('fs');
var express = require('express');
var app = express(); //buduje serwer http - nmp install --save express@4.15.2
var http = require('http').Server(app);
var io = require('socket.io')(http); //bilbio do socketa - nmp install --save socket.io
var url = require('url');
var req = require('request');
const PORT = process.env.PORT || 3000;

var chunks = require('./chunks.js').terrain;
var miscClass = require('./misc.js');
var misc = new miscClass(chunks);

app.use(express.static('htdocs'));

var moving = [];
function sendDroid(d, x, y, path, target){
	if(misc.spec[d.type].canMove)
		d.path = path || misc.pathTo(d.x,d.y,x,y);
	if(!d.moving){
		moving.push(d);
		d.moving = true;
	}
	if(target !== undefined){
		d.target = target;
	}
	d.targetX = x;
	d.targetY = y;
	d.tol = 3;
}
function moveDroid(d, x, y){
	d.lastX = d.x;
	d.lastY = d.y;
	if(d.x && d.y)
		chunks.setBlockU(d.x, d.y);
	d.x = x;
	d.y = y;
	chunks.setBlockU(x, y, d);
}

function eachDroid(f){
	for(var i in droids){
		if(droids[i])
		if(f(parseInt(i), droids[i]))break;
	}
}

var cpuLoad = 0;

function resetPath(id){
	var d = droids[id];
	if(!d)return false;
	d.path = misc.pathTo(d.x,d.y,d.targetX,d.targetY);
	d.tol = Math.round(Math.random() * -2);
}

var inter = setInterval(function(){
	var then = Date.now();
	var ref = false;
	for(var i = 0;i < moving.length;i++){
		var d = moving[i];
		if(d){
			var p = d.path;
			var block;
			var target = droids[d.target];
			if(p && p.length > 0)block = chunks.getBlock(p[0], p[1]);
			if((d.x === d.targetX) && (d.y === d.targetY)){
				moving[i] = null;
				ref = true;
				d.moving = false;
				d.maxOffset = 0;
				d.dmg = false;
				d.free = true;
			}else if(target && (misc.dist(d.x - target.x,d.y - target.y) <= 5)) {
				attack(d, target);
				d.maxOffset = 0;
			}else if(p && block && !block.u && (block.i === 0) && (d.tol > 2)) {
				if (p.shift && misc.spec[d.type].canMove) {
					moveDroid(d, p[0], p[1]);
					p.shift();
					p.shift();
					d.maxOffset = 1;
					d.dmg = false;
					if (movedAlongChunk(d)) sendFreshChunks(teams[d.team]);
				} else if (!target) {
					moving[i] = null;
					ref = true;
					d.moving = false;
					d.maxOffset = 0;
					d.dmg = false;
					d.free = true;
				} else if (!misc.spec[d.type].canMove && (d.adv || d.type === 2)) {
					eachDroid((i, d3) => {
						if (d3.team === target.team && misc.dist(d.x - d3.x, d.y - d3.y) <= 5) {
							sendDroid(d, d3.x, d3.y, undefined, d3.id);
							return true;
						}
					})
				}
			} else{
				if(d.tol > 2){
					if(p){
						var d2 = chunks.getBlock(p[0], p[1]).u;
						if(d2 && !d2.moving){
							/*moveDroid(d2, d.x, d.y);
							moveDroid(d, d2.x, d2.y);
							sendDroid(d2, d.x, d.y, [d.x, d.y]);
							d2.tol = d.tol - 2;*/
							var path = misc.pathTo(d.x,d.y,d.targetX,d.targetY);
							if(!path && Math.random() > 0.8){
								sendDroid(d2, d.targetX, d.targetY, path);
								sendDroid(d, d2.targetX, d2.targetY);
								console.log('Paths exchanged')
							}else{
								sendDroid(d, d.targetX, d.targetY, path);
								d.tol = Math.round(Math.random() * -2);
							}
						}else{
							resetPath(d.id);
						}
					}else{
						resetPath(d.id);
					}
				}else {
					d.maxOffset = 0;
					d.dmg = false;
					d.tol++;
				}//console.log('tolling' + d.tol);
			}
		}else{
			ref = true;
		}
	}
	for(var i in factorious){
		var d = droids[factorious[i]];
		if(!d){
			factorious = factorious.filter((f) => f);
			continue;
		}
		if(d.tol <= 0){
			var factorized = false
			for(var i in misc.maze){
				var pos = misc.maze[i];
				var block = chunks.getBlock(d.x + pos[0], d.y + pos[1]);
				if(!block.u && block.i === 0){
					var droid = makeDroid(d.x + pos[0], d.y + pos[1], d.team);
					droid.adv = 1;
					d.tol = misc.cfg.factoringTime;
					factorized = true;
					break;
				}
			}
			if(!factorized)
				d.tol = 4;
		}else{
			d.tol--;
		}
	}
	for(var i = 0;i < progressive.length;i++){
		var d = droids[progressive[i]];
		if(d.tol <= 0){
			setType(d, d.metaMorph);
			d.hp = misc.spec[d.type].hp;
			d.tol = 0;
			teams[d.team].score += misc.spec[d.type].obtainScore;
			somethingHasChanged = true;
		}else{
			d.tol--;
		}
	}
	for(var i = 0;i < toTransform.length;i++){
		var trans = toTransform[i];
		console.log('trans iter');
		if(trans.d && trans.d.x === trans.x && trans.d.y === trans.y) {
			trans.done = transform(trans.d, trans.type);
			console.log('trans ver');
		}
		trans.timeout--;
	}
	toTransform = toTransform.filter((t) => {
		return t.done || t.timeout < 0 || !t.d ? undefined : t;
	});
	if(ref)moving = moving.filter((d) => d);
	if(attacks.length > 0){
		io.emit("attacks", attacks);
		attacks = [];
	}
	for(var i = 0; i < teams.length; i++){
		if(teams[i].logged)
			teams[i].s.emit("d",{r: getDroidsSeenByTeam(teams[i]), m: moving, d: deleted, load: cpuLoad});
	}
	deleted = [];
	cpuLoad = (Date.now() - then) / 5;
},500);
var iStart = Date.now();

function Team(id,u,p,r,g,b){
	this.id = id;
	this.r = r || Math.floor(Math.random() * 255);
	this.g = g || Math.floor(Math.random() * 255);
	this.b = b || Math.floor(Math.random() * 255);
	this.cdec = "rgb("+this.r+","+this.g+","+this.b+")";
	this.dcdec = "rgba("+this.r+","+this.g+","+this.b+",0.5)";
	this.u = u;
	this.p = p;
	this.logged = false;
	this.units = [];
	this.s = false;
	this.anihilated = true;
	this.temp = p === undefined;
	this.e = "";
	this.score = 0;
	this.highScore = 0;
}

function getTeamByUsername(name){
	for(var i = 0; i < teams.length; i++){
		if(teams[i].name === name)
			return teams[i];
	}
}

var teams = [
	new Team(0,"admin","admin",255,1,1),
	new Team(1),
];
var map = chunks.data.chunks;
var m = chunks.data.chunks;
var droids = [];
var factorious = [];
var progressive = [];
function Droid(x,y,team,type = 0){
	this.x = x;
	this.y = y;
	this.hp = 50;
	this.r = 0; // reload buffer
	this.path = [];
	this.adv = 0;
	this.lastX = 0;
	this.lastY = 0;
	this.metaMorph = 0; // droid type that will change to if building is finished
	this.moving = false;
	this.targetX = x;
	this.targetY = y;
	this.target = false;
	this.tol = 0;
	this.maxOffset = 0;
	this.team = team;
	this.dmg = false;
	this.id = droids.length;
	this.type = type;
	this.free = true;
	//this.wcd = 0;//walking cooldown
	if(type === 1)
		factorious.push(this.id);
	if(type === 4)
		progressive.push(this.id);
}
var setType = function(dis, type){
	if(dis.type !== type){
		switch(dis.type){
			case 1: {
				removeFactorious(dis);
			}break;
			case 4: {
				removeProgressive(dis);
			}break;
		}
		switch(type){
			case 1: {
				factorious.push(dis.id);
			}break;
			case 4: {
				progressive.push(dis.id);
			}break;
		}
		dis.type = type;
	}
};
function makeDroid(x, y, team, type){
	var droid = new Droid(x, y, team, type);
	for(var i = 0; i < droids.length; i++){
		if(!droids[i]) {
			droid.id = i;
			droids[i] = droid;
			return droid;
		}
	}
	moveDroid(droid, x, y);
	droids.push(droid);
	return droid;
}

function fixDroids(){
	var n = 0;
	eachDroid((i, d) => {
		if(!chunks.getBlock(d.x, d.y).u){
			console.log('ERROR');
			chunks.setBlockU(d.x, d.y, d);
		}
		if(i !== d.id){
			droids[i] = null;
			console.log(i + ' to ' + d.id);
			droids[d.id] = d;
			n++;
		}
	});
	if(n)console.log('fixed ' + n);
}

function removeFactorious(d){
	if(d.type === 1)
		factorious = factorious.filter(ad => ad === d.id ? undefined : ad);
}

function removeProgressive(d){
	if(d.type === 4)
		progressive = progressive.filter(ad => ad === d.id ? undefined : ad);
}

function transform(d, type){
	if(misc.checkPattern(d.x, d.y, type)){
		var xys = misc.getToRemove(d.x, d.y, type);
		for(var i = 0; i + 1 < xys.length; i += 2){
			delDroid(chunks.getBlock(xys[i], xys[i + 1]).u);
		}
		d.tol = misc.spec[type].transformTime;
		setType(d, 4); // type of droid that is under construction;
		d.metaMorph = type;
		d.hp = Math.floor(misc.spec[type].hp / 10);
		console.log('trans done');
		return true;
	}
}

var toTransform = [];
function requestTransform(d, x, y, type, preferredDroids){
	console.log('requesting transform');
	if(misc.canForm(x, y, type)){
		console.log('can form...');
		var xys = misc.getToRemove(x, y, type);
		var pid = 0;
		if(xys.length / 2 > preferredDroids.length)return false;
		var n = 0;
		for(var i = 0; i + 1 < xys.length; i += 2){
			while(preferredDroids[pid].type !== 0){
				pid++;
				if(pid > preferredDroids.length)return false;
			}
			var droid = preferredDroids[pid];
			sendDroid(droid, xys[i], xys[i + 1]);
			n++;
			pid++;
		}
		sendDroid(d, x, y);
		toTransform.push({d: d, x: x, y: y, type: type, timeout: 200});
		console.log('req done ' + n);
	}
}

var deleted = [];
function delDroid(d){
	if(d){
		if(d.moving)
			delete moving[moving.indexOf(d)];
		deleted.push({i: d.id, x: d.x, y: d.y});
		var t = d.team;
		var anihilated = true;
		var lastIter = -1;
		var now = Date.now();
		eachDroid((i, d2) => {
			if(anihilated && d2 !== d && (d2.team === t))anihilated = false;
			if(d2.target === d.id){
				d2.target = false;
				if(d2.adv || d2.type === 2){
					if(lastIter > -1){
						var d3 = droids[lastIter];
						if(misc.dist(d.x - d3.x, d.y - d3.y) <= 5 || misc.dist(d3.x - d.x, d3.y - d.y) <= 5){
							sendDroid(d2, d3.x, d3.y, [d2.x, d2.y],  d3.id);
						}
					}
					eachDroid((i, d3) => {
						if(d3.team === t && d3 !== d && (misc.dist(d.x - d3.x, d.y - d3.y) <= 5 || misc.dist(d3.x - d.x, d3.y - d.y) <= 5)){
							sendDroid(d2, d3.x, d3.y, [d2.x, d2.y],  d3.id);
							lastIter = i;
							return true;
						}
					});
				}
				d2.free = true;
			}
		});
		var time = Date.now() - now;
		console.log('Finding took ' + time + 'ms');
		chunks.setBlockU(d.x, d.y);
		if(anihilated){
			var team = teams[t];
			if(team.logged && team.s){
				team.s.emit("err",{msg: "Your army was destroyed!"});
				team.s._id = -1;
			}
			team.logged = false;
			team.anihilated = true;
			io.emit("big_msg",team.u + " was annihilated.");
			if(!team.temp)team.highScore = team.score;
			team.score = 0;
		}
		delete droids[d.id];
		fixDroids();
	}
}

var attacks = [];
function attack(d1,d2){
	if(misc.spec[d1.type || 0].canShot)
	if(d1.r === 0){
		if(d2.hp <= 0){
			delDroid(d2);
			return false;
		}
		d1.r = d1.type === 2 ? 2 : 4;
		d2.hp -= d1.type === 2 ? 10 : 5;
		d2.dmg = true;
		attacks.push(d1.id, d2.id);
		if(d2.hp <= 0){
			teams[d1.team].score += misc.spec[d2.type].score;
			somethingHasChanged = true;
			delDroid(d2);
			return false;
		}else if(d2.free && !d2.target){
			sendDroid(d2, d1.x, d1.y, [d2.x, d2.y], d1.id);
			if(d2.adv || d2.type === 2){// call other advanced droids
				var now = Date.now();
				eachDroid((i, d) => {
					if(d.team === d2.team && d.free && (d.adv || d.type === 2) && misc.dist(d2.x - d.x, d2.y - d.y) <= 5){
						sendDroid(d, d1.x, d1.y, [d2.x, d2.y], d1.id);
					}
				});
				var time = Date.now() - now;
				console.log('Calling took ' + time + 'ms');
			}
		}
	}else{
		d1.r--;
	}
}

function movedAlongChunk(droid){
	return chunks.getChunk(droid.x, droid.y) !== chunks.getChunk(droid.lastX, droid.lastY);
}

var somethingHasChanged = false;
function updateHighScores(){
	if(somethingHasChanged){
		var bests = [];
		var sorted = teams.slice(0).sort((a,b) => {
			return b.score - a.score;
		}).slice(0,10);
		for(var i in sorted){
			bests.push({
				name: sorted[i].u,
				score: sorted[i].score,
			})
		}
		io.emit('highScores', bests);
		somethingHasChanged = false;
	}
}
setInterval(updateHighScores, 30000);

function prepareTeams(){
	var toSend = [];
	for(var i = 0;i < teams.length;i++){
		var t = teams[i];
		toSend.push({id: t.id, r: t.r, g: t.g, b: t.b, cdec: t.cdec, dcdec: t.dcdec, logged: t.logged, anihilated: t.anihilated, u: t.u, t: t.temp});
	}
	return toSend;
}

function killDroids(id){
	eachDroid((i, d) => {
		if(d.team === id)delDroid(d);
	})
}

function from32ToBin(mapStr){
	var strBin = '';
	if(!mapStr)return '';
	for(var i = 0;i < mapStr.length;i++){
		var part = parseInt(mapStr[i],32).toString(2)
		strBin += "0".repeat(5 - part.length) + parseInt(mapStr[i],32).toString(2);
	}
	return strBin;
}

function fromBinTo32(strBin){
	var dataCompressed = "";
	for(var i = 0;i < strBin.length;i+=5){
		var bins = strBin.slice(i,i + 5);
		dataCompressed += parseInt(bins,2).toString(32);
	}
	return dataCompressed;
}

function newSave(){
	//console.log("Saving data skipped.");
	//return false;
	console.log("Saving data...");
	var encodedChunks = {};
	for(var i in chunks.data.chunks){
		var chunk = chunks.data.chunks[i].t;
		var strBin = "";
		for(var x = 0;x < 32;x++){
			for(var y = 0;y < 32;y++){
				strBin += chunk[x][y].i ? "1" : "0";
			}
		}
		encodedChunks[i] = fromBinTo32(strBin);
	}
	var tmp = [];
	for(var i = 0;i < teams.length;i++){
		var d = teams[i];
		tmp.push(teams[i].s);
		delete teams[i].s;
	}
	var data = {
		map: encodedChunks,
		droids: droids,
		teams: teams,
	}
	req({
	  uri: "http://luatomcutils.cba.pl/wod.php",
	  method: "POST",
	  timeout: 10000,
	  form: {
		data: JSON.stringify(data),
		password: "01h0fiq0e8r9urjnvlmzmvpwoqr910",
	  },
	}, function(error, response, body) {
		if(error){
			console.log("Saving data failed. Next try in 60 seconds.");
			setTimeout(function(){newSave()},60000);
		}else{
			if(body.indexOf("Data save complete") !== -1){
				console.log("Data save is successful.");
			}else{
				console.log("Saving data failed. Server responded with status of: "+response.code);
			}
		}
	});
	for(var i = 0;i < teams.length;i++){
		teams[i].s = tmp[i];
	}
}

function newLoad(){
	req({
	  uri: "http://luatomcutils.cba.pl/data.txt",
	  method: "GET",
	  timeout: 15000,
	}, function(error, response, body) {
		if(error){
			console.log("Loading data failed. Next try in 30 seconds.");
			setTimeout(function(){newSave()},30000);
		}else{
			var data = JSON.parse(body);
			droids = data.droids;
			chunks.init();
			m = map;
			var mapStr = data.map;
			if(typeof data.map == 'string'){ // old map type
				console.log("Got old map data. Making a new one.");
				setTimeout(function(){newSave()},30000);
			}else{
				for(var i in mapStr){
					var rawChunk = mapStr[i];
					var chunkData = from32ToBin(rawChunk);
					chunks.data.chunks[i] = {t: [], g: true, c: false};
					var chunk = chunks.data.chunks[i].t;
					var n = 0;
					for(var x = 0; x < 32; x++){
						chunk[x] = [];
						for(var y = 0; y < 32; y++){
							chunk[x][y] = {i: parseInt(chunkData[n++])};
						}
					}
				}
			}
			moving = [];
			teams = data.teams;
			for(var i = 0;i < teams.length;i++){
				teams[i].anihilated = true;
				if(!teams[i].score)teams[i].score = 0;
				if(!teams[i].highScore)teams[i].highScore = 0;
			}
			eachDroid((i, d) => {
				d.x = parseInt(d.x);
				d.y = parseInt(d.y);
				if(d.moving){
					if(misc.spec[d.type].canMove)
						moving.push(d);
					else
						d.moving = false;
				}
				// chunks.setBlockU(d.x, d.y, d);
				if(teams[d.team].anihilated)teams[d.team].anihilated = false;
				if(d.type === undefined)d.type = 0;
				switch(d.type){
					case 1: {
						factorious.push(d.id);
					}break;
					case 4: {
						progressive.push(d.id);
					}break;
				}
				d.free = true;
				if(d.lastX === 0 && d.lastY === 0){
					delDroid(d);
					console.log('fake droid');
				}
			});
			fixDroids();
			console.log("Map loaded");
		}
	});
}

var chat = {
	
	buffer: [],
	send: function(evt){
		
		var evt = evt;
		evt.rank = teams[evt.id].temp;
		this.buffer.push(evt);
		if(this.buffer.length > 20)this.buffer.shift();
		return io.emit("msg", evt);
	},
};

function getChunksOfTeam(objTeam, compObj = {}){
	var chunkz = {};
	var team = objTeam.id;
	eachDroid((i, d) => {
		if(d.team === team){
			for(var x = -32; x <= 32; x += 32) {
				for (var y = -32; y <= 32; y += 32) {
					var chunkId = chunks.getChunk(d.x + x, d.y + y)
					if (!(chunkId in chunkz) && !(chunkId in compObj))
						chunkz[chunkId] = true;
				}
			}
		}
	})
	return chunkz
}

function getDroidsSeenByTeam(objTeam){
	var chunksTeam = getChunksOfTeam(objTeam);
	var seenDroids = [];
	var assigned = [];
	eachDroid((i, d) => {
		var chunkId = chunks.getChunk(d.x, d.y);
		if(chunkId in chunksTeam && !assigned[d.id]){
			seenDroids.push(d);
			assigned[d.id] = true;
		}
	});
	return seenDroids;
}

function getFreshChunks(objTeam){
	var toSend = getChunksOfTeam(objTeam, objTeam.sentChunks);
	for(var chunk in toSend){
		objTeam.sentChunks[chunk] = true;
		if(!chunks.data.chunks[chunk]) {
			var r = chunk.split(',');
			chunks.genChunk(r[0],r[1]);
		}
		toSend[chunk] = {};
		toSend[chunk].t = chunks.data.chunks[chunk].t.map(function (x) {
			for (var i = 0; i < x.length; i++) {
				delete x[i].u;
			}
			;
			return x;
		})
		toSend[chunk].g = true;
		toSend[chunk].c = false;
	}
	return toSend;
}

function sendFreshChunks(objTeam){
	if(objTeam.logged)objTeam.s.emit('chunks', getFreshChunks(objTeam));
};

function init(){
	
	newLoad();
	io.on('connection',function(s){
		s.on('login',function(msg){
			if(this._id == -1 && typeof msg == "object"){
				var u = msg.u || "";
				var p = msg.p || "";
				var exists = false;
				for(var i = 0;i < teams.length;i++){
					if(teams[i].u == u){
						if(teams[i].p != p && !teams[i].temp){
							this.emit("err",{msg: p == "" ? "Password needed" : "Wrong password"});
						}else if(teams[i].logged){
							//already in the game
							console.log(teams[i].u + " tried to log in.");
							return;
						}else{
							this._id = i;
							teams[i].logged = true;
							teams[i].s = this;
							teams[i].sentChunks = {};
							if(teams[i].anihilated){//make new army while destroyed
								console.log('respawning');
								var rx = 5 + Math.round(Math.random() * 90);
								var ry = 5 + Math.round(Math.random() * 90);
								for(var j = 0;j < 10;j++){
									do{
										var x = rx + Math.round(Math.random() * 10);
										var y = ry + Math.round(Math.random() * 10);
										var done = false;
										var block = chunks.getBlock(x, y);
										if((x < 100) && (y < 100) && (x >= 0) && (y >= 0) && (block.i == 0) && (!block.u)){
											done = true;
											makeDroid(x,y,i);
										};
									}while(!done);
								};
								teams[i].anihilated = false;
							};
							console.log(teams[i].u + " logged in, id: " + this._id);
							this.emit("map",{m: getFreshChunks(teams[i]),t: prepareTeams(),i: i,c: chat.buffer});
							fixDroids();
							
							this.on('disconnect',function(err){
								if(this._id > -1){
									console.log(teams[this._id].u + " disconnected. Reason: "+err);
									teams[this._id].logged = false;
									if(teams[this._id].temp)killDroids(this._id);
									this._id = -1;
									//var evt = {user: this.username.toString()};
									//io.emit('bye',evt);
									//chat.buffer.push({m: 'bye', e: evt});
									for(var i = 0;i < teams.length;i++){
										if(teams[i].logged)return false;
									};
									newSave();
								}else{
									console.log("A user disconnected.  Reason: "+err);
								};
								//console.log();
							});
							
							this.on('action',function(msg){//object with array of droids ids and targets coordinates i,x,y + target id {d:[],i: Int}
								for(var i = 0;i < msg.d.length;i++){
									var d = droids[msg.d[i].i];
									if(d && (d.team === this._id)){//valid team?
										if(misc.spec[d.type || 0].canMove) {
											d.free = false;
											sendDroid(d,msg.d[i].x,msg.d[i].y, undefined, msg.i);
										}
									}else if(d){
										console.log("Invalid team: found: ",d.team,", expected ",this._id);
									}
								}
							});

							this.on('transform',function(data){
								var d = droids[data.d];
								console.log('Got transform request.');
								if(!d)
									console.log('Vno droid');
								else if(d.team !== this._id)
									console.log('no team');
								else if(d.type !== 0)console.log('no type');
								else requestTransform(d, data.x, data.y, data.type, data.preferredDroids.map((id) => {
									var ad = droids[id];
									return ad.team === d.team ? ad : undefined;
								}).filter((ad) => ad.id === d.id ? undefined : ad));
							});
							
							this.on('cmd',function(cmd){
								var arr = cmd.split(" ");
								if(this._id === 0){//verify op
									switch(arr[0]){
										case "remap":{
											chunks.init();
											m = map;
											for(var i = 0;i < teams.length;i++){
												if(teams[i].logged){
													teams[i].logged = false;
												}
											}
											io.emit("err",{msg: "Kicked"});
											chat.send({id: -1, msg: "Server map restart.", type: "server"});
											//newSave();
										}break;
										case "close":{
											io.emit("err",{msg: "Server closed."});
											process.exit(0);
										}break;
										case "kick":{
											var team = getTeamByUsername(arr[1]);
											if(team && team.logged)
												team.s.emit("err",{msg: "Kicked"});
										}break;
										case "help":{
											this.emit("msg",{id: this._id, msg: "Admin commands: /remap /close /kick <player>", type: "console"});
										}break;
										case "console":{
											this.emit("msg",{id: this._id, msg: eval(arr.slice(1).join(" ")), type: "console"});
										}
									}
								}
								switch(arr[0]){
									case "msg":{
										var name = arr[1];
										for(var i = 0;i < teams.length;i++){
											if(teams[i].u == name){
												this.emit("msg",{id: teams[i].id, msg: arr.slice(2).join(" "),type: "bprivate"})
												return teams[i].s.emit("msg",{id: this._id, msg: arr.slice(2).join(" "), type: "private"});
											};
										};
										//teams({id: this._id, msg:})
									};break;
									case "ping":{
										this.emit("msg",{id: this._id, msg: "Pong!", type: "console"});
									};break;
									case "help":{
										this.emit("msg",{id: this._id, msg: "Commands: /help, /ping, /msg <player> <message>", type: "console"});
									};break;
								};
							});
							
							this.on('msg',function(msg){
								if(this._id > -1){
									var evt = {id: this._id, msg: msg, type: "msg"};
									chat.send(evt);
								};
							});
							
							if(!teams[i].p)
							this.on('register',function(set){
								var pate = /.+@.+\..+/;
								if(!pate.test(set.e))return this.emit("err",{msg: "Invalid email"});
								for(var j = 0;j < teams.length;j++){
									if((teams[j].u == set.u) || ((teams[j].e || "") == set.e)){
										if(this._id !== j){
											return this.emit("err",{msg: "Same email or nickname exists"});
										};
									};
								};
								var dac = teams[this._id];
								dac.u = set.u;
								dac.p = set.p;
								dac.e = set.e;
								dac.temp = false;
								this.emit("err",{msg: "Register_done"});
								console.log('Somebody has just registered yay');
							});

							updateHighScores();
							
							return true;
							break;
						};
						return false
					};
				};
				var newId = teams.length;
				teams.push(new Team(newId,u));
				//newSave();
				this.emit("err",{msg: "Temporary account created"});
				this.broadcast.emit("teams",prepareTeams());
			};
		});
		s._id = -1;
		console.log("A user connected.");
	});
};
init();

http.listen(PORT, function(){ //nasluchuje
  console.log('listening on *:' + PORT);
});