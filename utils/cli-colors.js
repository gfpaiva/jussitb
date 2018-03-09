'use strict';

const clc = require('cli-color');

const colors = {
	error: clc.red.bold,
	warn: clc.yellow.bold,
	notice: clc.blue.bold,
	success: clc.green.bold,
};

const message = (type = 'notice', message) => {
	console.log(colors[type](message));
};

module.exports = message;