var fs = require('fs');
var express = require('express');
var app = express(); //buduje serwer http - nmp install --save express@4.15.2
var http = require('http').Server(app);
var io = require('socket.io')(http); //bilbio do socketa - nmp install --save socket.io
var url = require('url');
var req = require('request');
const PORT = process.env.PORT || 3000;

app.use(express.static('htdocs'));

//app.get('/', function(req, res){ //ładuje index.html zamiast domyślnie
	//console.log(JSON.stringify(req));
 // res.sendFile(__dirname + '/htdocs/' + req.url);
//});
var moving = [];
var cpuLoad = 0;
var inter = setInterval(function(){
	var then = Date.now();
	var ref = false;
	for(var i = 0;i < moving.length;i++){
		var d = moving[i];
		if(d !== undefined){
			var p = d.path;
			if(p.length == 0){
				delete moving[i];
				ref = true;
				d.moving = false;
				d.maxOffset = 0;
				d.dmg = false;
			}else if(p && (m[p[0]][p[1]].u == null)){
				var target = droids[d.target];
				if(target && (dist(d.x - target.x,d.y - target.y) <= 5)){
					attack(d,target);
					d.maxOffset = 0;
				}else{
					m[d.x][d.y].u = null;
					d.lastX = d.x;
					d.lastY = d.y;
					d.x = p[0];
					d.y = p[1];
					m[d.x][d.y].u = d;
					p.shift();
					p.shift();
					//d.moving = true;
					d.tol = 0;
					d.maxOffset = 1;
					d.dmg = false;
				};
			}else{
				if(d.tol >= 1){
					d.path = pathTo(d.x,d.y,d.targetX,d.targetY);
					d.tol = Math.round(Math.random() * -2);
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
	io.emit("d",{r: droids, m: moving, d: deleted, load: cpuLoad});
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
var teams = [
	new Team(0,"admin","admin",255,1,1),
	new Team(1),
];
var map = [];
function Map(x,y){
	this.map = new Array(x);
	for(var i = 0;i < x;i++){
		this.map[i] = new Array(y);
		for(var j = 0;j < y;j++){
			this.map[i][j] = {t: Math.random() > 0.0625 ? 0 : 1,u: null};
		};
	};
};
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
	m[x][y].u = this;
};

var deleted = [];
function delDroid(d){
	if(d){
		if(d.moving)
		for(var i = 0;i < moving.length;i++){
			if(moving[i] == d)delete moving[i];
		};
		deleted.push(d.id);
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
		m[d.x][d.y].u = null;
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
};
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

function prepareTeams(){
	var toSend = [];
	for(var i = 0;i < teams.length;i++){
		var t = teams[i];
		toSend.push({id: t.id, r: t.r, g: t.g, b: t.b, cdec: t.cdec, dcdec: t.dcdec, logged: t.logged, anihilated: t.anihilated, u: t.u});
	};
	return toSend;
};

function newSave(){
	//console.log("Saving data skipped.");
	//return false;
	console.log("Saving data...");
	var strBin = "";
	for(var i = 0;i < m.length;i++){
		for(var j = 0;j < m[i].length;j++){
			strBin += m[i][j].t ? "1" : "0";
		};
	};
	//console.log("Binary length: "+strBin.length);
	var dataCompressed = "";
	for(var i = 0;i < strBin.length;i+=5){
		var bins = strBin.slice(i,i + 5);
		dataCompressed += parseInt(bins,2).toString(32);
	};
	//console.log("Compressed data length: "+dataCompressed.length);
	var tmp = [];
	for(var i = 0;i < teams.length;i++){
		var d = teams[i];
		tmp.push(teams[i].s);
		delete teams[i].s;
	};
	var data = {
		map: dataCompressed,
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
			map = new Map(100,100);
			m = map.map;
			var strBin = "";
			var mapStr = data.map;
			//console.log("Map size: "+mapStr.length);
			for(var i = 0;i < mapStr.length;i++){
				var part = parseInt(mapStr[i],32).toString(2)
				strBin += "0".repeat(5 - part.length) + parseInt(mapStr[i],32).toString(2);
			};
			var it = 0;
			//console.log("Binary size: "+strBin.length);
			for(var i = 0;i < m.length;i++){
				for(var j = 0;j < m[i].length;j++){
					m[i][j].t = parseInt(strBin[it]);
					it++;
				};
			};
			moving = [];
			droids = data.droids.filter(function(a){if(a.hp){return a}else{m[a.x][a.y].u = null}});
			teams = data.teams;
			for(var i = 0;i < teams.length;i++){
				teams[i].anihilated = true;
			};
			for(var i = 0;i < droids.length;i++){
				var d = droids[i];
				m[d.x][d.y].u = d;
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

function save(){
	for(var i = 0;i < m.length;i++){
		for(var j = 0;j < m[i].length;j++){
			m[i][j].u = null;
		};
	};
	fs.writeFile("data/map.dat",JSON.stringify(m),function(err){
		if(err)throw err;
		console.log("Map saved");
	});
	fs.writeFile("data/droids.dat",JSON.stringify(droids),function(err){
		if(err)throw err;
		console.log("Units saved");
	});
	for(var i = 0;i < droids.length;i++){
		var d = droids[i];
		m[d.x][d.y].u = d;
	};
	var tmp = [];
	for(var i = 0;i < teams.length;i++){
		var d = teams[i];
		tmp.push(teams[i].s);
		delete teams[i].s;
	};
	fs.writeFile("data/teams.dat",JSON.stringify(teams),function(err){
		if(err)throw err;
		console.log("Accounts saved");
	});
	for(var i = 0;i < teams.length;i++){
		teams[i].s = tmp[i];
	};
};

function load(){
	try{
		fs.accessSync("data");
	}catch(err){
		fs.mkdirSync("data");
	};
	fs.access("data/accounts", fs.constants.F_OK, (err) => {
		if(err){
			fs.mkdirSync("data/accounts");
		};
		fs.readFile("data/map.dat", (err,data) => {
			if(err || !data || (data.length < 1)){
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
				save();
			}else{
				m = JSON.parse(data);
				moving = [];
				fs.readFile("data/droids.dat", (err,data) => {
					if(err)throw err;
					droids = JSON.parse(data).filter(function(a){if(a.hp){return a}else{m[a.x][a.y].u = null}});
					fs.readFile("data/teams.dat", (err,data) => {
						if(err)throw err;
						teams = JSON.parse(data);
						for(var i = 0;i < teams.length;i++){
							teams[i].anihilated = true;
						};
						for(var i = 0;i < droids.length;i++){
							var d = droids[i];
							m[d.x][d.y].u = d;
							if(d.moving){
								moving.push(d);
							};
							if(teams[d.team].anihilated)teams[d.team].anihilated = false;
							if(d.type == undefined)d.type = 0;
						};
						console.log("Map loaded");
					});
				});
			};
		});
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

var m = [];
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
						if(teams[i].p == p || teams[i].temp){
							if(teams[i].logged){
								//already in the game
								console.log(teams[i].u + " tried to log in.");
								return;
							}else{
								this._id = i;
								teams[i].logged = true;
								teams[i].s = this;
								if(teams[i].anihilated){//make new army while destroyed
									var rx = 5 + Math.round(Math.random() * 90);
									var ry = 5 + Math.round(Math.random() * 90);
									for(var j = 0;j < 10;j++){
										do{
											var x = rx + Math.round(Math.random() * 10);
											var y = ry + Math.round(Math.random() * 10);
											var done = false;
											if((x < 100) && (y < 100) && (x >= 0) && (y >= 0) && (m[x][y].t == 0) && (m[x][y].u == null)){
												done = true;
												droids.push(new Droid(x,y,i));
											};
										}while(!done);
									};
									teams[i].anihilated = false;
								};
								console.log(teams[i].u + " logged in, id: " + this._id);
								this.emit("map",{m: m,t: prepareTeams(),i: i,c: chat.buffer});
								
								this.on('disconnect',function(err){
									if(this._id > -1){
										console.log(teams[this._id].u + " disconnected. Reason: "+err);
										teams[this._id].logged = false;
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
												var map = new Map(100,100);
												m = map.map;
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
												
											};break;
										};
									};
									switch(arr[0]){
										case "msg":{
											var name = arr[1];
											for(var i = 0;i < teams.length;i++){
												if(teams[i].u == name){
													this.emit("msg",{id: teams[i].id, msg: arr.slice(2).join(" "),type: "bprivate"})
													return teams.s.emit("msg",{id: this._id, msg: arr.slice(2).join(" "), type: "privete"});
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
									this.emit("err",{msg: "Register_done"});
								});
								
								return true;
								break;
							};
						}else{
							this.emit("err",{msg: p == "" ? "Password needed" : "Wrong password"});
						}
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