function Map(container, options) {

	this.container = container;
	this.options = options;

	this.container.addClass('map_container');

	this.dir = options.resDir !== undefined ? options.resDir : './';

	// Point de départ et d'arrivée de l'itinéraire à calculer.
	this.route = {from: null, to: null};

	// Chemin renvoyé par le serveur.
	this.path = null;

	this.dragging = false;
	this.dragStartPos = {x: 0, y: 0};

	// Position de la carte.
	this.mapPos = {x: 0, y: 0};

	// Dimensions du viewport.
	this.viewport = {w: options.size, h: options.size};

	// Nive de zoom (0 = plus éloigné).
	this.zoomLevel = 0;

	// Taille totale des images de chaque niveau de zoom.
	this.imageSize = [
		{w: 600, h: 600},
		{w: 1000, h: 1000},
		{w: 3000, h: 3000}
	];

	// Largeur/Hauteur d'une tile.
	this.tileSize = 100;

	// Dimensions de la grille de tiles visible dans le viewport.
	this.visibleGridSize = {
		w: Math.ceil(this.viewport.w / this.tileSize) + 1,
		h: Math.ceil(this.viewport.h / this.tileSize) + 1
	}

	// Dimension totale de la grille de tiles.
	this.completeGridSize = {
		w: Math.ceil(this.imageSize[0].w / this.tileSize),
		h: Math.ceil(this.imageSize[0].h / this.tileSize)
	}

	// Coordonnées normalisées des villes.
	this.cities = {
		Paris: {x:0.52, y:0.32},
		Marseille: {x:0.7, y:0.78},
		Lyon: {x:0.67, y:0.59},
		Toulouse: {x:0.46, y:0.76},
		Nice: {x:0.79, y:0.79},
		Nantes: {x:0.29 , y:0.46},
		Strasbourg: {x:0.84 , y:0.31},
		Montpellier: {x:0.59 , y:0.79},
		Bordeaux: {x:0.33 , y:0.62},
		Lille: {x:0.53 , y:0.147},
		Rennes: {x:0.26 , y:0.39},
		Reims: {x:0.63 , y:0.3},
		LeHavre: {x:0.39 , y:0.24},
		Caen: {x:0.36 , y:0.28}
	};

	// Dimensions des images représentant les villes (état neutre et état sélectionné).
	this.pinSize = {w: 25, h: 42};
	this.selectedPinSize = {w: 32, h: 55};

	// Conteneurs principaux.
   this.outerDiv = $('<div id="outerDiv"></div>').appendTo(container);
   this.innerDiv = $('<div id="innerDiv"></div>').appendTo(this.outerDiv);
	this.descDiv = null;

   // Change la taille du DIV interne.
	this.innerDiv.width(this.imageSize[this.zoomLevel].w);
	this.innerDiv.width(this.imageSize[this.zoomLevel].h);

   // Change la taille du DIV externe.
	this.outerDiv.width(this.viewport.w);
	this.outerDiv.height(this.viewport.h);

   // Spécifie les callbacks.
	this.outerDiv.mousedown(this.startMove.bind(this));
   $(document).mousemove(this.processMove.bind(this));
	$(document).mouseup(this.stopMove.bind(this));

	// Empêche la sélection le dragging des tiles.
   document.ondragstart = function() { return false; }
   document.onselectstart = function() { return false; }

	// Enregistre les callbacks de zoom.
	var self = this;
	this.zoomInButton = $('<input type="button" id="zoomIn" value="+"/>').appendTo(this.outerDiv);
	this.zoomInButton.click(function(){ self.zoom(1); });
	this.zoomOutButton = $('<input type="button" id="zoomOut" value="-"/>').appendTo(this.outerDiv);
	this.zoomOutButton.click(function(){ self.zoom(-1); });
	this.outerDiv.bind('mousewheel', function(event, delta) {
		if(delta > 0)
			self.zoom(1);
		else
			self.zoom(-1);
	});

	// Surcouche SVG.
	this.svg = Raphael("innerDiv", this.imageSize[this.zoomLevel].w, this.imageSize[this.zoomLevel].h);
	this.cityPins = {};
	this.cityLabels = {};
	this.svgPath = null

	this.resetCities();
   this.checkTiles();
}

