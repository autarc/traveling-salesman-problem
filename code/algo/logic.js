/**
 *  Logic
 *  =====
 *
 *
 */

define(function(require){

	var City = require('./format/city');
	var Tour = require('./format/tour');

	// var SA = require('./logic/SA');
	// var EV = require('./logic/EV');
	// var GEN = require('./logic/GEN');

	var debug = 0; // 10

	var data = {
		cities: null,
		distances: null
	};


	function prepareCities(rows){

		data.cities = rows.map(function(city){
			var cityData =  city.split(' ');
			return new City(
				cityData[0],
				cityData[1],
				cityData[2]);
		});

		if (debug) {
			data.cities.length = debug;
		}
	}


	function prepareDistances() {

		var cities = data.cities;

		data.distances = cities.map(function(city){
			var row = [];
			for (var i = 0; i < cities.length; i++) {
				var distX = Math.abs(cities[i].x-city.x);
				var distY = Math.abs(cities[i].y-city.y);

				var dist = Math.sqrt(distX * distX + distY * distY);
				row.push(dist);
			}
			return row;
		});
	}


	// array
	function getRandomRoute(){

		var list = data.cities.slice();
		var size = list.length;
		var route = [];

		while (size > 0) {
			size--;
			route.push(getRandom(list, size))
		}
		return route;
	}


	// array
	function getDistance(route) {
		// console.log(route);

		var distance = 0;

		for (var i = 0; i < route.length-1; i++) {

			var currId = route[i].id - 1,
				nextId = route[i+1].id - 1;
			distance += data.distances[currId][nextId];
		}

		currId = route[0].id - 1;
		nextId = route[i].id - 1;

		return distance + data.distances[currId][nextId];
	}



	function getRandom(list, size){
		var pos = Math.random() * (size + 1);
		return list.splice(pos, 1)[0];
	}



	function simulatedAnnealing(params){
		var oldOrder = getRandomRoute();

		var shortestDistance = 0;

		// Unpack params
		var temperature = params.temperature,
			coolingRate = params.coolingRate,
			absoluteTemperature = params.absoluteTemperature;

		var iteration = -1;
		var distance = getDistance(oldOrder);
		var nextOrder ;
		var deltaDistance = 0 ;

		while (temperature>absoluteTemperature) {
			nextOrder = swapRandomElements(oldOrder);
			deltaDistance = getDistance(nextOrder) - distance;

			var boltzman = Math.exp(-deltaDistance / temperature) > Math.random();
			if ((deltaDistance<0) || (distance>0 && boltzman )) {
				olderOrder = nextOrder;
				distance = deltaDistance + distance;
			}

			temperature *= coolingRate;
			iteration++;
		}

		shortestDistance = distance;

		return {
 			route: oldOrder,
 			distance: shortestDistance
		};
	}


	function swapRandomElements(list){
		list = list.slice();

		var firstRandomCityIndex = Math.random()*list.length|0;
        var secondRandomCityIndex = Math.random()*list.length|0;

        var tmp = list[firstRandomCityIndex];
        list[firstRandomCityIndex] = list[secondRandomCityIndex];
        list[secondRandomCityIndex] = tmp;

        return list;
	}


	function evolutionary(params){
		var maxGenerations = params.generations;

		var oldOrder = getRandomRoute();
		var distance = getDistance(oldOrder);

		var generation = 0;
		var newDistance;

		while (generation < maxGenerations) {


			// #1 - random (single)
			nextOrder = swapRandomElements(oldOrder);

			// #2 - chunks split

			// #3 - ?

			// #4 - .... stable matching, verwendung der distance als preference

			newDistance = getDistance(nextOrder);
			deltaDistance = newDistance - distance;

			if (deltaDistance < 0) {
				oldOrder = nextOrder
				distance = newDistance;
			}

			generation++;
		}

		return {
 			route: oldOrder,
 			distance: distance
		};
	}




	function genetic(params){


		var maxGenerations = params.generations,
			populationSize = params.population;

		var probability = params.p;

		var generation = 0;
		var distance = 0;

		var chunkSize = 30;// min, max <= length (siehe MPX)


		// init population

		var population = Array.apply(null, new Array(populationSize)).map(function(){
			var route = getRandomRoute(),
				distance = getDistance(route);
			return new Tour(route, distance, 0);
		});


		while (generation < maxGenerations) {

			population = setFitness(population);

			var nextPopulation = [];


			while (nextPopulation.length < populationSize) {

				var p = Math.random();

				if (p <= probability.reproduction) {
					// reproduction
					var fitnessMax = Math.max.apply(Math, population.map(function(tour){
						return tour.fitness;
					}));

					for (var i = 0, l = population.length; i < l; i++ ) {
						if (fitnessMax === population[i].fitness) break;
					}

					var fittest = population.splice(i, 1)[0];
					nextPopulation.push(fittest);

				} else if (population.length > 3 && p <= probability.reproduction + probability.crossover) {

					// crossover

					var candidate1 = population.splice(Math.random() * population.length|0, 1)[0],
						candidate2 = population.splice(Math.random() * population.length|0, 1)[0],
						candidate3 = population.splice(Math.random() * population.length|0, 1)[0],
						candidate4 = population.splice(Math.random() * population.length|0, 1)[0];

					console.log('pop',population.length)



					// 1+2
					var winner1 = null,//candidate2,
						winner2 = null;//candidate4;


					// var winner = [
					// 	candidate2,
					// 	candidate4
					// ],
					// loser = [
					// 	candidate1,
					// 	candidate3
					// ];

					var loser1 = null,
						loser2 = null;

					console.log(candidate1,candidate2,candidate3,candidate4);

					if (candidate1.fitness > candidate2.fitness) {
						winner1 = candidate1;
						loser1 = candidate2;
					} else {
						winner1 = candidate2;
						loser1 = candidate1;
					}

					if (candidate3.fitness > candidate4.fitness) {
						winner2 = candidate3;
						loser2 = candidate4;
					} else {
						winner2 = candidate4;
						loser2 = candidate3;
					}

					// Cross-Over Winner1 & Winner2
					var winner = crossRoutes([winner1, winner2], chunkSize);

					// Cross-Over Loser1 & Loser2
					var loser = crossRoutes([loser1, loser2], chunkSize);

					// push winner, looser into the new generation
					nextPopulation.push.apply(nextPopulation, winner);
					nextPopulation.push.apply(nextPopulation, loser);

				} else{
					// mutation
					var pos = Math.random() * population.length|0;
					var tour = population.splice(pos, 1)[0];
					// console.log(tour)
					// debugger;

					tour.route = swapRandomElements(tour.route);
					tour.distance = getDistance(tour.route);
					nextPopulation.push(tour);
				}

			}

			population = nextPopulation.slice();
			// nextPopulation.length = 0;

			generation++;
		}

		population = setFitness(population);

		var fitnessMax = Math.max.apply(Math, population.map(function(fitness){
			return tour.fitness;
		}));

		for (var i = 0, l = population.length; i < l; i++ ) {
			if (fitnessMax === population[i].fitness) break;
		}

		// tour
		var fittest = population[i];

		return {
 			route: fittest.route,
 			distance: fittest.distance
		};
	}


	function setFitness(population) {

		// 1 -set fitness
		var fitMax = Math.max.apply(Math, population.map(function(tour){
			return tour.distance;
		}));

		var sum = 0;

		population.forEach(function(tour){
			var fit = fitMax - tour.fitness;
			tour.fitness = 1/(1+fit);
			sum += tour.fitness;
		});

		population.forEach(function(tour){
			tour.fitness /= sum;
		});

		return population;
	}


	function crossRoutes(parents, chunkSize){

		var tour1 = parents[0],
		    tour2 = parents[1];

		var length = tour1.route.length;

		var children1 = new Tour([], 0, 0),
			children2 = new Tour([], 0, 0);

		//var pos1 = Math.random() * length|0,
		//	pos2 = Math.random() * length|0;
		var pos1 = 0,
			pos2 = 0;


		if (pos1 > length-chunkSize) {
			pos1 -= chunkSize;
		}

		if (pos2 > length-chunkSize) {
			pos2 -= chunkSize;
		}

		//
		var chunk1 = tour1.route.slice(pos1, chunkSize),
			chunk2 = tour2.route.slice(pos2, chunkSize);

		var childPos1 = pos1 + chunkSize;
		var childPos2 = pos2 + chunkSize;

		var tail1 = tour1.route.splice(childPos1, Number.MAX_VALUE),
			tail2 = tour2.route.splice(childPos2, Number.MAX_VALUE);

		tour1.route.unshift.apply(tour1.route, tail1);
		tour2.route.unshift.apply(tour2.route, tail2);

		chunk1.forEach(function(city){
			children2.route[pos2] = city;
			pos2++;
		});

		chunk2.forEach(function(city){
			children1.route[pos1] = city;
			pos1++;
		});

		var childPos = childPos1 ;
		var counter = 0;
		console.log(childPos)
		tour1.route.forEach(function(city, i){
			if (children1.route.indexOf(city) === -1) {
				children1.route[childPos] = city;

				childPos ++;
				if (childPos > length-1) {
					console.log('aaaa')
					childPos = 0;
				}
				//console.log(childPos)

			}
		});


		console.log(tour1.route.length);

		childPos = childPos2;
		tour2.route.forEach(function(city, i){
			if (children2.route.indexOf(city) === -1) {
				children2.route[childPos] = city;

				childPos++;
				if (childPos > length-1) {
					console.log('bbb')
					childPos = 0;
				}
			}
		});

		console.log(tour2.route.length);

		// console.log(childPos1)
		// console.log(children1, chunkSize)

		// set distance
		children1.distance = getDistance(children1.route);
		children2.distance = getDistance(children2.route);

		return [
			children1,
			children2
		];
	}




	return {
		//
		data: data,

		//
		prepareCities: prepareCities,
		prepareDistances: prepareDistances,

		//
		getDistance: getDistance,
		getRandomRoute: getRandomRoute,

		//
		simulatedAnnealing: simulatedAnnealing,
		evolutionary: evolutionary,
		genetic: genetic
	};

});
