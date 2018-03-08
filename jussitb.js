'use strict';

const program = require('commander');
const { prompt } = require('inquirer');
const { readFileSync, readFile, readdirSync } = require('fs');

const VtexId = require('./vtexid');
const VtexCMS = require('./vtexcms');
const VTEXID = new VtexId();

let account = null;
let email = null

const authAction = cmd => {
	const questions = [];
	email = cmd.email ? cmd.email : null;
	account = cmd.account ? cmd.account : null;

	if(!email) questions.push({ type: 'input', name: 'email', message: 'Enter your e-mail' });

	if(!account) questions.push({ type: 'input', name: 'account', message: 'Enter the VTEX account' });

	prompt(questions)
		.then(answers => {
			if(!account) account = answers.account;
			if(!email) email = answers.email;

			VTEXID.setAccount(account);

			return VTEXID.getEmailAccessKey(email);
		})
		.then(() => prompt({ type: 'input', name: 'accesskey', message: 'Enter the VTEX Access Key (with 6 digits)' }))
		.then(( { accesskey } ) => VTEXID.authenticateByEmailKey(email, accesskey))
		.then(authCookie => {
			const VTEXCMS = new VtexCMS(account, authCookie);


			VTEXCMS.getHTMLTemplates()
				.then(templateList => VTEXCMS.setHTML(templateList));

			// Promise.all(VTEXCMS.setAssetFile())
			// 	.then(() => console.log('subiu tudin'));


		});
};

// init program
program
	.version('1.0.0')
	.description('Jussi CLI for VTEX utils');

program
	.command('auth')
	.description('Auth user to get VTEX-Auth-Cookies')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.action(authAction);

program
	.command('html')
	.description('Aueh user and Deploy HTML files in VTEX CMS')
	.option('--account <account>', 'Set the VTEX account name')
	.action();

program.parse(process.argv);