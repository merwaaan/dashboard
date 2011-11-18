/* TODO

	- bug Map
	- rapport

*/

$(function() {

	$('#apps').sortable({
		placeholder: 'ui-state-highlight',
		scroll: false,
		cursor: 'move',
		handle: '.app_header'
	});
	$('#apps').disableSelection();

	var dash = new Dashboard();
	dash.load('Carte', 'map', {size: 300, maxSize: 600, resDir: '../Map/resources/'});
	dash.load('Flux RSS', 'rss', {url: 'http://news.ycombinator.com/rss', length: 5, maxLength: 20});
	dash.load('Recherche', 'search', {length: 1, maxLength: 8});
	dash.load('Calendrier', 'calendar', {});
});

function Dashboard() {

	this.scripts = [];
	this.styles = [];

	window.exports = {};

	this.apps = {
		map: {
			dir: '../Map/',
			js: 'map.js'
		},
		rss: {
			dir: '../RSS/',
			js: 'rss.js'
		},
		search: {
			dir: '../Search/',
			js: 'search.js'
		},
		calendar: {
			dir: '../Calendar/',
			js: 'calendar.js'
		}
	};

	this.columns = null;
}

Dashboard.prototype.load = function (title, app, options) {

	var dir = this.apps[app].dir;
	var js = this.apps[app].js;

	this.loadScript(dir + js);

	var module = window.exports[app];

	this.loadDependencies(dir, module);
	this.loadModule(title, module, options);
}

Dashboard.prototype.loadDependencies = function(dir, module) {

	var moduleScripts = module.prototype.dependencies.scripts;
	var moduleStyles = module.prototype.dependencies.styles;

	var self = this;

	moduleScripts.forEach(function(script) {

		var path = dir + script;
		self.loadScript(path);
	});

	moduleStyles.forEach(function(style) {

		var path = dir + style;
		self.loadStyle(path);
	});
}

Dashboard.prototype.loadModule = function(title, module, options) {

	var li = $('<li></li>').appendTo('#apps');

	var header = $('<div class="app_header"></div>').appendTo(li);
	header.append('<h2>' + title + '</h2>');

	var buttons = $('<span class="app_buttons"></span>').appendTo(header);
	var reduceButton = $('<span>\u2191</span>').appendTo(buttons);
	var maximizeButton = $('<span>\u271A</span>').appendTo(buttons);

	var container = $('<div class="app_content"></div>').appendTo(li);
	var app = new module(container, options);

	//container.append('<span style="border:1px solid red; clear: both;">d</span>');

	reduceButton.click(function() {

		container.slideToggle(400, function() {

			if(container.is(':visible'))
				reduceButton.text('\u2191');
			else
				reduceButton.text('\u2193');
		});
	});

	maximizeButton.click(function() {

		if($('#apps').is(':visible')) {

			// Cache toutes les applications.
			$('#apps').hide();

			// Enregistre la position de l'application courante et l'agrandit.
			this.maxAppPos = li.index();
			li.appendTo('#max_app');

			app.onMaximize();

			maximizeButton.text('\u2012');
		}
		else {

			app.onMinimize();

			// Réinsère l'application maximisée avec les autres.
			if(this.maxAppPos > 0)
				li.insertAfter('#apps > li:nth-child(' + this.maxAppPos + ')'); //('#apps > li:nth-child(' + (this.maxAppPos - 1) + ')');
			else
				li.prependTo('#apps');

			$('#max_app').empty();

			// Affiche toutes les applications.
			$('#apps').show();

			maximizeButton.text('\u271A');
		}
	}.bind(this));
}

Dashboard.prototype.loadScript = function(path) {

	var script = document.createElement('script');
	script.type= 'text/javascript';
	script.src = path;
	$('head').append(script);

	this.scripts.push(script);
}

Dashboard.prototype.loadStyle = function(path) {

	var style = document.createElement('link');
	style.rel = 'stylesheet';
	style.type= 'text/css';
	style.href = path
	$('head').append(style);

	this.styles.push(style);
}
