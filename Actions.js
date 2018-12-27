'use strict';

const { prompt } = require('inquirer');
const { readFileSync, readdirSync } = require('fs');
const jsonfile = require('jsonfile');
const Spinner = require('cli-spinner').Spinner;
const exec = require('child_process').exec;

const message = require('./utils/cli-colors');
const VtexId = require('./Vtexid');
const VtexCMS = require('./Vtexcms');
const Fs = require('./Fs');

const PROJECTDIR = process.cwd();
const VTEXID = new VtexId();
const FS = new Fs();
let VTEXCMS = null;

let fileOverview = [ { type: 'input', name: 'overview', message: 'Description of the file' } ];

class Actions {
	constructor() {
		this.account = null;
		this.email = null;
		this.localPaths = {
			lockPath: `${PROJECTDIR}/jussitb.lock.json`,
		};

		// \/ Just to maintain the scope
		this.authAction = this.authAction.bind(this);
		this.uploadAssetsAction = this.uploadAssetsAction.bind(this);
		this.uploadDefaultAssetsAction = this.uploadDefaultAssetsAction.bind(this);
		this.uploadHTMLAction = this.uploadHTMLAction.bind(this);
		this.uploadSubHTMLAction = this.uploadSubHTMLAction.bind(this);
		this.uploadShelfAction = this.uploadShelfAction.bind(this);
		this.createController = this.createController.bind(this);
		this.createModule = this.createModule.bind(this);
		this.createPage = this.createPage.bind(this);
		this.createProject = this.createProject.bind(this);
	};

	_checkPath() {
		const isRoot = readFileSync(`${PROJECTDIR}/package.json`);

		try {
			readdirSync(`${PROJECTDIR}/build`);
		} catch(err) {
			message('error', 'Plese run in root of the project after build all files');

			throw new Error(err);
		}

		if(!isRoot) {
			message('error', 'Plese run in root of the project after build all files');

			throw new Error(err);
		}
	}

	_createFileQuestions(type) {
		return [
			{ type: 'input', name: 'name', message: `Enter the name of the ${type}` }
		];
	}

	createController() {

		const questions = this._createFileQuestions('controller');
		let totalCmd = {};

		return prompt(questions)
				.then((res) => FS.checkCreate(res, 'controller'))
				.then((res) => totalCmd = res)
				.then(() => prompt(fileOverview))
				.then(res => {
					totalCmd = {
						...totalCmd,
						...res
					}

					return totalCmd;
				})
				.then(cmd => FS.createJsFile(cmd, 'controller'))
				.then(file => message('success', `${file} has been created`))
				.catch(err => message('error', `Error on create controller file: ${err}`));
	}

	createModule() {

		const questions = this._createFileQuestions('module');
		let totalCmd = {};

		return prompt(questions)
				.then((res) => FS.checkCreate(res, 'module'))
				.then((res) => totalCmd = res)
				.then(() => prompt(fileOverview))
				.then(res => {
					totalCmd = {
						...totalCmd,
						...res
					}

					return totalCmd;
				})
				.then(cmd => FS.createJsFile(cmd, 'module'))
				.then(file => message('success', `${file} has been created`))
				.catch(err => message('error', `Error on create module file: ${err}`));
	}

	createPage( { account = null } ) {

		const questions = this._createFileQuestions('page');
		let totalCmd = {};

		return prompt(questions)
				.then((res) => FS.checkCreate(res, 'page'))
				.then((res) => totalCmd = res)
				.then(() => {
					if(!account) {
						fileOverview.push({ type: 'input', name: 'account', message: 'Enter the VTEX account' });
					} else {
						totalCmd.account = account;
					}

					return prompt(fileOverview)
				})
				.then(res => {
					totalCmd = {
						...totalCmd,
						...res
					}

					return totalCmd;
				})
				.then(cmd => FS.createPage(cmd))
				.then(file => message('success', `${file} has been created`))
				.catch(err => message('error', `Error on create page: ${err}`));
	}

	createProject( { account = null } ) {

		const questions = this._createFileQuestions('project');
		let totalCmd = {};

		return prompt(questions)
				.then((res) => FS.checkCreate(res, 'project'))
				.then((res) => totalCmd = res)
				.then(() => {
					let newQuestions = [];

					if(!account) {
						newQuestions.push({ type: 'input', name: 'account', message: 'Enter the VTEX account' });
					} else {
						totalCmd.account = account;
					}

					newQuestions.push({ type: 'confirm', name: 'sync', message: 'Want to sync the platform templates?' })

					return prompt(newQuestions)
				})
				.then(res => {
					totalCmd = {
						...totalCmd,
						...res
					}

					return totalCmd;
				})
				.then(cmd => FS.createProject(cmd))
				.then(project => message('success', `${project} has been created`))
				.then(() => {
					if(totalCmd.sync) return this.createHTMLLocalFiles(totalCmd);
					return true;
				})
				.then(() => {
					this._actionTitle('Installing Dependencies');
					const child = exec(`cd ${totalCmd.name} && npm install`).stderr.pipe(process.stderr);

					return true;
				})
				.catch(err => message('error', `Error on create project: ${err}`));
	}

