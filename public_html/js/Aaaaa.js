var WS_API_URL = 'ws://127.0.0.1:9999/';
var pi2 = Math.PI * 2;

// credits to 
// https://github.com/sebleedelisle/JavaScript-PixelPounding-demos/blob/master/1_Particles/js/ImageParticle.js
function randomRange(min, max) {
	return ((Math.random()*(max-min)) + min); 
}

function runAaaaa(gs) {
	/*** Define some different types of things ***/
	t_ship = 1;
	t_asteroid = 2;
	
	/**
	 * Holds methods that control the ship via keyboard & mouse
	 * should be mixin-ed (trait) with players Ship object
	 */
	function PlayersShipControl() {
		
		// lets avoid mixin something we don't realy need 
		this.mixin = function(obj) {
			var things=[
			  "keyHeld_37",
			  "keyDown_37",
			  "keyHeld_39",
			  "keyDown_39",
			  "keyDown_38",
			  "keyHeld_38",
			  "keyHeld_40",
			  "keyDown_40",
			  "keyDown_32",
			  "keyDown",
			  "setFollowPointer",
			  "stopFollowPointer"
			];
			for (var i = 0; i < things.length; i++) {
			    obj[things[i]]=this[things[i]];
			}
		};
		
		this.keyHeld_37 = this.keyDown_37 = function () {
			this.incAngle(-1);
			this.speed = this.speed * 0.98; // slow down on turns
		};
		
		this.keyHeld_39 = this.keyDown_39 = function () {
			this.incAngle(1);
			this.speed = this.speed * 0.98; // slow down on turns
		};
		
		this.keyDown_38 = function () {
			if (this.speed < 1) {
				this.speed = 1;
			}
			// this.speed = this.speed / 2;
		};
		
		this.keyHeld_40 = this.keyDown_40 = function () {
			if (this.speed < 1) {
				this.speed -= this.accel; // TODO: add support to move back
			} else {
				this.speed = this.speed * 0.95;
			}
		};
		
		this.keyHeld_38 = function () {
			//if (this.speed < this.maxspeed)
			this.speed += this.accel;
		};
		
		this.keyDown_32 = function () {
			// draw laset to destroy enemies
			this.action = 1;
		};
		
		this.keyDown = function (keyCode) {
			// console.log(keyCode);
		};

		this.setFollowPointer = function(headingpoint) {
			this.followPointer = true;
		};
		
		this.stopFollowPointer = function() {
			this.followPointer = false;
		};
	}
	
	
	/*** Smoke coming out of the ship 
	 * credits to: https://github.com/sebleedelisle/JavaScript-PixelPounding-demos
	 * for increadable Smoke implementation 
	 ***/
	function Smoke(world, x, y, size, angle) {
		
		// leave smoke behind the direction
		this.x = x - size * Math.sin(angle + randomRange(-0.2, 0.2));  
		this.y = y + size * Math.cos(angle + randomRange(-0.2, 0.2));
		
		this.world = world;
		// this.velX = randomRange(-0.5,0.5);
		// this.velY = 0;
		
		// limit minimum size
		if (size < 1) {
			size = 1;
		}
		
		this.size = randomRange(0.15, 0.2) * size / 8;
		this.maxSize = size / 2;
		this.alpha = randomRange(0.2, 0.3);
		
		this.drag = 0.96;
		this.shrink = 1.04;
		this.fade = 0.008;
		
		this.imageObj = new Image();
		this.imageObj.src = "graphics/ParticleWhite.png";

		// the blendmode of the image render. 'source-over' is the default
		// 'lighter' is for additive blending.
		this.compositeOperation = 'source-over';
		
		this.draw = function(c) {
			
			// if we're fully transparent, no need to render!
			if(this.alpha == 0) return;
			
			// save the current canvas state
			c.save();
			
			// move to where the particle should be
			var cx = this.x - this.world.cameraX();
			var cy = this.y - this.world.cameraY();
			c.translate(cx, cy);
			
			// scale it dependent on the size of the particle
			var s = this.size; 
			c.scale(s,s);
			
			// move the draw position to the center of the image
			c.translate(this.imageObj.width*-0.5, this.imageObj.width*-0.5);
			
			// set the alpha to the particle's alpha
			c.globalAlpha = this.alpha;
			
			// set the composition mode
			c.globalCompositeOperation = this.compositeOperation;

			// and draw it! 
			c.drawImage(this.imageObj,0,0);

			// and restore the canvas state
			c.restore();
		};
		
		this.update = function() {
			
			// and fade it out
			this.alpha -= this.fade; 	
			if (this.alpha < 0) { 
				this.alpha = 0;
			}
			
			this.size *= this.shrink;
			
			if (this.size > this.maxSize) {
				gs.delEntity(this);
			}
		};
	}
	
	/*** World ***/
	function World() {
		this.player = null;
		this.players = new Array();
		this.x = 0;
		this.y = 0;
		this.w = gs.width / 2;
		this.h = gs.height / 2;
		this.quadrant = [0, 0];
		// our procedural map generator with seedable deterministic random number generator
		var map = new Map(new SeedableRandom());
		this.relx = 0;
		this.rely = 0;
		
		// init multiplayer object
		// this.mp = new Multiplayer();
		this.mp = new MultiplayerWebSockets(this);
		
		this.setPlayer = function(player) {
			this.player = player;
			this.x = player.x;
			this.y = player.y;
			this.updateQuadrant();
		};

		this.updateQuadrant = function() {
			this.quadrant = [Math.floor(this.player.x / gs.width), Math.floor(this.player.y / gs.height)];
			this.getQuadrant(this.quadrant);
		};
		
		this.cameraX = function() {
			return this.relx;
		};
		
		this.cameraY = function () {
			return this.rely;
		};
		
		this.draw = function(c) {
			gs.clear();
			gs.background('rgba(0, 0, 0, 1.0)');
			
			// TODO: move thos from wold to some kind of game panel object
			var p = this.player;
			c.font = "15pt Calibri";
			c.fillStyle = "#ffffff"; // text color
			c.fillText('speed: ' + Math.floor(p.speed) + ' max: ' + Math.floor(p.maxspeed), 30, 30);
			c.fillText('coords [ ' + Math.floor(p.x / 1000) + ' : ' + Math.floor(p.y / 1000) + ' ]', 30, 50);
			c.fillText('ping: ' + this.mp.timediff + 'ms', 30, 70);
		};
		
		this.update = function() {
			this.x = this.x + (this.player.x - this.x) * 0.5;
			this.y = this.y + (this.player.y - this.y) * 0.5;
			
			this.relx = this.x - this.w;
			this.rely = this.y - this.h;
			if (Math.floor(this.player.x / gs.width) != this.quadrant[0] ||
				Math.floor(this.player.y / gs.height) != this.quadrant[1]) {
				this.updateQuadrant();
			}
			// do any collisions
			if (this.player) {
				collide.circles([this.player], asteroidcache);
			}
			
			// sync multiplayer and update other players information
			this.mp.sync(this);
		};
		
		// cache of all asteroid objects by their ID
		var asteroidcache = {};
		var asteroidcachesize = 0;
		
		// let us get every asteroid around quadrant [x, y] using our map-generator object
		this.getQuadrant = function(quadrant) {
			var allasteroids = [];
			for (var i=-1; i<2; i++) {
				for (var j=-1; j<2; j++) {
					var pos = [quadrant[0] + i, quadrant[1] + j];
					var quadrantData = map.getQuadrantData(pos);
					var asteroids = quadrantData['asteroids'];
					allasteroids = allasteroids.concat(asteroids);
					for (var a=0; a<asteroids.length; a++) {
						if (!asteroidcache[asteroids[a]]) {
							asteroidcache[asteroids[a]] = new Asteroid(w, map.getAsteroidData(asteroids[a], quadrantData['asteroidSize']), quadrantData['asteroidSize'], pos);
							asteroidcachesize += 1;
							gs.addEntity(asteroidcache[asteroids[a]]);
						}
					}
				}
			}
			// get rid of the asteroids in the cache which we no longer care about
			for (var a in asteroidcache) {
				if (allasteroids.indexOf(asteroidcache[a].id) == -1) {
					gs.delEntity(asteroidcache[a]);
					delete asteroidcache[a];
					asteroidcachesize -= 1;
				}
			}
		};
		
		/*
		// use touch/mouse to guide the ship
		this.pointerDown = function() {
			if (this.player) {
				this.player.setFollowPointer();
			}
		}
		
		this.pointerUp = function() {
			if (this.player) {
				this.player.stopFollowPointer();
			}
		}
		
		this.pointerBox = function() {
			return [0, 0, gs.width, gs.height];
		}
		*/
	}
	
	/**
	 * Multiplayer client 
	 */
	/*
	function Multiplayer() {
		this.apiUrl = 'api.php';
		
		// hold timediff here
		this.timediff = 0;
		
		// sync flag to avoid concurent sync calls
		this.inSync = false;
		
		// perform actual sync of multiplayer data
		this.sync = function(w) {
			// don't sync again if previous data syn process is still not finished
			if (this.inSync) {
				return;
			}
			this.inSync = true;
			
			// just to make our life easier
			var p = w.player;
			
			// send my data to server via AJAX call
			// and receive the data about other players and their positions
			var postData = {id:p.id, x:p.x, y:p.y, angle:p.angle, speed:p.speed, action:p.action};
			
			// save start timestamp to measure latency in miliseconds
			var timestamp_start = new Date().getTime();

			// init local variable to refer self object in lambdas
			// TODO: f**k, this is ugly. we should find a better way to implement this
			var self = this;
			
			// perform request
			// TODO: jquery is quite slow here, possibly try to use some other AJAX method
			$.post(this.apiUrl, postData, function(data) {
			   
			   // calculate latency
			   var timestamp_end = new Date().getTime();
			   self.timediff = timestamp_end - timestamp_start;
			   
			   // update players data
			   self.updatePlayers(w, data.players);
			   
			   // remove block
			   self.inSync = false;
			});
		};
		
		this.updatePlayers = function(w, newData) {
			var ps = w.players;
			
			// detect which players should be removed from world
			for (i in newData) {
				if (!newData.hasOwnProperty(i)) {
					continue;
				}
				
				var id = newData[i].id;
				
				// skip the players own ship
				if (id == w.player.id) {
					continue;
				}
				
				// reset player object and start next iteration
				p = null;
				
				// detect if new player should be added to the world
				if (!ps[id]) {
					// create new player
					p = new Ship(w);
					ps[id] = p; 
					gs.addEntity(p);
				}
				
				// update coordinates of existent player
				p = ps[id];
				p.x = newData[i].x;
				p.y = newData[i].y;
				p.angle = newData[i].angle;
				p.speed = newData[i].speed;
				p.action = newData[i].action;
			}
		};
		
		this.init = function(w) {
			// just to make our life easier
			var p = w.player;
			
			// init local variable to refer self object in lambdas
			// TODO: f**k, this is ugly. we should find a better way to implement this
			var self = this;
			
			var postData = {x:p.x, y:p.y, angle:p.angle, speed:p.speed, action:p.action};
			
			// if we have player ID in hash, then lets just use it
			if (location.hash) {
				postData.id = parseInt(location.hash.substring(1));
			}
			
			$.post(this.apiUrl, postData, function(data){
				// assign player's unique ID
				p.id = data.id;
				
				// lets write this value into location hash to get it from 
				location.hash = "#" + data.id;
				
				// update positions of other players
				self.updatePlayers(w, data.players);
			});
		};
		
	}
	
	*/
	
	

	/*** reload the game ***/
	function doReload(secs) {
		setTimeout(function() {window.location.href = unescape(window.location.pathname);}, 1000 * secs);
	}
	
	/*** A single asteroid ***/
	function Asteroid(world, data, asteroidScale, quadrant) {
		this.type = t_asteroid;
		this.world = world;
		// set asteroid constants to render same world proportions for all players
		var gs_width =  1200;
		var gs_height = 1000;
		
		// get variables from the incoming data
		this.id = data.id;
		// this.x = data.x * gs.width + quadrant[0] * gs.width;
		// this.y = data.y * gs.height + quadrant[1] * gs.height;
		this.x = data.x * gs_width + quadrant[0] * gs_width;
		this.y = data.y * gs_height + quadrant[1] * gs_height;
		
		this.angle = data.angle;
		this.radius = 100 * asteroidScale + 30;
		this.quadrant = quadrant;
		// this.strokeStyle = 'rgba(115, 115, 115, 1.0)';
		this.strokeStyle = 'rgba(0, 0, 0, 0.5)';
		this.fillStyle = 'rgba(50, 50, 50, 1.0)';
		var maxrad = 0;
		
		// structure of this shape
		this.points = [];
		for (var p = 0; p < data.points.length; p++) {
			var newpoint = [this.radius * data.points[p][0], this.radius * data.points[p][1]];
			this.points.push(newpoint);
			var newrad = Math.sqrt(Math.pow(newpoint[0], 2) + Math.pow(newpoint[1], 2));
			if (newrad > maxrad) {
				maxrad = newrad;
			}
		}
		this.poly = [];
		
		// precalculate rotated version
		for (var n = 0; n<data.points.length; n++) {
			this.points[n] = [this.points[n][0] * Math.cos(this.angle) - this.points[n][1] * Math.sin(this.angle) + this.x, this.points[n][0] * Math.sin(this.angle) + this.points[n][1] * Math.cos(this.angle) + this.y];
		}
		
		this.update = function() {
			
			// update our shape definition
			for (var n = 0; n<this.points.length; n++) {
				this.poly[n] = [this.points[n][0] - this.world.cameraX(), this.points[n][1] - this.world.cameraY()];
			}
		};
		
		this.draw = function(c) {
			c.strokeStyle = this.strokeStyle;
			c.fillStyle = this.fillStyle;
			gs.polygon(this.poly);
			// this.draw_circle(c);
		};
		
		this.headTowards = function(where) {
			this.heading = where;
		};
		
		this.get_collision_circle = function() {
			return [[this.x, this.y], maxrad];
		};
		
		this.get_collision_poly = function() {
			return this.poly;
		};
		
		this.draw_circle = function(c) {
			var bits = this.get_collision_circle();
			c.beginPath();
			c.arc(bits[0][0] - this.world.cameraX(), bits[0][1] - this.world.cameraY(), bits[1], 0, pi2, false);
			// arc(100, 100, 50, 0, pi2, false);
			c.closePath();
			c.stroke();
		};
	}
	
	function Star(world) {
		this.world = world;
		this.rate = gs.random(0.5, 1.0);
		this.size = Math.round(gs.random(1, 2));
		this.x = gs.random(0, 10000);
		this.y = gs.random(0, 10000);
		this.fs = 'rgba(255, 255, 255, ' + (this.rate - 0.2) + ')';
		
		this.update = function() {
			
		};
		
		this.getX = function() {
			return Math.round((this.x - this.world.cameraX()) * this.rate % gs.width);
		};
		
		this.getY = function() {
			return Math.round((this.y - this.world.cameraY()) * this.rate % gs.height);
		};
		
		if (this.size > 1.0) {
			this.draw = function(c) {
				c.strokeStyle = this.fs;
				c.moveTo(this.getX(), this.getY());
				c.lineTo(this.getX()+gs.random(-1, 1), this.getY()+gs.random(-1, 1));
				c.stroke();
			};
		}
	}
	
	/*** General ship class that will responsible for players ships rendering ***/	
	function Ship(world) {
		this.type = t_ship;
		this.world = world;
		this.id = null;
		this.x = gs.width / 2;
		this.y = gs.height / 2;
		this.angle = 0;
		this.speed = 10;
		this.maxspeed = 0.0;
		this.turnRate = 0.12;
		this.accel = 0.2;
		this.radius = 13;
		this.points = [[0, -this.radius], [-7, 7], [7, 7]];
		this.poly = [];
		this.lastsmoke = null;
		this.strokeStyle = 'rgba(255, 255, 255, 1.0)';
		this.fillStyle = 'rgba(115, 115, 115, 1.0)';
		this.followPointer = false;
		this.heading = null;
		this.priority = 10;
		
		// actions
		this.action = 0;
		
		// credits to : http://lunar.lostgarden.com/labels/free%20game%20graphics.html
		this.imageObj = new Image();
		this.imageObj.src = "graphics/ship.png";
		this.imageXY = [];
		
		/*
		this.collided = function(other) {
			if (other.type == asteroid) {
				this.explode();
				other.explode();
				// doReload(1);
			}
		};
		*/
		
		this.incAngle = function(sign) {
			this.angle = (this.angle + sign * this.turnRate) % (2 * Math.PI);
		};
		
		this.explode = function() {
			gs.delEntity(this);
		};


		
		
		
		
		this.get_collision_circle = function() {
			return [[this.x, this.y], this.radius];
		};
		
		this.collide_circle = function(who) {
			var polycollision = collide.collide_poly_entities(this, who);
			if (polycollision) {
				var collisionpoint = polycollision[1];
				if (collisionpoint) {
					// var bouncevector = [(collisionpoint[0] - gs.width / 2) - ((this.x - this.world.cameraX()) - gs.width / 2), (collisionpoint[1] - gs.height / 2) - ((this.y - this.world.cameraY()) - gs.height / 2)];
					var p1 = collisionpoint[0];
					var p2 = collisionpoint[1];
					var bouncevector = [p2[1] - p1[1], p1[0] - p2[0]];
					var bouncesize = Math.sqrt(Math.pow(bouncevector[0], 2) + Math.pow(bouncevector[1], 2));
					var bouncenormal = [bouncevector[0] / bouncesize, bouncevector[1] / bouncesize];
					// TODO: fix this up - going into a point doesn't work correctly
					if (this.bouncevector) {
						this.bouncevector[0] += bouncenormal[0];
						this.bouncevector[1] += bouncenormal[1];
						// renormalize
						var bouncesize = Math.sqrt(Math.pow(this.bouncevector[0], 2) + Math.pow(this.bouncevector[1], 2));
						this.bouncevector = [this.bouncevector[0] / bouncesize, this.bouncevector[1] / bouncesize];
					} else {
						this.bouncevector = bouncenormal;
					}
				} else {
					// TODO: bounce the player right out in the direction away from center of the asteroid
					
				}
				this.collided = true;
			}
		};
		
		this.get_collision_poly = function() {
			return this.poly;
		};
		
		this.draw_circle = function(c) {
			var bits = this.get_collision_circle();
			c.beginPath();
			c.arc(bits[0][0] - this.world.cameraX(), bits[0][1] - this.world.cameraY(), bits[1], 0, pi2, false);
			c.closePath();
			c.stroke();
		};
		
		this.update = function() {
			
			// if we have a bouncevector, add it to our position
			if (this.bouncevector) {
				this.x -= this.bouncevector[0] * Math.max(this.speed, 0.1);
				this.y -= this.bouncevector[1] * Math.max(this.speed, 0.1);
				this.bouncevector = null;
				
				this.speed = this.speed * 0.3; // slowdown and turn into unpredictable direction
				if (this.speed > 3) {
					this.angle = gs.random(0, 4);
				}
			}
			// check if followpointer is on
			if (this.followPointer) {
				var heading = [
					(gs.pointerPosition[0] - gs.width / 2 + this.world.cameraX()) - (this.x - gs.width / 2),
					gs.pointerPosition[1] - gs.height / 2 + this.world.cameraY() - (this.y - gs.height / 2),
				];
				// rotate our heading
				var pts = [heading[0] * Math.cos(this.angle) + heading[1] * Math.sin(this.angle), heading[0] * Math.sin(this.angle) - heading[1] * Math.cos(this.angle)];
				this.heading = Math.atan2(pts[0], pts[1]);
				//console.log(angle);
				//this.heading = (this.angle - angle) % Math.PI;
				//console.log(this.heading);
				//this.heading = null;
			} else {
				this.heading = null;
			}
			// if the user is doing touch/mouse events then head towards the selected heading
			if (this.heading) {
				// turn and head towards it
				//console.log(this.heading);
				if (Math.abs(this.heading) < Math.PI / 2 && this.speed < 3.0) {
					this.speed += this.accel;
				}
				if (this.heading > 0.1) {
					this.incAngle(1);
				} else if (this.heading < -0.1) {
					this.incAngle(-1);
				}
			}
			
			// friction
			if (this.speed > 0.1)
				this.speed -= 0.01;
			else
				this.speed = 0;
			
			// update our position based on our angle and speed
			this.x = this.x + this.speed * Math.sin(this.angle);
			this.y = this.y - this.speed * Math.cos(this.angle);
			
			// get our newly translated polygon from angle
			for (var n = 0; n < this.points.length; n++) {
				this.poly[n] = [this.points[n][0] * Math.cos(this.angle) - this.points[n][1] * Math.sin(this.angle) + this.x - this.world.cameraX(), this.points[n][0] * Math.sin(this.angle) + this.points[n][1] * Math.cos(this.angle) + this.y - this.world.cameraY()];
			}
			// OK, after we switched from polygon to image we need to calculate image position
			this.imageXY = [this.x - this.world.cameraX(), 
			                this.y - this.world.cameraY()];
			
			// make smoke behind this ship
			if (this.speed) {
				var smoke = new Smoke(world, this.x, this.y, this.speed, this.angle);
				gs.addEntity(smoke);
			}
			
			// display MAX speed on screen
			if (this.speed > this.maxspeed) {
				this.maxspeed = this.speed;
			}
		};
		
		this.draw = function(c) {
			// get canvas rotation coordinates 
			crX = this.imageXY[0];
			crY = this.imageXY[1];
			// apply transformation, 
			// see: http://stackoverflow.com/questions/4649836/using-html5-canvas-rotate-image-about-arbitrary-point
			c.save(); // save canvas state
			c.translate(crX, crY);
			c.rotate(this.angle);
			c.translate(-crX, -crY);
			c.drawImage(this.imageObj, crX -9, crY -10);
			
			// fire with a laser 
			if (this.action == 1) {
				c.moveTo(crX, crY);
				c.lineTo(crX, crY-1000);
				this.action = 0;
			}

			c.restore();
			/*
			if (this.collided) {
				c.strokeStyle = 'rgb(255, 0, 0)';
				this.draw_circle(c);
			}
			*/
			
			this.collided = false;
		};
	}
	
	
	function MultiplayerWebSockets(w) {
		// WebSocket API URL
		this.apiUrl = WS_API_URL;
		
		// hold timediff here
		this.timediff = 0;
		this.timestart = 0;
		
		// sync flag to avoid concurent sync calls
		this.inSync = false;

		// save the game world
		this.w = w;
		
		// refer to this object from within closure
		var self = this;
		
		// perform actual sync of multiplayer data
		this.sync = function(w) {
			// don't sync again if previous data syn process is still not finished
			if (this.inSync) {
				return;
			}
			this.inSync = true;
			
			// just to make our life easier
			var p = w.player;
			
			// send my data to server via AJAX call
			// and receive the data about other players and their positions
			var postData = {id:p.id, x:p.x.toFixed(2), y:p.y.toFixed(2), angle:p.angle.toFixed(8), speed:p.speed.toFixed(2), action:p.action};
			
			// save start timestamp to measure latency in miliseconds
			this.timestart = new Date().getTime();

			// perform request
	        var reqStr = JSON.stringify(postData); // NOTE: adding extra space due to bug in server that eats last symbol
	        console.log('sending: ' + reqStr);
			this.ws.send(reqStr);
		};
		
		this.updatePlayers = function(w, newData) {
			var ps = w.players;
			
			// detect which players should be removed from world
			for (i in newData) {
				if (!newData.hasOwnProperty(i)) {
					continue;
				}
				
				var id = newData[i].id;
				
				// skip the players own ship
				if (id == w.player.id) {
					continue;
				}
				
				// reset player object and start next iteration
				p = null;
				
				// detect if new player should be added to the world
				if (!ps[id]) {
					// create new player
					p = new Ship(w);
					ps[id] = p; 
					gs.addEntity(p);
				}
				
				// update coordinates of existent player
				p = ps[id];
				p.x = newData[i].x;
				p.y = newData[i].y;
				p.angle = newData[i].angle;
				p.speed = newData[i].speed;
				p.action = newData[i].action;
			}
		};
		
		this.init = function(w) {
			// just to make our life easier
			var p = w.player;
			
			// init local variable to refer self object in lambdas
			// TODO: f**k, this is ugly. we should find a better way to implement this
			var self = this;
			
			var postData = {x:p.x, y:p.y, angle:p.angle, speed:p.speed, action:p.action};
			
			// if we have player ID in hash, then lets just use it
			if (location.hash) {
				postData.id = parseInt(location.hash.substring(1));
			}
			
			// init websocket connection
			this.ws = new WebSocket(this.apiUrl);
			console.log(this.ws);
			
			this.ws.onerror = function(env) {
				console.log(env);
				alert("Error connecting socket: " + this.apiUrl);
			};

			// add new onmessage handler
			this.ws.onmessage = function(e) {
				
				console.log('got responce: ' + e.data);
				
				// update players data
				var data = JSON.parse(e.data);
				
				// assign player's unique ID
				p.id = data.id;
				
				// lets write this value into location hash to get it from 
				location.hash = "#" + data.id;
				
				// update positions of other players
				self.updatePlayers(w, data.players);
				
				// add new onmessage handler
				self.ws.onmessage = function(e) {
					// calculate latency
					var timestamp_end = new Date().getTime();
					self.timediff = timestamp_end - self.timestart;
					
					// update players data
					var data = JSON.parse(e.data);
					self.updatePlayers(self.w, data.players);
					
					// remove block
					self.inSync = false;
		        };
	        };
			
	        this.ws.onopen = function (e) {
				// perform request
		        console.log('connection ready');
		        var reqStr = JSON.stringify(postData); // NOTE: adding extra space due to bug in server that eats last symbol
		        console.log('sending: ' + reqStr);
				this.send(reqStr);
	        };

		};
	}
	

	
	
	
	
	// init world
	var w = new World(gs);

	// lets print out "Loading..." and wait for initial user data to load
	gs.addEntity(w);
	
	// init background stars
	for (var n = 0; n < 50; n++) {
		gs.addEntity(new Star(w));
	}
	
	// init main player's ship
	var playersShip = new Ship(w);

	// add keyboard controll methods 
	var psc = new PlayersShipControl();
	psc.mixin(playersShip);

	// run multiplayer and init players' ships
	w.setPlayer(playersShip);
	w.mp.init(w);
	
	// add to game engine
	gs.addEntity(playersShip);
}