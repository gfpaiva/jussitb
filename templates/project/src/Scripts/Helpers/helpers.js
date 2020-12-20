/* global VERSION: true */

"use strict";

// Avoid `console` errors in browsers that lack a console.
(function () {
	var method;
	var noop = function noop() {};
	var methods = [
		"assert",
		"clear",
		"count",
		"debug",
		"dir",
		"dirxml",
		"error",
		"exception",
		"group",
		"groupCollapsed",
		"groupEnd",
		"info",
		"log",
		"markTimeline",
		"profile",
		"profileEnd",
		"table",
		"time",
		"timeEnd",
		"timeStamp",
		"trace",
		"warn",
	];
	var length = methods.length;
	var console = (window.console = window.console || {});

	while (length--) {
		method = methods[length];

		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
})();

String.prototype.formatArray = function (a) {
	return this.replace(/\{(\d+)\}/g, function (r, e) {
		return a[e];
	});
};
String.prototype.render = function (obj) {
	return this.replace(/\{(\w+)\}/g, function (r, e) {
		return obj[e];
	});
};
String.prototype.replaceAll =
	String.prototype.replaceAll ||
	function (needle, replacement) {
		return this.split(needle).join(replacement);
	};

if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, "");
	};
}

if (!String.prototype.capitalize) {
	String.prototype.capitalize = function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
}

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function (f, c) {
		for (var i = 0; i < this.length; i++) {
			f.call(c, this[i], i, this);
		}
	};
}
if (!Array.prototype.map) {
	Array.prototype.map = function (f, c) {
		for (var r = [], i = 0; i < this.length; i++) {
			r[i] = f.call(c, this[i], i, this);
		}
		return r;
	};
}
if (!Array.prototype.filter) {
	Array.prototype.filter = function (f, c) {
		for (var r = [], j = 0, i = 0, s = this, t; i < s.length; i++) {
			if (f.call(c, (t = s[i]), i, s)) {
				r[j++] = t;
			}
		}
		return r;
	};
}
if (!Array.prototype.some) {
	Array.prototype.some = function (f, c) {
		for (var i = 0; i < this.length; i++) {
			if (f.call(c, this[i], i, this)) {
				break;
			}
		}
		return i < this.length;
	};
}
if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5
			// internal IsCallable function
			throw new TypeError(
				"Function.prototype.bind - what is trying to be bound is not callable"
			);
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			Noop = function () {},
			fBound = function () {
				return fToBind.apply(
					this instanceof Noop ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments))
				);
			};

		Noop.prototype = this.prototype;
		fBound.prototype = new Noop();

		return fBound;
	};
}

if (!Object.keys) {
	Object.keys = (function () {
		var hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !{
				toString: null,
			}.propertyIsEnumerable("toString"),
			dontEnums = [
				"toString",
				"toLocaleString",
				"valueOf",
				"hasOwnProperty",
				"isPrototypeOf",
				"propertyIsEnumerable",
				"constructor",
			],
			dontEnumsLength = dontEnums.length;

		return function (obj) {
			if (
				typeof obj !== "object" &&
				(typeof obj !== "function" || obj === null)
			) {
				throw new TypeError("Object.keys called on non-object");
			}

			var result = [],
				prop,
				i;

			for (prop in obj) {
				if (hasOwnProperty.call(obj, prop)) {
					result.push(prop);
				}
			}

			if (hasDontEnumBug) {
				for (i = 0; i < dontEnumsLength; i++) {
					if (hasOwnProperty.call(obj, dontEnums[i])) {
						result.push(dontEnums[i]);
					}
				}
			}
			return result;
		};
	})();
}

if (!Array.prototype.find) {
	Array.prototype.find = function (predicate) {
		if (this === null) {
			throw new TypeError(
				"Array.prototype.find called on null or undefined"
			);
		}

		if (typeof predicate !== "function") {
			throw new TypeError("predicate must be a function");
		}

		var list = Object(this);
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		var value;

		for (var i = 0; i < length; i++) {
			value = list[i];

			if (predicate.call(thisArg, value, i, list)) {
				return value;
			}
		}

		return undefined;
	};
}

if (!window.getCookie) {
	window.getCookie = function (name) {
		var match = document.cookie.match(new RegExp(name + "=([^;]+)"));

		if (match) {
			return match[1];
		}
	};
}

