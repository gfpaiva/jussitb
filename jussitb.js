'use strict';

const program = require('commander');
const Actions = require('./actions');
const message = require('./utils/cli-colors');

const ACTIONS = new Actions();

// init CLI
program
	.version('1.0.0')
	.description('Jussi CLI for VTEX utils');

program
	.command('auth')
	.description('Auth user to get VTEX-Auth-Cookies')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.action(ACTIONS.authAction);

program
	.command('html')
	.description('Auth user and Deploy HTML Templates files on VTEX CMS')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.action(ACTIONS.uploadHTMLAction);

program
	.command('sub')
	.description('Auth user and Deploy HTML Sub Templates files on VTEX CMS')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.action(ACTIONS.uploadSubHTMLAction);

program
	.command('shelf')
	.description('Auth user and Deploy HTML Shelves files on VTEX CMS')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.action(ACTIONS.uploadShelfAction);

program
	.command('assets')
	.description('Auth user and Deploy CSS and JS files on VTEX Portal')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.action(ACTIONS.uploadAssetsAction);

program
	.command('deploy')
	.description('Auth user and deploy all files (CSS, JS, HTML Templates and HTML SubTemplates) on VTEX')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.option('--force', 'Force update all files and templates')
	.action(cmd => {
		ACTIONS.uploadAssetsAction(cmd)
				.then(ACTIONS.uploadSubHTMLAction)
				.then(ACTIONS.uploadHTMLAction);
	});


program.parse(process.argv);