	createHTMLLocalFiles(cmd) {

		this._actionTitle('SYNC: creating files');

		return this.authAction(cmd, false, false)
			.then(authCookie => {

				const spinner = new Spinner('Processing..');
				spinner.setSpinnerString('|/-\\');
				spinner.start();

				return VTEXCMS.getHTMLTemplates()
						.then(templateList => VTEXCMS.getTemplateNames(templateList))
						.then(templateNames => Promise.all(FS.createProjectHTML(templateNames, 'HTML', cmd.name)))
						.then(files => Promise.all(VTEXCMS.setTemplateContent(files, VTEXCMS.templates)))
						.then(filesHTML => Promise.all(FS.fillProjectHTML(filesHTML)))

						.then(() => VTEXCMS.getHTMLTemplates(true))
						.then(templateList => VTEXCMS.getTemplateNames(templateList))
						.then(templateNames => Promise.all(FS.createProjectHTML(templateNames, 'SUB' , cmd.name)))
						.then(files => Promise.all(VTEXCMS.setTemplateContent(files, VTEXCMS.templates)))
						.then(filesHTML => Promise.all(FS.fillProjectHTML(filesHTML)))

						.then(() => VTEXCMS.getHTMLTemplates(false, true))
						.then(templateList => VTEXCMS.getTemplateNames(templateList))
						.then(templateNames => Promise.all(FS.createProjectHTML(templateNames, 'SHELF' , cmd.name)))
						.then(files => Promise.all(VTEXCMS.setTemplateContent(files, VTEXCMS.templates, true)))
						.then(filesHTML => Promise.all(FS.fillProjectHTML(filesHTML)))

						.then(() => {
							spinner.stop(true);
							message('success', 'HTML Templates has been created');
						});
			});
	}

	authAction( { email = null, account = null, site = 'default' }, checkPath = true, writeAuthStore = true ) {

		if(checkPath) this._checkPath();

		if(VTEXID.authCookie) return Promise.resolve(VTEXID.authCookie);

		const questions = [];

		if(!account) {
			questions.push({ type: 'input', name: 'account', message: 'Enter the VTEX account' });
		} else {
			this.account = account;
		}

		if(!email) {
			questions.push({ type: 'input', name: 'email', message: 'Enter your e-mail' })
		} else {
			this.email = email;
		}

		return prompt(questions)
				.then(( { account, email } ) => {
					if(!this.account) this.account = account;
					if(!this.email) this.email = email;

					VTEXID.setAccount(this.account);

					const authStore = VTEXID.checkAuthStore(this.account, this.email, writeAuthStore);

					if(authStore) {
						VTEXID.setAuthCookie(authStore);
						return authStore;
					}

					return VTEXID.getEmailAccessKey(this.email)
							.then(() => prompt({ type: 'input', name: 'accesskey', message: 'Enter the VTEX Access Key (with 6 digits)' }))
							.then(( { accesskey } ) => VTEXID.authenticateByEmailKey(this.email, accesskey))
							.then(authCookie => {
								if(writeAuthStore) VTEXID.writeAuthStore(this.account, this.email, authCookie);
								return authCookie;
							});
				})
				.then(authCookie => {
					VTEXCMS = new VtexCMS(this.account, authCookie, site);
					return authCookie;
				});
	};

	uploadAssetsAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {

				this._actionTitle(`Uploading Files (/files)`);

				return Promise.all(VTEXCMS.setAssetFile(cmd))
				.then(responses => {
					// responses.map(file => message('success', `Uploaded File ${file}`));
					this._successUpload(responses, 'Asset');
					return cmd;
				});
			});
	};

	uploadDefaultAssetsAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {

				this._actionTitle(`Uploading Files (/arquivos)`);

				return VTEXCMS.getRequestToken()
					.then(requestToken => Promise.all(VTEXCMS.defaultAssets(requestToken, cmd)))
					.then(responses => {
						// responses.map(file => message('success', `Uploaded File ${file}`));
						this._successUpload(responses, 'Asset');
						return cmd;
					});
			});
	};

	uploadHTMLAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {

				this._actionTitle(`Uploading Templates HTML`);

				return VTEXCMS.getHTMLTemplates()
						.then(templateList => Promise.all(VTEXCMS.setHTML(templateList, false, false, cmd)))
						.then(responses => {
							this._successUpload(responses);
							return cmd;
						});
			});
	};

	uploadSubHTMLAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {

				this._actionTitle(`Uploading SubTemplates HTML`);

				return VTEXCMS.getHTMLTemplates(true)
						.then(templateList => Promise.all(VTEXCMS.setHTML(templateList, true, false, cmd)))
						.then(responses => {
							this._successUpload(responses);
							return cmd;
						});
			});
	};

	uploadShelfAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {

				this._actionTitle(`Uploading Shelves HTML`);

				return VTEXCMS.getHTMLTemplates(true, true)
						.then(templateList => Promise.all(VTEXCMS.setHTML(templateList, false, true, cmd)))
						.then(responses => {
							this._successUpload(responses);
							return cmd;
						});
			});
	};

	_successUpload(responses, typeFile = 'Template') {
		responses.map(( { type, templateName, content, account } ) => {
			message(type, `${type === 'success' ? 'Uploaded' : 'Hold' } ${typeFile} ${templateName}`);

			if(!content) return;

			const lock = jsonfile.readFileSync(this.localPaths.lockPath, { throws: false });
			const newLock = {
				...lock,
				[account]: {
					...lock[account],
					[templateName]: {
						content,
						lastUpdate: new Date()
					}
				}
			};

			jsonfile.writeFileSync(this.localPaths.lockPath, newLock, {spaces: 4});
		});
	};

	_actionTitle(messageText) {

		console.log('\n*****************************');
		message('notice', messageText);
		console.log('*****************************\n');
	}
};

module.exports = Actions;