//jQuery extensions
(function ($) {
	/*$.appendUrl = function(obj){
		$.each(obj, function(key, value){
			$(key).each(function(){
				var self = $(this),
					href = self.attr('href') || '';
				if( href.indexOf('#') !== -1 || href.indexOf('javascript') !== -1 ) return;
				self.attr('href', href + ( href.indexOf('?') === -1 ? '?' : '&') + value);
			});
		});
	};*/

	$.currencyToInt = function (currency) {
		return +currency.replace(/\D/gi, "");
	};

	$.calculateBusinessDays = function (fromDate, days) {
		var count = 0;
		fromDate = new Date(fromDate);
		while (count < days) {
			fromDate.setDate(fromDate.getDate() + 1);
			if (fromDate.getDay() !== 0 && fromDate.getDay() !== 6) {
				count++;
			}
		}
		return fromDate;
	};

	$.calculateDays = function (fromDate, days) {
		var count = 0;
		fromDate = new Date(fromDate);
		while (count < days) {
			fromDate.setDate(fromDate.getDate() + 1);
			count++;
		}
		return fromDate;
	};

	$.formatDatetime = function (date, delimiter) {
		delimiter = delimiter || "/";
		var d = date ? new Date(date) : new Date();
		var month = d.getMonth() + 1;
		var day = d.getDate();

		return (
			d.getFullYear() +
			delimiter +
			(month < 10 ? "0" : "") +
			month +
			delimiter +
			(day < 10 ? "0" : "") +
			(date ? day : day)
		);
	};

	$.formatDatetimeBRL = function (date, delimiter) {
		delimiter = delimiter || "/";
		var d = date ? new Date(date) : new Date();
		var month = d.getMonth() + 1;
		var day = d.getDate();
		return (
			(day < 10 ? "0" : "") +
			day +
			delimiter +
			(month < 10 ? "0" : "") +
			month +
			delimiter +
			d.getFullYear()
		);
	};

	$.diffDate = function (date1, date2) {
		var diffc = new Date(date1).getTime() - new Date(date2).getTime();
		var days = Math.round(Math.abs(diffc / (1000 * 60 * 60 * 24)));
		return days;
	};

	$.reduce = function (arr, fnReduce, valueInitial) {
		if (Array.prototype.reduce) {
			return Array.prototype.reduce.call(arr, fnReduce, valueInitial);
		}

		$.each(arr, function (i, value) {
			valueInitial = fnReduce.call(null, valueInitial, value, i, arr);
		});
		return valueInitial;
	};

	$.getParameterByName = function (name, string) {
		name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("(?:[\\?&]|^)" + name + "=([^&#]*)"),
			results = regex.exec(string || window.location.search || "");
		return results
			? decodeURIComponent(results[1].replace(/\+/g, " "))
			: "";
	};

	$.replaceSpecialChars = function (str) {
		return str
			.toLowerCase()
			.replace(/[àáâãäå]/gi, "a")
			.replace(/[éèëê]/gi, "e")
			.replace(/[íìïî]/gi, "i")
			.replace(/[óòõöô]/gi, "o")
			.replace(/[uúùüû]/gi, "u")
			.replace(/[ç]/gi, "c")
			.replace(/^[0-9]/gi, "")
			.replace(/\s/gi, "-");
	};

	$.getImagePath = function (img) {
		if (!/^http/.test(img) && !/^\/arquivos/.test(img)) {
			img = "//" + window.jsnomeLoja + ".vteximg.com.br/arquivos/" + img;
		}
		return img;
	};

	$.resizeImage = function (url, width, height) {
		return (
			(url = url.replace(/ids\/.+-(\d+)-(\d+)/, function (e, w, h) {
				return e.replace(w, width).replace(h, height);
			})),
			url.replace(/(ids\/[0-9]+)\//, "$1-" + width + "-" + height + "/")
		);
	};

	$.extend($.fn, {
		toScroll: function (offset) {
			var self = $(this);
			if (!self || self.length === 0 || !self.is(":visible")) {
				return;
			}

			$("html, body")
				.stop()
				.animate(
					{
						scrollTop: self.offset().top + (offset || 0) + "px",
					},
					1000
				);
		},
		scrollTo: function (target, offset) {
			$(target || $(this).attr("href")).toScroll(offset);
		},
		exists: function () {
			return $(this).length > 0 ? true : false;
		},
		validEmail: function () {
			var emailRegexp = new RegExp(
				"^[a-z0-9$&!%_-]+(.[_a-z0-9]+)*@[a-z0-9-]+(.[a-z0-9-]+)*(.[a-z]{2,15})$",
				"i"
			);
			return emailRegexp.test($(this).val());
		},
		validFullName: function () {
			return /(.*){3,}\s(.*).{3,}/i.test($(this).val());
		},
		validCpf: function () {
			var value = $(this)
				.val()
				.replace(/[^\d]+/g, "");

			if (value === "") {
				return false;
			}

			// Elimina values invalidos conhecidos
			if (
				value.length !== 11 ||
				value === "00000000000" ||
				value === "11111111111" ||
				value === "22222222222" ||
				value === "33333333333" ||
				value === "44444444444" ||
				value === "55555555555" ||
				value === "66666666666" ||
				value === "77777777777" ||
				value === "88888888888" ||
				value === "99999999999"
			) {
				return false;
			}

			// Valida 1o digito
			var add = 0;
			for (var i = 0; i < 9; i++) {
				add += parseInt(value.charAt(i), 10) * (10 - i);
			}
			var rev = 11 - (add % 11);
			if (rev === 10 || rev === 11) {
				rev = 0;
			}
			if (rev !== parseInt(value.charAt(9), 10)) {
				return false;
			}
			// Valida 2o digito
			add = 0;
			for (i = 0; i < 10; i++) {
				add += parseInt(value.charAt(i), 10) * (11 - i);
			}
			rev = 11 - (add % 11);
			if (rev === 10 || rev === 11) {
				rev = 0;
			}
			if (rev !== parseInt(value.charAt(10), 10)) {
				return false;
			}

			return true;
		},
		validCnpj: function () {
			var cnpj = $(this)
				.val()
				.replace(/[^\d]+/g, "");

			if (cnpj === "") return false;

			if (cnpj.length !== 14) return false;

			// Elimina CNPJs invalidos conhecidos
			if (
				cnpj === "00000000000000" ||
				cnpj === "11111111111111" ||
				cnpj === "22222222222222" ||
				cnpj === "33333333333333" ||
				cnpj === "44444444444444" ||
				cnpj === "55555555555555" ||
				cnpj === "66666666666666" ||
				cnpj === "77777777777777" ||
				cnpj === "88888888888888" ||
				cnpj === "99999999999999"
			)
				return false;

			var tamanho, numeros, digitos, soma, pos, i, resultado;
			// Valida DVs
			tamanho = cnpj.length - 2;
			numeros = cnpj.substring(0, tamanho);
			digitos = cnpj.substring(tamanho);
			soma = 0;
			pos = tamanho - 7;
			for (i = tamanho; i >= 1; i--) {
				soma += numeros.charAt(tamanho - i) * pos--;
				if (pos < 2) pos = 9;
			}
			resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
			if (resultado !== digitos.charAt(0)) return false;

			tamanho = tamanho + 1;
			numeros = cnpj.substring(0, tamanho);
			soma = 0;
			pos = tamanho - 7;
			for (i = tamanho; i >= 1; i--) {
				soma += numeros.charAt(tamanho - i) * pos--;
				if (pos < 2) pos = 9;
			}
			resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
			if (resultado !== digitos.charAt(1)) return false;

			return true;
		},
	});

	$.extend($.expr[":"], {
		// http://jqueryvalidation.org/blank-selector/
		blank: function (a) {
			return !$.trim("" + $(a).val());
		},
		// http://jqueryvalidation.org/filled-selector/
		filled: function (a) {
			return !!$.trim("" + $(a).val());
		},
		// http://jqueryvalidation.org/unchecked-selector/
		unchecked: function (a) {
			return !$(a).prop("checked");
		},

		//Contains: function( elem ) { return $(elem).text().toUpperCase().indexOf(args.toUpperCase()) >= 0; }
	});
})(jQuery);

window.goToTopPage = $.fn.pager = $.jqzoom = $.fn.jqzoom = function () {};

/*if($.jqzoom){
	$.jqzoom.defaults = $.extend({}, $.jqzoom.defaults, {
		yOffset: 15,
		zoomType: 'innerzoom',
		zoomWidth: 420,
		zoomHeight: 420,
		showEffect: 'fadein',
		hideEffect: 'fadeout'
	} || {});
}*/

if (VERSION) {
	console.log(
		"%c %c %c vtex-d | %s Build Version: %s %c %c ",
		"background:#dfdab0; padding:2px 0;",
		"background:#666; padding:2px 0;",
		"background:#222; color:#bada55; padding:2px 0;",
		(
			window.jsnomeLoja ||
			(window.vtex &&
				window.vtex.vtexid &&
				window.vtex.vtexid.accountName) ||
			""
		)
			.replace(/\d/, "")
			.capitalize(),
		VERSION,
		"background:#666; padding:2px 0;",
		"background:#dfdab0;p adding:2px 0;"
	);

	window._trackJs = window._trackJs || {};

	window._trackJs.version = VERSION;
}
