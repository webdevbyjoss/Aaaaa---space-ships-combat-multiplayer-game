/**
	Procedurally creates the map of the AsteroidsTNG universe.
	It uses the current position in x, y co-ordinates, and some "universe seed" number unique to a particular universe to generate a random map around that position.
	You will always get the same map of a quadrant for the same universe constant.
	
	@param random is the random number generator such as "new MersenneTwister();"
	@param seed is a unique seed which will create a unique universe for every seed. Use this to always get the same map.
*/
function Map(random, seed) {
	// our random number generator
	this.random = random;
	// if they have provided a seed then use it instead of the default
	var mapSeed = this.mapSeed = 314259;
	if (seed) mapSeed = seed;
	// cache for quadrant arrays
	quadrantcache = {};
	// cache for asteroid numbers
	asteroidcache = {};
	
	/**
		Get the results of one quadrant's worth of stuff.
		If you change the order in which things are created, it will break the function so add new stuff at the end.
		@return array of asteroid IDs
	*/
	this.getQuadrantData = function(quadrant) {
		var qidx = quadrant[0] + "," + quadrant[1];
		if (quadrantcache[qidx]) return quadrantcache[qidx];
		// seed our random quandrant generator with the quadrant and mapSeed
		this.random.seed3d(mapSeed, quadrant[0], quadrant[1])
		
		var asteroids = [];
		// there are between 0 and 10 possible asteroids in a given quadrant
		asteroids.length = random.nextInt(0, 10)
		for (var s=0; s<asteroids.length; s++) {
			// make a new ID for this asteroid
			asteroids[s] = this.random.nextInt();
		}
		
		// size of asteroids in this quadrant
		quadrantcache[qidx] = {"asteroidSize": this.random.next(), "asteroids": asteroids};
		return quadrantcache[qidx];
	}
	
	/** 
		@return the asteroid data for a particular asteroid ID 
	*/
	this.getAsteroidData = function(id, asteroidScale) {
		if (asteroidcache[id]) return asteroidcache[id];
		// seed our generator with this asteroid ID and the map seed
		this.random.seed2d(id, this.mapSeed);
		// pick a random radius size
		var radius = this.random.next();
		// how many verticies in this asteroid
		var numPoints = this.random.nextInt(3, Math.floor((asteroidScale) * 7) + 4);
		// pick random position
		var x = this.random.next();	
		var y = this.random.next();
		// pick a random rotation angle
		var angle = this.random.next() * Math.PI;
		// function to return a random point
		function randomPoint(random) {
			return random.next() * radius - radius/2;
		}
		// pick a bunch of points for our asteroid verticies
		var points = [];
		for (var i = 0; i < numPoints; i++)
			points.push([radius * Math.sin(i * Math.PI / (numPoints / 2)) + randomPoint(this.random),
				radius * Math.cos(i * Math.PI / (numPoints / 2)) + randomPoint(this.random)]);
		// build and return our asteroid data structure
		asteroidcache[id] = {
			"id": id,
			"x": x,
			"y": y,
			"angle": angle,
			"points": points
		}
		return asteroidcache[id];
	}
}