Map.prototype.startMove = function(event) {

	// Active le drag et change la forme du curseur.
   this.dragging = true;
   document.body.style.cursor = 'move';

	// Enregistre la position du curseur.
   this.dragStartPos.x = event.clientX;
   this.dragStartPos.y = event.clientY;
}

Map.prototype.stopMove = function(event) {

	// Désactive le drag et réinitialise la forme du curseur.
   this.dragging = false;
   document.body.style.cursor = 'default';
}

Map.prototype.processMove = function(event) {

   if(!this.dragging)
		return false;

	// Déplace la carte en fonction du déplacement de la souris depuis
	// la dernière mise à jour.
   this.mapPos.x += event.clientX - this.dragStartPos.x;
   this.mapPos.y += event.clientY - this.dragStartPos.y;

	// Enregistre la nouvelle position du curseur.
   this.dragStartPos.x = event.clientX;
   this.dragStartPos.y = event.clientY;

	// Met à jour les tiles.
   this.updatePosition();
   this.checkTiles();
}

Map.prototype.zoom = function(z) {

	// On ne zoome pas plus que possible.
	if(this.zoomLevel + z < 0 || this.zoomLevel + z > 2)
		return;

   // Calcule la position normalisée du centre du viewport par rapport à la carte.
   var rx = (-this.mapPos.x + this.viewport.w / 2) / this.imageSize[this.zoomLevel].w;
   var ry = (-this.mapPos.y + this.viewport.h / 2) / this.imageSize[this.zoomLevel].h;

   this.zoomLevel += z;

   // Décale la vue de la moitié du viewport pour recentrer.
   this.mapPos.x = -rx * this.imageSize[this.zoomLevel].w + this.viewport.w / 2;
   this.mapPos.y = -ry * this.imageSize[this.zoomLevel].h + this.viewport.h / 2;

   // Calcule les nouvelles dimensions de la grille de tiles.
   this.completeGridSize = {
		w: Math.ceil(this.imageSize[this.zoomLevel].w / this.tileSize),
		h: Math.ceil(this.imageSize[this.zoomLevel].h / this.tileSize)
   }

	// Redimensionne la surcouche SVG.
	this.svg.setSize(this.imageSize[this.zoomLevel].w, this.imageSize[this.zoomLevel].h);

   this.updatePosition();
   this.checkTiles();
	this.resetCities();

	// Redessine le chemin si nécessaire.
	if(this.svgPath) {

		//this.svgPath.remove();
		this.drawRoute(this.path);
	}
}

Map.prototype.buildDirection = function(event) {

	var clickedCity = event.target.id;

	// Si la seconde ville est déjà sélectionnée, on recommence.
	if(this.route.to) {

		if(clickedCity === this.route.from) {

			this.unselectCity(this.route.to);
		}
		else if(clickedCity === this.route.to) {

			this.unselectCity(this.route.from);
			this.route.from = this.route.to;
			this.route.to = null;
		}
		else {

			this.unselectCity(this.route.from);
			this.unselectCity(this.route.to);
			this.selectCity(clickedCity, 'from');
		}

		// Efface le chemin précedemment tracé.
		if(this.svgPath)
			this.svgPath.animate({
				'stroke-opacity': 0
			}, 200, 'ease-out', function() {
				this.remove();
			});
	}
	// Si aucune ville n'a été encore sélectionnée (première utilisation).
	else if(!this.route.from) {

		this.selectCity(clickedCity, 'from');
	}
	// Si une seule ville a été sélectionnée, le faire et calculer l'itinéraire.
	else if(!this.route.to) {

		this.selectCity(clickedCity, 'to');
		this.computeRoute(this.route.from, this.route.to);
	}
}

Map.prototype.selectCity = function(city, step) {

	this.route[step] = city;

	// Anime le marqueur.
	var img = this.cityPins[city];
	img.animate({
		'width': this.selectedPinSize.w,
		'height': this.selectedPinSize.h,
		'x': img.attr('x') - (this.selectedPinSize.w - this.pinSize.w)/2,
		'y': img.attr('y') - (this.selectedPinSize.h - this.pinSize.h)/2,
		'opacity': 1
	}, 150, 'ease-in');
}

