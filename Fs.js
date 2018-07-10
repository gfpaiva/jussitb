'use strict';

const { readFile, writeFile, existsSync, mkdirSync, readFileSync } = require('fs');

const PROJECTDIR = process.cwd();
const DIRNAME = __dirname;

class Fs {

	constructor() {

		this.templatePaths = {
			controller: `${DIRNAME}/templates/controller/CONTORLLERNAME.js`,
			module: `${DIRNAME}/templates/module/MODULENAME.js`,
			page: {
				root: `${DIRNAME}/templates/page`,
				html: `${DIRNAME}/templates/page/0-PAGENAME.html`,
				script: `${DIRNAME}/templates/page/scripts/PAGENAME.js`,
				scss: `${DIRNAME}/templates/page/styles/PAGENAME.scss`,
			}
		};
		this.srcPaths = {
			controller: `${PROJECTDIR}\\src\\Scripts\\controllers`,
			module: `${PROJECTDIR}\\src\\Scripts\\modules`,
			page: `${PROJECTDIR}\\src\\Pages`,
		};
	};

	createJsFile ( { name, overview }, type ) {

		return new Promise((resolve) => {

			readFile(this.templatePaths[type], 'utf8', (err, data) => {
				if(err) throw new Error(err);

				const createdFile = `${this.srcPaths[type]}\\${name}.js`;

				// if(existsSync(createdFile)) return reject(`File: ${createdFile} alredy exists`);

				const result = data
								.replace(/CONTORLLERNAME|MODULENAME/gm, name)
								.replace(/FILEOVERVIEW/gm, overview);


				writeFile(createdFile, result, 'utf8', function (err) {
					if(err) throw new Error(err);

					return resolve(createdFile);
				});
			});
		});
	}

	createPage( { name, account, overview } ) {

		return new Promise((resolve) => {

			const pagePath = `${this.srcPaths.page}\\${name}`;

			// if(existsSync(pagePath)) return reject(`Page: ${pagePath} alredy exists`);

			mkdirSync(pagePath);
			mkdirSync(`${pagePath}\\images`);
			mkdirSync(`${pagePath}\\scripts`);
			mkdirSync(`${pagePath}\\styles`);

			const htmlFile = readFileSync(this.templatePaths.page.html, 'utf8')
								.replace(/PAGENAME/gm, name)
								.replace(/ACCOUNT/gm, account);

			const JsFile = readFileSync(this.templatePaths.page.script, 'utf8')
								.replace(/PAGENAME/gm, name)
								.replace(/FILEOVERVIEW/gm, overview);

			const ScssFile = readFileSync(this.templatePaths.page.scss, 'utf8').replace(/PAGENAME/gm, name);

			this._writeFilePromise(`${pagePath}\\0-${name}.html`, htmlFile)
				.then(() => this._writeFilePromise(`${pagePath}\\scripts\\${name}.js`, JsFile))
				.then(() => this._writeFilePromise(`${pagePath}\\styles\\${name}.scss`, ScssFile))
				.then(() => resolve(pagePath));
		});
	}

	_writeFilePromise(file, content) {

		return new Promise((resolve, reject) => {
			writeFile(file, content, 'utf8', function (err) {
				if(err) throw new Error(err);

				resolve(file);
			});
		});
	};

	checkCreate( cmd, type ) {

		return new Promise((resolve, reject) => {

			const createdFile = type === 'page' ? `${this.srcPaths[type]}\\${cmd.name}` : `${this.srcPaths[type]}\\${cmd.name}.js`;

			if(existsSync(createdFile)) return reject(`${createdFile} alredy exists`);

			return resolve(cmd);
		})
	}
}

module.exports = Fs;