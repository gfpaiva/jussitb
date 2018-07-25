/**
 * @fileOverview Create filters and helpers to use on Dust templates
 */
'use strict';

$.extend(dust.filters, {
	formatDatetimeBRL: function(value) {
		return _jussi.formatDatetimeBRL(value);
	},

	formatDateAndHour: function(value) {
		var d = (value) ? new Date(value) : new Date(),
			month = d.getUTCMonth() + 1,
			day = d.getUTCDate(),
			hours = d.getUTCHours(),
			minutes = d.getUTCMinutes();

		return (day < 10 ? '0' : '') + day + '/' +
			(month < 10 ? '0' : '') + month + ' - ' +
			(hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
	},

	formatDate: function(value) {
		var d = (value) ? new Date(value) : new Date(),
			month = d.getUTCMonth() + 1,
			day = d.getUTCDate();

		return (day < 10 ? '0' : '') + day + '/' +
			(month < 10 ? '0' : '') + month;
	},

	formatDateAndYear: function(value) {
		var d = (value) ? new Date(value) : new Date(),
			month = d.getUTCMonth() + 1,
			day = d.getUTCDate(),
			year = d.getFullYear();

		return (day < 10 ? '0' : '') + day + '/' +
			(month < 10 ? '0' : '') + month + '/' + (year < 10 ? '0' : '') + year;
	},

	formatValue: function(value) {
		return window.defaultStoreCurrency + ' ' + _.formatCurrency(value);
	},

	intAsCurrency: function(value) {
		return _.intAsCurrency(value);
	},

	notificationShortTitle: function(value) {
		return value.substr(0, 80);
	},

	sanitize: function(value) {
		return _jussi.replaceSpecialChars(value).toLowerCase();
	},
});

// Dust Helpers
dust.helpers.if = function(chunk, context, bodies, params) {
	var location = params.key,
		value = params.value,
		body = bodies.block;

	if (location === value) {
		chunk.render(body, context);
	}

	return chunk;
};

dust.helpers.neq = function(chunk, context, bodies, params) {
	var location = params.key,
		value = params.value,
		body = bodies.block;

	if (location !== value) {
		chunk.render(body, context);
	}

	return chunk;
};
