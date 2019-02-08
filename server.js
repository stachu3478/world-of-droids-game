var fs = require('fs');
var express = require('express');
var app = express(); //buduje serwer http - nmp install --save express@4.15.2
var http = require('http').Server(app);
var io = require('socket.io')(http); //bilbio do socketa - nmp install --save socket.io
var url = require('url');
var req = require('request');
const PORT = process.env.PORT || 3000;

var chunks = require('./chunks.js').terrain;

app.use(express.static('htdocs'));

var moving = [];
var cpuLoad = 0;

function resetPath(id){
	var d = droids[id];
	d.path = pathTo(d.x,d.y,d.targetX,d.targetY);
	d.tol = Math.round(Math.random() * -2);
};

var inter = setInterval(function(){
	var then = Date.now();
	var ref = false;
	for(var i = 0;i < moving.length;i++){
		var d = moving[i];
		if(d !== undefined){
			var p = d.path;
			var block;
			if(p && p.length == 0){
				delete moving[i];
				ref = true;
				d.moving = false;
				d.maxOffset = 0;
				d.dmg = false;
			}else if(p && ((block = chunks.getBlock(p[0], p[1])).u == null) && block.i == 0){
				var target = droids[d.target];
				if(target && (dist(d.x - target.x,d.y - target.y) <= 5)){
					attack(d,target);
					d.maxOffset = 0;
				}else{
					chunks.setBlockU(d.x, d.y, null)
					d.lastX = d.x;
					d.lastY = d.y;
					d.x = p[0];
					d.y = p[1];
					chunks.setBlockU(d.x, d.y, d)
					p.shift();
					p.shift();
					//d.moving = true;
					d.tol = Math.floor(Math.random());
					d.maxOffset = 1;
					d.dmg = false;
					if(movedAlongChunk(d))sendFreshChunks(teams[d.team]);
				};
			}else{
				if(d.tol >= 2){
					var d2;
					if(p){
						var d2 = chunks.getBlock(p[0], p[1]).u;
						if(d2){
							var path = pathTo(d.x,d.y,d.targetX,d.targetY);
							if(!path && Math.random() > 0.9){
								if(!d2.moving){
									d2.moving = true;
									moving.push(d2);
								};
								d2.path = d.path;
								d.path = pathTo(d2.x,d2.y,d2.targetX,d2.targetY);
								console.log('Paths exchanged')
							}else{
								d.path = path;
								d.tol = Math.round(Math.random() * -2);
							};
							//};
						}else{
							resetPath(d.id);
						};
					}else{
						resetPath(d.id);
					};
				};
				d.maxOffset = 0;
				d.dmg = false;
				d.tol++;
			};
		}else{
			ref = true;
		};
	};
	if(ref)moving = moving.filter(function(a){if(a && (a.hp > 0))return a});
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
	this.temp = p == undefined;
	this.e = "";
};

function getTeamByUsername(name){
	for(var i = 0; i < teams.length; i++){
		if(teams[i].name == name)
			return teams[i];
	}
};

var teams = [
	new Team(0,"admin","admin",255,1,1),
	new Team(1),
];
var map = chunks.data.chunks;
var m = chunks.data.chunks;
var droids = [];
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
	this.id = droids.length;
	this.type = 0;
	//this.wcd = 0;//walking cooldown
	chunks.setBlockU(x, y, this);
};

var deleted = [];
function delDroid(d){
	if(d){
		if(d.moving)
		for(var i = 0;i < moving.length;i++){
			if(moving[i] == d)delete moving[i];
		};
		deleted.push({i: d.id, x: d.x, y: d.y});
		var t = d.team;
		var anihilated = true;
		droids[d.id] = null;
		droids = droids.filter(function(a){return a}); //add hp condition if possible
		for(var i = 0;i < droids.length;i++){
			var d2 = droids[i];
			if(d2.id > d.id)d2.id--;
			if(d2.target == d.id){
				d2.target = false;
			}else if(d2.target > d.id)d2.target--;
			if(anihilated && (d2.team == t))anihilated = false;
		};
		chunks.setBlockU(d.x, d.y, null)
		if(anihilated){
			if(teams[t].logged && teams[t].s){
				teams[t].s.emit("err",{msg: "Your army was destroyed!"});
				teams[t].s._id = -1;
			};
			teams[t].logged = false;
			teams[t].anihilated = true;
			io.emit("big_msg",teams[t].u + " was annihilated.");
		};
	};
}

