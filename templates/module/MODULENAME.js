/**
 *
 * @fileOverview FILEOVERVIEW
 *
 */
'use strict';

Nitro.module('MODULENAME', [], function() {
	/**
	 * Apenas um exemplo arrow func com retorno
	 * @param  {String} param um texto que será concatenado
	 * @returns {String} texto example with concatenando param
	 */
	this.method = param => `example with ${param}`;
});
