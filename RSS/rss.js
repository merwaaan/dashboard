function RSS(container, options) {

	this.container = container;
	this.options = options;

	this.container.addClass('rss_container');

	this.displayLength = options.length;

	this.data = [];

	this.list = $('<ul></ul>').appendTo(this.container);

	this.load();
}

RSS.prototype.load = function() {

	// Ajoute une image de chargement.
	this.container.prepend('<img src="loading.gif" class="loading" alt="Loading..."/>');

	$.ajax({
		url: '../Proxy/get?url=http://news.ycombinator.com/rss',
		dataType: 'text',
		success: this.record.bind(this),
		error: function(xhr, status, err) { console.log('Erreur : impossible de transmettre les données (', xhr.responseText, ')'); }
	});
}

RSS.prototype.record = function(data) {

	var xmlDoc = $.parseXML(data);

	$(xmlDoc).find('item').each(function(index, element) {

		var url = $(element).find('link').text();
		var title = $(element).find('title').text();

		this.data.push({url: url, title: title});
	}.bind(this));

	// Retire l'image de chargement.
	$('img.loading', this.container).detach();

	// Affiche les résultats.
	this.display();
}

RSS.prototype.display = function() {

	if(this.data.length == 0)
		return;

	this.list.empty();

	for(var i = 0; i < this.displayLength; ++i) {

		var item = this.data[i];
		var url = item.url;
		var title = item.title;

		this.list.append('<li><a href="' + url + '">' + title + '</a></li>');
	}
}

RSS.prototype.onMaximize = function() {

	this.displayLength = this.options.maxLength;
	this.display();
}

RSS.prototype.onMinimize = function() {

	this.displayLength = this.options.length;
	this.display();
}

RSS.prototype.dependencies = {
	scripts: [
		'jquery.js'
	],
	styles: [
		'screen.css'
	]
};

window.exports['rss'] = RSS;
