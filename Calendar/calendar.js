function Calendar(container, options) {

	this.container = container;
	this.options = options

	this.container.addClass('calendar_container');

	$.datepicker.setDefaults($.datepicker.regional['fr']);
	this.container.datepicker();

	this.events = [];

	this.list = $('<ul id="details"></ul>').appendTo(this.container);

	this.load();
}

Calendar.prototype.load = function() {

	var url = 'http://www.google.com/calendar/feeds/developer-calendar@google.com/public/full?alt=json&singleevents=true';

	$.ajax({
		url: '/Proxy/get?url=' + encodeURIComponent(url),
		dataType: 'json',
		success: this.record.bind(this),
		error: function(xhr, status, err) { console.log('Erreur : impossible de récupérer le calendrier (', xhr.responseText, ')'); }
	});
}

Calendar.prototype.record = function(data) {

	this.events = data.feed.entry;

	this.events.sort(function(a, b) {

		var dateA = a.gd$when[0].startTime;
		var dateB = b.gd$when[0].startTime;
//		console.log(dateA, 'vs', dateB, '->', dateA < dateB);

		return dateA < dateB;
	});

	this.display();
}

Calendar.prototype.display = function() {

	for(var i = 0; i < 10; ++i) {

		var event = this.events[i];
		var what = event.title.$t;
		var when = new Date(Date.parse(event.gd$when[0].startTime));
		var where = event.gd$where[0].valueString;

		this.list.append('<li>' + when + ' //// ' + event.gd$when[0].startTime + '</li>');
		//this.list.append('<li><span class="event">' + what + '</span><span class="date">' + when.getDay() + '/' + when.getMonth() + '/' + when.getFullYear() + '</span> @' + where + '</li>');
	}
}

Calendar.prototype.onMaximize = function () {


}

Calendar.prototype.onMinimize = function () {


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