Map.prototype.unselectCity = function(city) {

	if(this.route.from === city)
		this.route.from = null;
	else if(this.route.to === city)
		this.route.to = null;

	// Anime le marqueur.
	var img = this.cityPins[city];
	var self = this;
	img.animate({
		'width': self.pinSize.w,
		'height': self.pinSize.h,
		'x': img.attr('x') + (self.selectedPinSize.w - self.pinSize.w)/2,
		'y': img.attr('y') + (self.selectedPinSize.h - self.pinSize.h)/2,
		'opacity': 0.5
	}, 200, 'ease-out');
}

Map.prototype.isCitySelected = function(svgPin) {

	return svgPin.city === this.route.from || svgPin.city === this.route.to;
}

Map.prototype.computeRoute = function(from, to) {

	// Envoie la requête de calcul d'itinéraire au serveur.
	$.ajax({
		url: '../Map/direction?from=' + from + '&to=' + to,
		dataType: 'json',
		success: this.displayRoute.bind(this),
		error: function(xhr, status) { console.log('Erreur: Impossible de calculer l\'itinéraire (' + xhr + ')'); }
	});
}

Map.prototype.displayRoute = function(data) {

	// Enregistre les données.
	this.path = data;

	// Dessine le tracé de l'itinéraire.
	this.drawRoute(data);

	// Décrit l'itinéraire si le bloc prévu à cet effet existe.
	if(this.descDiv !== null)
		this.writeRoute(data);
}

Map.prototype.drawRoute = function(data) {

	var path = '';

	var started = false;
	var self = this;
	data.forEach(function(value, index) {

		var name = value.city;
		var x = self.cities[name].x * self.imageSize[self.zoomLevel].w;
		var y = self.cities[name].y * self.imageSize[self.zoomLevel].h;

		if(started)
			path += 'L';
		else {
			path += 'M';
			started = true;
		}

		path += x + ',' + y;
	});

	this.svgPath = this.svg.path(path).attr({
		'stroke': 'blue',
		'stroke-width': 10,
		'stroke-linejoin': 'round',
		'stroke-linecap': 'round',
		'stroke-opacity': 0
	}).animate({
		'stroke-opacity': 0.3
	}, 500, 'ease-out');
}

Map.prototype.writeRoute = function(data) {

	var desc = '<ul>';

	var self = this;
	data.forEach(function(value, index) {

		var name = value.city;
		var route = value.route;
		var distance = value.distance;

		if(route)
			desc += '<li>A partir de <b>'+name+'</b>, suivre <b>'+route+'</b> pendant <b>'+distance+'</b> km.</li>';
		else
			desc += '<li>Vous êtes arrivé à <b>'+name+'</b></li>'
	});

	desc += '</ul>';

	this.descDiv.empty();
	this.descDiv.append(desc);
}

Map.prototype.updatePosition = function() {

	// Vérifie que l'on puisse pas se déplacer au delà des limites des l'image.
   if(this.mapPos.x > 0)
		this.mapPos.x = 0;
   else if(this.mapPos.x + this.imageSize[this.zoomLevel].w < this.viewport.w)
		this.mapPos.x = this.viewport.w - this.imageSize[this.zoomLevel].w;

   if(this.mapPos.y > 0)
		this.mapPos.y = 0;
   else if(this.mapPos.y + this.imageSize[this.zoomLevel].h < this.viewport.h)
		this.mapPos.y = this.viewport.h - this.imageSize[this.zoomLevel].h;

	// Met à jour la position du DIV interne.
	this.innerDiv.css('left', this.mapPos.x);
	this.innerDiv.css('top', this.mapPos.y);
}