var attacks = [];
function attack(d1,d2){
	if(d1.r == 0){
		if(d2.hp <= 0){
			delDroid(d2);
			d1.target = false;
			return false;
		};
		d1.r = 4;
		d2.hp -= 5;
		d2.dmg = true;
		attacks.push(d1.id, d2.id);
		if(d2.hp <= 0){
			delDroid(d2);
			d1.target = false;
			return true;
		}else if(!d2.target && !d2.moving){
			d2.target = d1.id;
			d2.targetX = d1.x;
			d2.targetY = d1.y;
			d2.path = pathTo(d2.x,d2.y,d1.x,d1.y);
			moving.push(d2);
			d2.moving = true;
		};
	}else{
		d1.r--;
	};
};

function dist(x12,y12){
	return Math.sqrt(x12 * x12 + y12 * y12);
}
function pathTo(x1,y1,x2,y2){
	if(chunks.getBlock(x2, y2).i == 0 && (Math.abs(x1 - x2) < 2) && Math.abs(y1 - y2) < 2 && Math.abs(x1 - x2 + y1 - y2) < 2)return [x2,y2];
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
			var b1 = chunks.getBlock(d1, y);
			if(c1 && b1 && b1.i == 0 && b1.u == null && pm[d1][y] == 0){
				if(d1 == x2 && y == y2){
					done = true;
					break;
				}else{
					arr1.push(d1,y);
					pm[d1][y] = step;
					failed = false;
				};
			};
			var b2 = chunks.getBlock(d2, y);
			if(c2 && b2 && b2.i == 0 && b2.u == null && pm[d2][y] == 0){
				if(d2 == x2 && y == y2){
					done = true;
					break;
				}else{
					arr1.push(d2,y);
					pm[d2][y] = step;
					failed = false;
				};
			};
			var b3 = chunks.getBlock(x, d3);
			if(c3 && b3 && b3.i == 0 && b3.u == null && pm[x][d3] == 0){
				if(x == x2 && d3 == y2){
					done = true;
					break;
				}else{
					arr1.push(x,d3);
					pm[x][d3] = step;
					failed = false;
				};
			};
			var b4 = chunks.getBlock(x, d4);
			if(c4 && b4 && b4.i == 0 && b4.u == null && pm[x][d4] == 0){
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
		if(min == 1){ // ended finding path
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
	return false;
}

function movedAlongChunk(droid){
	return chunks.getChunk(droid.x, droid.y) !== chunks.getChunk(droid.lastX, droid.lastY);
}

function prepareTeams(){
	var toSend = [];
	for(var i = 0;i < teams.length;i++){
		var t = teams[i];
		toSend.push({id: t.id, r: t.r, g: t.g, b: t.b, cdec: t.cdec, dcdec: t.dcdec, logged: t.logged, anihilated: t.anihilated, u: t.u, t: t.temp});
	};
	return toSend;
};

function killDroids(id){
	for(var i = droids.length - 1; i > 0;i--){
		if(droids[i].team == id)delDroid(droids[i]);
	};
};

function from32ToBin(mapStr){
	var strBin = '';
	for(var i = 0;i < mapStr.length;i++){
		var part = parseInt(mapStr[i],32).toString(2)
		strBin += "0".repeat(5 - part.length) + parseInt(mapStr[i],32).toString(2);
	};
	return strBin;
}

function fromBinTo32(strBin){
	var dataCompressed = "";
	for(var i = 0;i < strBin.length;i+=5){
		var bins = strBin.slice(i,i + 5);
		dataCompressed += parseInt(bins,2).toString(32);
	};
	return dataCompressed;
}

function newSave(){
	//console.log("Saving data skipped.");
	//return false;
	console.log("Saving data...");
	var encodedChunks = {};
	for(var i = 0;i < m.length;i++){
		var chunk = m[i];
		var strBin = "";
		for(var x = 0;x < chunk.length;x++){
			for(var y = 0;y < chunk[x].length;y++){
				strBin += chunk[x][y].i ? "1" : "0";
			};
		};
		encodedChunks[i] = fromBinTo32(strBin);
	};
	var tmp = [];
	for(var i = 0;i < teams.length;i++){
		var d = teams[i];
		tmp.push(teams[i].s);
		delete teams[i].s;
	};
	var data = {
		map: encodedChunks,
		droids: droids,
		teams: teams,
	};
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
			};
		};
	});
	for(var i = 0;i < teams.length;i++){
		teams[i].s = tmp[i];
	};
};

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
			chunks.init();
			m = map;
			var mapStr = data.map;
			if(typeof data.map == 'string'){ // old map type
				console.log("Got old map data. Making a new one.");
				setTimeout(function(){newSave()},30000);
			}else{
				for(var i in mapStr){
					var rawChunk = mapStr[i];
					var chunkData = from32ToBin(rawChunk.data);
					chunks.data.chunks[i] = [];
					var chunk = chunk.data.chunks[i];
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
			droids = data.droids.filter(function(a){if(a.hp){return a}else{m[a.x][a.y].u = null}});
			teams = data.teams;
			for(var i = 0;i < teams.length;i++){
				teams[i].anihilated = true;
			};
			for(var i = 0;i < droids.length;i++){
				var d = droids[i];
				chunks.setBlockU(d.x, d.y, d)
				if(d.moving){
					moving.push(d);
				};
				if(teams[d.team].anihilated)teams[d.team].anihilated = false;
				if(d.type == undefined)d.type = 0;
			};
			console.log("Map loaded");
		};
	});
};

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
	for(var i = 0; i < droids.length; i++){
		var d = droids[i];
		if(d.team == team){
			for(var x = -32; x <= 32; x += 32) {
				for (var y = -32; y <= 32; y += 32) {
					var chunkId = chunks.getChunk(d.x + x, d.y + y)
					if (!(chunkId in chunkz) && !(chunkId in compObj))
						chunkz[chunkId] = true;
				}
			}
		}
	};
	return chunkz
}

