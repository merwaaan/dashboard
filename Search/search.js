function Search(container, options) {

	this.container = container;
	this.options = options;

	this.container.addClass('search_container');

	this.displayLength = options.length;

	this.data = [];

	this.field = $('<input type="text"/>').appendTo(this.container);
	this.button = $('<input type="submit" value="Go"/>').appendTo(this.container);
	this.results = $('<ul></ul>').appendTo(this.container) ;

	this.button.click(function() {
		this.search(this.field.val());
	}.bind(this));

	this.field.keypress(function(event) {
		if(event.keyCode == 13)
			this.search(this.field.val());
	}.bind(this));
}

Search.prototype.search = function(keywords) {

	if(this.field.val().length == 0)
		return;

	// Efface les résultats précédents.
	$('ul img', this.container).detach();

	// Ajoute une image de chargement.
	$('<img src="loading.gif" class="loading" alt="Loading..."/>').insertAfter(this.button, this.container);

	var url = 'http://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=8&q=' + encodeURIComponent(keywords);

	$.ajax({
		url: '/Proxy/get?url=' + encodeURIComponent(url),
		dataType: 'json',
		success: this.record.bind(this),
		error: function(xhr, status, err) { console.log('Erreur: Impossible de récupérer les données (', xhr.responseText, ')'); }
	});
}

Search.prototype.record = function(data) {

	// Enregistre les résultats pour ne pas avoir à refaire la même
	// requête en cas d'agrandissement/réduction de la fenêtre.
	this.data = data.responseData.results;

	// Retire l'image de chargement.
	$('img.loading', this.container).detach();

	// Affiche les résultats.
	this.display();
}

Search.prototype.display = function() {

	if(this.data.length == 0)
		return;

	this.results.empty();

	for(var i = 0; i < this.displayLength; ++i) {

		var item = this.data[i];
		var url = item.originalContextUrl;
		var imgUrl = item.tbUrl;
		var title = item.contentNoFormatting;

		this.results.append('<a href="' + url + '"><img src="' + imgUrl + '" alt="' + title + '"/></a>');
	}
}

Search.prototype.onMaximize = function () {

	this.displayLength = this.options.maxLength;
	this.display();
}

Search.prototype.onMinimize = function () {

	this.displayLength = this.options.length;
	this.display();
}

Search.prototype.dependencies = {
	scripts: [
		'jquery.js'
	],
	styles: [
		'screen.css'
	]
};

window.exports['search'] = Search;