Map.prototype.checkTiles = function() {

	// Récupère les coordonnées des tiles visibles.
   var visibleTiles = this.getVisibleTiles();
   var visibleTilesMap = {};

	// Ajoute les tiles visibles pas encore présents dans le document.
   for(i = 0; i < visibleTiles.length; ++i) {

		var tile = visibleTiles[i];

		var tileName = 'x' + tile[0] + 'y' + tile[1] + 'z' + this.zoomLevel;
		visibleTilesMap[tileName] = true;

		if($('#'+tileName, this.container).length === 0)
			$('<img>').attr({
				'src': this.dir + '/tiles/'+tileName+'.jpg',
				'id': tileName,
				'class': 'tile'
			}).css({
				'position': 'absolute',
				'left': tile[0] * this.tileSize,
				'top': tile[1] * this.tileSize,
				'width': this.tileSize,
				'height': this.tileSize,
			}).appendTo(this.innerDiv);
   }

	// Supprimes les tiles présents dans le document et n'étant plus visibles.
	$('img.tile').each(function(index, element) {

		if(!visibleTilesMap[$(this).attr('id')])
			$(this).detach();
	});
}

Map.prototype.resetCities = function() {

	// Efface les villes déjà présentes.
	this.svg.clear();

	// Ajoute les villes une par une.
	for(var c in this.cities) {

		// Calcule la position de la ville sur la carte en fonction du zoom.
		var x = this.cities[c].x * this.imageSize[this.zoomLevel].w;
		var y = this.cities[c].y * this.imageSize[this.zoomLevel].h;

		// Ajoute une image dans la surcouche SVG.
		var cityImg = this.svg.image(this.dir + '/pin.svg', x - this.pinSize.w/2, y - this.pinSize.h, this.pinSize.w, this.pinSize.h);

		// Ajoute un identifiant et un attribut "city" à l'image ajoutée.
		cityImg[0].id = c;
		cityImg.city = c;

		cityImg.attr('opacity', 0.5);

		// Sélectionne la ville quand on clique dessus.
		cityImg.click(this.buildDirection.bind(this));

		// Fait varier l'opacité de l'image quand le curseur la survole.
		var self = this;
		cityImg.hover(function() {

			this.animate({
				'opacity': 1
			}, 100, 'ease-in');

			self.cityLabels[c] = self.svg.text(
				this.attr('x') + self.pinSize.w/2,
				this.attr('y') + self.pinSize.h + 10,
				this.city
			).attr({
				'font-size': 13,
				'font-weight': 'bold'
			});

		}, function() {

			if(!self.isCitySelected(this))
				this.animate({
					'opacity': 0.4
				}, 100, 'ease-out');

			self.cityLabels[c].remove();
		});

		this.cityPins[c] = cityImg;
	}
}

Map.prototype.getVisibleTiles = function() {

	// Calcule les coordonnées de la tile en haut à gauche du viewport.
   var startTile = {
		x: -Math.ceil(this.mapPos.x / this.tileSize),
		y: -Math.ceil(this.mapPos.y / this.tileSize)
   }

	// Calcule les coordonnées de la tile en bas à droite du viewport.
   var endTile = {
		x: startTile.x + this.visibleGridSize.w + 1,
		y: startTile.y + this.visibleGridSize.h + 1
   }

	// Récupère les coordonnées de toutes les tiles visibles.
   var visibleTiles = [];
   for(x = startTile.x; x <= endTile.x; ++x)
		for(y = startTile.y; y <= endTile.y; ++y)
			if(x >= 0 && x < this.completeGridSize.w && y >= 0 && y < this.completeGridSize.h)
				visibleTiles.push([x, y]);

   return visibleTiles;
}

Map.prototype.resize = function(w, h) {

	this.viewport = {w: w, h: h};

	this.outerDiv.width(this.viewport.w);
	this.outerDiv.height(this.viewport.h);

	this.visibleGridSize = {
		w: Math.ceil(this.viewport.w / this.tileSize) + 1,
		h: Math.ceil(this.viewport.h / this.tileSize) + 1
	};
}

Map.prototype.onMaximize = function() {

	this.resize(this.options.maxSize, this.options.maxSize);

	this.descDiv = $('<div id="descDiv"></div>').appendTo(this.container);

	this.updatePosition();
	this.checkTiles();
}

Map.prototype.onMinimize = function() {

	this.resize(this.options.size, this.options.size);

	this.descDiv.detach();
	this.descDiv = null;
}

Map.prototype.dependencies = {
	scripts: [
		'jquery.js',
		'jquery.mousewheel.js',
		'raphael.js'
	],
	styles: [
		'screen.css'
	]
};

window.exports['map'] = Map;
