function Calendar(container, options) {

	this.container = container;
	this.options = options

	this.container.addClass('calendar_container');

	this.displayLength = 0;

	// Données retournées par la reqûete AJAX.
	this.events = null;

	// On utilise Jquery Datepicker en tant que calendrier.
	$.datepicker.setDefaults($.datepicker.regional['fr']);
	this.calendar = this.container.datepicker({
		beforeShowDay: this.markEvent.bind(this),
		onChangeMonthYear: this.changeMonth.bind(this)
	});

	// List qui contiendra le détail des événements du mois.
	this.list = $('<ul id="details"></ul>').appendTo(this.container);

	// Chargement des données.
	this.load();
}

Calendar.prototype.load = function(year, month) {

	// Cache le calendrier pendant la transition.
	$('.ui-datepicker-inline', this.container).hide();

	// Ajoute une image de chargement.
	this.container.prepend('<img src="loading.gif" class="loading" alt="Loading..."/>');

	// Si aucune date n'est précisée en paramètre, on prend celle du jour.
	var today = year === undefined ? new Date() : new Date(year, month - 1, 1);

	// Intervalle entre le premier et le dernier événement.
	var firstDay = this.format(today);
	var lastDay = this.format(new Date(today.getFullYear(), today.getMonth() + 1, 0));

	var url = 'http://www.google.com/calendar/feeds/developer-calendar@google.com/public/full?alt=json&singleevents=true&orderby=starttime&sortorder=a&start-min=' + firstDay + '&start-max=' + lastDay;

	$.ajax({
		url: '/Proxy/get?url=' + encodeURIComponent(url),
		dataType: 'json',
		success: this.record.bind(this),
		error: function(xhr, status, err) { console.log('Erreur : impossible de récupérer les données du calendrier (', xhr.responseText, ')'); }
	});
}

/**
 * Met en valeur le jour courant dans le calendrier si la
 * date est enregistrée dans notre liste d'événements.
 *
 * La valeur retournée à JQuery doit être un tableau dont les
 * valeur sont :
 *
 * - un booléen indiquant si la date est sélectionnable
 * - la classe de la case courante
 * - le contenu du tooltip apparaîssant au survol du curseur
 */
Calendar.prototype.markEvent = function(date) {

	if(this.events === null)
		return [false, '', ''];

	// Convertit la date au format RFC3239 et vérifie si un événement
	// est prévu à cette date.
	var dateRFC3239 = this.format(date);
	var event = this.events[dateRFC3239];

	if(event)
		return [true, 'important', event.title.$t];

	return [false, '', ''];
}

Calendar.prototype.changeMonth = function(year, month) {

	$('#details').empty();
	this.load(year, month);
}

Calendar.prototype.record = function(data) {

	// Retire l'image de chargement.
	$('img.loading', this.container).detach();

	// Réaffiche le calendrier
	$('.ui-datepicker-inline', this.container).show();

	this.events = {};

	// On enregistre les données dans un hash dont les identifiants
	// sont les dates au format RFC3239 et dont les valeurs sont les
	// objets JSON récupérés par notre requête.
	data.feed.entry.forEach(function(item) {
		var date = item.gd$when[0].startTime.substr(0, 10);
		this.events[date] = item;
	}.bind(this));

	// Met à jour le calendrier et affiche les détails des événements.
	this.container.datepicker('refresh');
	this.display();
}

/**
 * Prend en argument une Date javascript et retourne la châine de
 * caractères la représentant au format RFC3239 utilisé par Google
 * (YYYY-MM-DD).
 */
Calendar.prototype.format = function(date) {

	var year = date.getFullYear();
	var month = (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1);
	var day = (date.getDate() < 10 ? '0' : '') + date.getDate();

	return year + '-' + month + '-' + day;
}

Calendar.prototype.display = function() {

	$('#details').empty();

	if(this.displayLength == 0)
		return;

	$.each(this.events, function(dateRFC3239, event) {

		var what = event.title.$t;
		var when = dateRFC3239.substr(8, 2) + '/' + dateRFC3239.substr(5, 2) + '/' + dateRFC3239.substr(0, 4);
		var where = event.gd$where[0].valueString;

		var eventElement = $('<li></li>').appendTo(this.list);
		eventElement.append('<span class="event">' + what + '</span>');
		eventElement.append('<span class="date">' + when + '</span>');
		eventElement.append('<span class="place">@' + where + '</span>');
	}.bind(this));
}

Calendar.prototype.onMaximize = function () {

	this.displayLength = Infinity;
	this.display();
}

Calendar.prototype.onMinimize = function () {

	this.displayLength = 0;
	this.display();
}

Calendar.prototype.dependencies = {
	scripts: [
		'jquery.js',
		'jquery-ui.js',
		'jquery.ui.datepicker-fr.js'
	],
	styles: [
		'screen.css',
		'calendar.css'
	]
};

window.exports['calendar'] = Calendar;
