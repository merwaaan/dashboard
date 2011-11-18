function Calendar(container, options) {

	this.container = container;
	this.options = options

	this.container.addClass('calendar_container');

	this.displayLength = 0;

	this.events = null;

	$.datepicker.setDefaults($.datepicker.regional['fr']);
	this.calendar = this.container.datepicker({
		beforeShowDay: this.markEvent.bind(this),
		onChangeMonthYear: this.changeMonth.bind(this)
	});

	this.list = $('<ul id="details"></ul>').appendTo(this.container);

	this.load();
}

Calendar.prototype.load = function(year, month) {

	// Cache le calendrier pendant la transition.
	$('.ui-datepicker-inline', this.container).hide();

	// Ajoute une image de chargement.
	this.container.prepend('<img src="loading.gif" class="loading" alt="Loading..."/>');

	// Si aucune date n'est donnée en paramètre, on prend celle du jour.
	var today = year === undefined ? new Date() : new Date(year, month - 1, 1);

	// Intervalle entre le premier et le dernier événement.
	var firstDay = this.format(today);
	var lastDay = this.format(new Date(today.getFullYear(), today.getMonth() + 1, 0));

	var url = 'http://www.google.com/calendar/feeds/developer-calendar@google.com/public/full?strict=true&alt=json&singleevents=true&orderby=starttime&sortorder=a&start-min=' + firstDay + '&start-max=' + lastDay;

	$.ajax({
		url: '/Proxy/get?url=' + encodeURIComponent(url),
		dataType: 'json',
		success: this.record.bind(this),
		error: function(xhr, status, err) { console.log('Erreur : impossible de récupérer le calendrier (', xhr.responseText, ')'); }
	});
}

Calendar.prototype.markEvent = function(date) {

	if(this.events === null)
		return [false, '', ''];

	var dateRFC3239 = this.format(date);
	var event = this.events[dateRFC3239];

	if(event) {

		return [true, 'important', event.title.$t];
	}

	return [false, '', ''];
}

Calendar.prototype.changeMonth = function(year, month, instance) {

	$('#details').empty();
	this.load(year, month);
}

Calendar.prototype.record = function(data) {

	// Retire l'image de chargement.
	$('img.loading', this.container).detach();

	// Réaffiche le calendrier
	$('.ui-datepicker-inline', this.container).show();

	this.events = {};

	data.feed.entry.forEach(function(item) {

		var date = item.gd$when[0].startTime.substr(0, 10);
		this.events[date] = item;
	}.bind(this));

	this.container.datepicker('refresh');
	this.display();
}

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

		var date = new Date(Date.parse(event.gd$when[0].startTime));

		var what = event.title.$t;
		var when = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
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
