'use strict';

const { prompt } = require('inquirer');

const message = require('./utils/cli-colors');
const VtexId = require('./vtexid');
const VtexCMS = require('./vtexcms');

const VTEXID = new VtexId();
let VTEXCMS = null;

class Actions {
	constructor() {
		this.account = null;
		this.email = null;

		// \/ Just to maintain the scope
		this.authAction = this.authAction.bind(this);
		this.uploadAssetsAction = this.uploadAssetsAction.bind(this);
		this.uploadHTMLAction = this.uploadHTMLAction.bind(this);
		this.uploadSubHTMLAction = this.uploadSubHTMLAction.bind(this);
	};

	authAction( { email = null, account = null} ) {
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
				.then(( { accesskey } ) => VTEXID.authenticateByEmailKey(email, accesskey))
				.then(authCookie => {
					VTEXCMS = new VtexCMS(account, authCookie);

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
							responses.map(( { type, templateName } ) => message(type, `${type === 'success' ? 'Uploaded' : 'Hold' } Template ${templateName}`));
							return cmd;
						});
			});
	};

	uploadSubHTMLAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {
				return VTEXCMS.getHTMLTemplates(true, true)
						.then(templateList => Promise.all(VTEXCMS.setHTML(templateList, true, false, cmd)))
						.then(responses => {
							responses.map(( { type, templateName } ) => message(type, `${type === 'success' ? 'Uploaded' : 'Hold' } SubTemplate ${templateName}`))
							return cmd;
						});
			});
	};

	uploadShelfAction(cmd) {
		return this.authAction(cmd)
			.then(authCookie => {
				return VTEXCMS.getHTMLTemplates(true)
						.then(templateList => Promise.all(VTEXCMS.setHTML(templateList, false, true, cmd)))
						.then(responses => {
							responses.map(( { type, templateName } ) => message(type, `${type === 'success' ? 'Uploaded' : 'Hold' } SubTemplate ${templateName}`))
							return cmd;
						});
			});
	};
};

module.exports = Actions;