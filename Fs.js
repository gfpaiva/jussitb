'use strict';

const { readFile, writeFile, existsSync, mkdirSync, readFileSync, renameSync } = require('fs');
const ncp = require('ncp').ncp;

ncp.limit = 16;

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
			},
			project: `${DIRNAME}/templates/project`
		};
		this.srcPaths = {
			controller: `${PROJECTDIR}\\src\\Scripts\\controllers`,
			module: `${PROJECTDIR}\\src\\Scripts\\modules`,
			page: `${PROJECTDIR}\\src\\Pages`,
			project: {
				root: `${PROJECTDIR}`,
				style: project => `${PROJECTDIR}\\${project}\\src\\Styles`,
				script: project => `${PROJECTDIR}\\${project}\\src\\Scripts`,
				HTML: project => `${PROJECTDIR}\\${project}\\src\\01 - HTML Templates`,
				SUB: project => `${PROJECTDIR}\\${project}\\src\\01 - HTML Templates\\Sub Templates`,
				SHELF: project => `${PROJECTDIR}\\${project}\\src\\02 - Shelves Templates`,
				pkg: project => `${PROJECTDIR}\\${project}\\package.json`,
				gulp: project => `${PROJECTDIR}\\${project}\\gulpfile.js`,
				config: project => `${PROJECTDIR}\\${project}\\config.js`,
			},
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

	createProject( { name, account } ) {

		return new Promise((resolve) => {

			const projectPath = `${this.srcPaths.project.root}\\${name}`;

			mkdirSync(projectPath);

			let pkgFile,
				gulpFile,
				cfgFile;

			this._copyPastePromise(this.templatePaths.project, projectPath)
				.then(() => {
					renameSync(`${this.srcPaths.project.style(name)}\\PROJECTACCOUNTNAME-style.scss`, `${this.srcPaths.project.style(name)}\\${account}-style.scss`);
					renameSync(`${this.srcPaths.project.script(name)}\\PROJECTACCOUNTNAME-app.js`, `${this.srcPaths.project.script(name)}\\${account}-app.js`);

					return;
				})
				.then(() => {
					pkgFile = readFileSync(this.srcPaths.project.pkg(name), 'utf8').replace(/PROJECTACCOUNTNAME/gm, account);
					gulpFile = readFileSync(this.srcPaths.project.gulp(name), 'utf8').replace(/PROJECTACCOUNTNAME/gm, account);
					cfgFile = readFileSync(this.srcPaths.project.config(name), 'utf8').replace(/PROJECTACCOUNTNAME/gm, account);

					return;
				})
				.then(() => this._writeFilePromise(this.srcPaths.project.pkg(name), pkgFile))
				.then(() => this._writeFilePromise(this.srcPaths.project.gulp(name), gulpFile))
				.then(() => this._writeFilePromise(this.srcPaths.project.config(name), cfgFile))
				.then(() => resolve(projectPath))
		});
	}

	createProjectHTML(templateList, templateType, projectFolderName) {

		return templateList.map(template => this._writeFilePromise(`${this.srcPaths.project[templateType](projectFolderName)}\\${template}.html`, ''));
	}

	_copyPastePromise(src, dest) {

		return new Promise((resolve) => {
			ncp(src, dest, err => {
				if(err) throw new Error(err);

				resolve(true);
			});
		});
	};

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

			const createdFile = type === 'page' ? `${this.srcPaths.page}\\${cmd.name}` : (type === 'project' ? `${this.srcPaths.project.root}\\${cmd.name}` :`${this.srcPaths[type]}\\${cmd.name}.js`);

			if(existsSync(createdFile)) return reject(`${createdFile} alredy exists`);

			return resolve(cmd);
		})
	}
}

module.exports = Fs;