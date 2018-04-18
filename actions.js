'use strict';

const { prompt } = require('inquirer');
const { readFileSync, readdirSync } = require('fs');
const jsonfile = require('jsonfile');

const message = require('./utils/cli-colors');
const VtexId = require('./vtexid');
const VtexCMS = require('./vtexcms');

const PROJECTDIR = process.cwd();
const VTEXID = new VtexId();
let VTEXCMS = null;

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
		this.uploadHTMLAction = this.uploadHTMLAction.bind(this);
		this.uploadSubHTMLAction = this.uploadSubHTMLAction.bind(this);
		this.uploadShelfAction = this.uploadShelfAction.bind(this);
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

	authAction( { email = null, account = null, site = 'default' } ) {
		this._checkPath();

		if(VTEXID.authCookie) return Promise.resolve(VTEXID.authCookie);

		const questions = [];

		if(!email) {
			questions.push({ type: 'input', name: 'email', message: 'Enter your e-mail' })
		} else {
			this.email = email;
		}

		if(!account) {
			questions.push({ type: 'input', name: 'account', message: 'Enter the VTEX account' });
		} else {
			this.account = account;
		}

		return prompt(questions)
				.then(( { account, email } ) => {
					if(!this.account) this.account = account;
					if(!this.email) this.email = email;

					VTEXID.setAccount(this.account);

					return VTEXID.getEmailAccessKey(this.email);
				})
				.then(() => prompt({ type: 'input', name: 'accesskey', message: 'Enter the VTEX Access Key (with 6 digits)' }))
				.then(( { accesskey } ) => VTEXID.authenticateByEmailKey(this.email, accesskey))
				.then(authCookie => {
					VTEXCMS = new VtexCMS(this.account, authCookie, site);

					return authCookie;
				});
	};

	uploadAssetsAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {
				return Promise.all(VTEXCMS.setAssetFile())
				.then(files => {
					files.map(file => message('success', `Uploaded File ${file}`));
					return cmd;
				});
			});
	};

	uploadHTMLAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {
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
				return VTEXCMS.getHTMLTemplates(true, true)
						.then(templateList => Promise.all(VTEXCMS.setHTML(templateList, false, true, cmd)))
						.then(responses => {
							this._successUpload(responses);
							return cmd;
						});
			});
	};

	_successUpload(responses) {
		responses.map(( { type, templateName, content, account } ) => {
			message(type, `${type === 'success' ? 'Uploaded' : 'Hold' } Template ${templateName}`);

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

			jsonfile.writeFileSync(this.localPaths.lockPath, newLock);
		});
	};
};

module.exports = Actions;