'use strict';

const clc = require('cli-color');

module.exports = {
	error: clc.red.bold,
	warn: clc.yellow,
	notice: clc.blue,
	success: clc.green
};