'use strict';

import clc from 'cli-color';
import { Colors } from './Interfaces';

export enum ColorType {
	notice = "notice",
	error = "error",
	warn = "warn",
	success = "success"
}

const colors:Colors = {
	error: clc.red.bold,
	warn: clc.yellow.bold,
	notice: clc.blue.bold,
	success: clc.green.bold
};

const message = (type:ColorType = ColorType.notice, message:string) => {
	console.log(colors[type](message));
};

export default message;