#!/usr/bin/env node

'use strict';

import pkg from '../package.json';
import program from 'commander';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

import { CommanderArgs } from './utils/Interfaces'
import Actions from './Actions';
import message, { ColorType } from './utils/cli-colors';

const ACTIONS = new Actions();
const PROJECTDIR = process.cwd();

// init CLI
program
	.version(pkg.version)
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
	.option('--site <site>', 'Set the site for upload on portal ("default" if not provide)')
	.action(ACTIONS.uploadAssetsAction);

program
	.command('defaultAssets')
	.description('Auth user and Deploy CSS and JS files on VTEX CMS')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.action(ACTIONS.uploadDefaultAssetsAction);

program
	.command('deploy')
	.description('Auth user and deploy all files (CSS, JS, HTML Templates and HTML SubTemplates) on VTEX')
	.option('--account <account>', 'Set the VTEX account name')
	.option('--email <email>', 'Set the email account')
	.option('--site <site>', 'Set the site for upload on portal ("default" if not provide)')
	.option('--pathFiles <path>', 'Set the location to upload assets: "files" or "arquivos"')
	.option('--force', 'Force update all files and templates')
	.action(async (cmd:CommanderArgs) => {

		await ACTIONS.uploadAssetsAction(cmd);
		if(cmd && cmd.pathFiles && cmd.pathFiles === 'arquivos') await ACTIONS.uploadDefaultAssetsAction(cmd);
		await ACTIONS.uploadSubHTMLAction(cmd);
		await ACTIONS.uploadHTMLAction(cmd);
		await ACTIONS.uploadShelfAction(cmd);
	});

program
	.command('createController')
	.description('Create a new Nitro Controller in project structure')
	.action(ACTIONS.createStatic.bind(ACTIONS, 'controller'));

program
	.command('createModule')
	.description('Create a new Nitro Module in project structure')
	.action(ACTIONS.createStatic.bind(ACTIONS, 'module'));

program
	.command('createPage')
	.option('--account <account>', 'Set the VTEX project/account name')
	.description('Create a new Page in project structure')
	.action((cmd:CommanderArgs) => ACTIONS.createStatic('page', cmd));

program
	.command('createProject')
	.option('--account <account>', 'Set the VTEX project/account name')
	.description('Create a new Project structure')
	.action(ACTIONS.createProject);

program
	.command('dirname')
	.action(() => {
		console.log('DIRNAME: ', __dirname);
		console.log('FILENAME: ', __filename);
		console.log('PROCESS: ', process.cwd());

		ACTIONS.checkPath();
	});

program.parse(process.argv);