function getDroidsSeenByTeam(objTeam){
	var chunksTeam = getChunksOfTeam(objTeam);
	var seenDroids = [];
	for(var i = 0; i < droids.length; i++){
		var d = droids[i];
		var chunkId = chunks.getChunk(d.x, d.y);
		if(chunkId in chunksTeam)
			seenDroids.push(d)
	}
	return seenDroids;
}

function getFreshChunks(objTeam){
	var toSend = getChunksOfTeam(objTeam, objTeam.sentChunks);
	for(var chunk in toSend){
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
								var rx = 5 + Math.round(Math.random() * 90);
								var ry = 5 + Math.round(Math.random() * 90);
								for(var j = 0;j < 10;j++){
									do{
										var x = rx + Math.round(Math.random() * 10);
										var y = ry + Math.round(Math.random() * 10);
										var done = false;
										var block = chunks.getBlock(x, y);
										if((x < 100) && (y < 100) && (x >= 0) && (y >= 0) && (block.i == 0) && (block.u == null)){
											done = true;
											droids.push(new Droid(x,y,i));
										};
									}while(!done);
								};
								teams[i].anihilated = false;
							};
							console.log(teams[i].u + " logged in, id: " + this._id);
							this.emit("map",{m: getFreshChunks(teams[i]),t: prepareTeams(),i: i,c: chat.buffer});
							
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
									if(d && (d.team == this._id)){//valid team?
										if(!d.moving){
											moving.push(d);
											d.moving = true;
										};
										d.path = pathTo(d.x,d.y,msg.d[i].x,msg.d[i].y);
										d.targetX = msg.d[i].x;
										d.targetY = msg.d[i].y;
										d.target = msg.i;
									}else if(d){
										console.log("Invalid team: found: ",d.team,", expected ",this._id);
									};
								};
							});
							
							this.on('cmd',function(cmd){
								var arr = cmd.split(" ");
								if(this._id == 0){//verify op
									switch(arr[0]){
										case "remap":{
											chunks.init();
											m = map;
											for(var i = 0;i < teams.length;i++){
												if(teams[i].logged){
													teams[i].logged = false;
												};
											};
											io.emit("err",{msg: "Kicked"});
											chat.send({id: -1, msg: "Server map restart.", type: "server"});
											//newSave();
										};break;
										case "close":{
											io.emit("err",{msg: "Server closed."});
											process.exit(0);
										};break;
										case "kick":{
											var team = getTeamByUsername(arr[1]);
											if(team && team.logged)
												team.s.emit("err",{msg: "Kicked"});
										};break;
										case "help":{
											this.emit("msg",{id: this._id, msg: "Admin commands: /remap /close /kick <player>", type: "console"});
										};break;
										case "console":{
											this.emit("msg",{id: this._id, msg: eval(arr.slice(1).join(" ")), type: "console"});
										}
									};
								};
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