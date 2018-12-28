'use strict';

const { readFile, writeFile, existsSync, mkdirSync, readFileSync, renameSync } = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;

ncp.limit = 16;

const PROJECTDIR = process.cwd();
const DIRNAME = __dirname;

class Fs {

	constructor() {

		this.templatePaths = {
			controller: path.resolve(DIRNAME, 'templates/controller/CONTORLLERNAME.js'),
			module: path.resolve(DIRNAME, 'templates/module/MODULENAME.js'),
			page: {
				root: path.resolve(DIRNAME, 'templates/page'),
				html: path.resolve(DIRNAME, 'templates/page/0-PAGENAME.html'),
				script: path.resolve(DIRNAME, 'templates/page/scripts/PAGENAME.js'),
				scss: path.resolve(DIRNAME, 'templates/page/styles/PAGENAME.scss'),
			},
			project: path.resolve(DIRNAME, 'templates/project')
		};
		this.srcPaths = {
			controller: path.resolve(PROJECTDIR, 'src/Scripts/controllers'),
			module: path.resolve(PROJECTDIR, 'src/Scripts/modules'),
			page: path.resolve(PROJECTDIR, '/src/Pages'),
			project: {
				root: path.resolve(PROJECTDIR),
				style: project => path.resolve(PROJECTDIR, project, 'src/Styles'),
				script: project => path.resolve(PROJECTDIR, project, 'src/Scripts'),
				HTML: project => path.resolve(PROJECTDIR, project, 'src/01 - HTML Templates'),
				SUB: project => path.resolve(PROJECTDIR, project, 'src/01 - HTML Templates/Sub Templates'),
				SHELF: project => path.resolve(PROJECTDIR, project, 'src/02 - Shelves Templates'),
				pkg: project => path.resolve(PROJECTDIR, project, 'package.json'),
				gulp: project => path.resolve(PROJECTDIR, project, 'gulpfile.js'),
				config: project => path.resolve(PROJECTDIR, project, 'config.js'),
			},
		};
	};

	createJsFile ( { name, overview }, type ) {

		return new Promise((resolve) => {

			readFile(this.templatePaths[type], 'utf8', (err, data) => {
				if(err) throw new Error(err);

				const createdFile = path.resolve(this.srcPaths[type], `${name}.js`);

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

			const pagePath = path.resolve(this.srcPaths.page, name);

			// if(existsSync(pagePath)) return reject(`Page: ${pagePath} alredy exists`);

			mkdirSync(pagePath);
			mkdirSync(path.resolve(pagePath, 'images'));
			mkdirSync(path.resolve(pagePath, 'scripts'));
			mkdirSync(path.resolve(pagePath, 'styles'));

			const htmlFile = readFileSync(this.templatePaths.page.html, 'utf8')
								.replace(/PAGENAME/gm, name)
								.replace(/ACCOUNT/gm, account);

			const JsFile = readFileSync(this.templatePaths.page.script, 'utf8')
								.replace(/PAGENAME/gm, name)
								.replace(/FILEOVERVIEW/gm, overview);

			const ScssFile = readFileSync(this.templatePaths.page.scss, 'utf8').replace(/PAGENAME/gm, name);

			this._writeFilePromise(path.resolve(pagePath, `0-${name}.html`), htmlFile)
				.then(() => this._writeFilePromise(path.resolve(pagePath, `scripts/${name}.js`), JsFile))
				.then(() => this._writeFilePromise(path.resolve(pagePath, `styles/${name}.scss`), ScssFile))
				.then(() => resolve(pagePath));
		});
	}

	createProject( { name, account } ) {

		return new Promise((resolve) => {

			const projectPath = path.resolve(this.srcPaths.project.root, name);

			mkdirSync(projectPath);

			let pkgFile,
				gulpFile,
				cfgFile;

			this._copyPastePromise(this.templatePaths.project, projectPath)
				.then(() => {
					renameSync(
						path.resolve(this.srcPaths.project.style(name), 'PROJECTACCOUNTNAME-style.scss'),
						path.resolve(this.srcPaths.project.style(name), `${account}-style.scss`
					));

					renameSync(
						path.resolve(this.srcPaths.project.script(name), 'PROJECTACCOUNTNAME-app.js'),
						path.resolve(this.srcPaths.project.script(name), `${account}-app.js`
					));

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

		return templateList.map(template => this._writeFilePromise(path.resolve(this.srcPaths.project[templateType](projectFolderName), `${template}.html`), ''));
	}

	fillProjectHTML(contents) {

		return contents.map(content => this._writeFilePromise(content.file, content.html));
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

			const createdFile = type === 'page' ?
				path.resolve(this.srcPaths.page, cmd.name) :
				(type === 'project' ? path.resolve(this.srcPaths.project.root, cmd.name) : path.resolve(this.srcPaths[type], `${cmd.name}.js`));

			if(existsSync(createdFile)) return reject(`${createdFile} alredy exists`);

			return resolve(cmd);
		})
	}
}

module.exports = Fs;