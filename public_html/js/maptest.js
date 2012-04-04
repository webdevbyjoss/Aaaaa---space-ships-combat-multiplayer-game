function startMapTest(gs) {
	var t_asteroid = 1;
	
	/*** A single asteroid ***/
	function Asteroid(world, data, asteroidScale, quadrant) {
		this.type = t_asteroid;
		this.world = world;
		// get variables from the incoming data
		this.id = data.id
		this.x = data.x * gs.width / 3 + (quadrant[0] + 1) * gs.width / 3;
		this.y = data.y * gs.height / 3 + (quadrant[1] + 1) * gs.height / 3;
		this.angle = data.angle;
		this.radius = 20 * asteroidScale + 10;
		this.quadrant = quadrant;
		// structure of this shape
		this.points = [];
		for (p=0; p<data.points.length; p++)
			this.points.push([this.radius * data.points[p][0], this.radius * data.points[p][1]]);
		this.poly = [];
		
		this.update = function() {
			// update our shape definition
			for (n=0; n<this.points.length; n++) {
				this.poly[n] = [this.points[n][0] * Math.cos(this.angle) - this.points[n][1] * Math.sin(this.angle) + this.x - this.world.cameraX(), this.points[n][0] * Math.sin(this.angle) + this.points[n][1] * Math.cos(this.angle) + this.y - this.world.cameraY()];
			}
		}
		
		this.draw = function(c) {
			c.strokeStyle = 'rgba(255, 255, 255, 1.0)';
			gs.polygon(this.poly);
		}
	}
	
	/*** World ***/
	function World() {
		this.x = 0;
		this.y = 0;
		// seedable deterministic random number generator	
		var mt = new MersenneTwister();
		// our procedural map generator
		var map = new Map(mt);
		
		this.draw = function() {
			gs.clear();
			gs.background('rgba(100, 100, 100, 1.0)');
		}
		
		this.update = function() {
		}
		
		this.keyDown_37 = function() {
			this.setPos(this.x - 1, this.y);
		}
		
		this.keyDown_39 = function() {
			this.setPos(this.x + 1, this.y);
		}
		
		this.keyDown_38 = function() {
			this.setPos(this.x, this.y - 1);
		}
		
		this.keyDown_40 = function() {
			this.setPos(this.x, this.y + 1);
		}
		
		// non-entity specific functions
		
		this.setPos = function(x, y) {
			this.x = x;
			this.y = y;
			this.getQuadrant([x, y]);
		}
		
		this.cameraX = function() {
			return this.x * gs.width / 3;
		}
		
		this.cameraY = function() {
			return this.y * gs.height / 3;
		}
		
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
			for (a in asteroidcache) {
				if (allasteroids.indexOf(asteroidcache[a].id) == -1) {
					gs.delEntity(asteroidcache[a])
					delete asteroidcache[a];
					asteroidcachesize -= 1;
				}
			}
		}
	}
	
	w = new World();
	gs.addEntity(w);
	w.setPos(23, 15);
}
