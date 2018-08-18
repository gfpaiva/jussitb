'use strict';

const axios = require('axios');
const message = require('./utils/cli-colors');
const jsonfile = require('jsonfile');

const DIRNAME = __dirname;
const PROJECTDIR = process.cwd();

class VtexId {
	constructor(account = null) {
		this.account = account;
		this.uri = `https://${this.account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
		this.token = null;
		this.authCookie = null;
		this.endpoints = {
			getToken: '/start',
			authenticateByEmailKey: '/accesskey/validate',
			getEmailAcessKey: '/accesskey/send'
		};
		this.userInfos = {
			initialCallback: {
				callbackUrl: `${this.uri}/finish`,
				user: null,
				locale: 'pt-BR',
				accountName: this.account
			}
		};
		this.storeAuthCookiePath = `${PROJECTDIR}/jussitb.auth.json`;
	};

	setAccount(account) {
		this.account = account;
		this.uri = `http://${account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
	};

	setAuthCookie(authCookie) {
		this.authCookie = authCookie;
	}

	getToken() {
		return axios
				.get(`${this.uri}${this.endpoints.getToken}`, {
					params: {
						...this.userInfos.initialCallback,
						appStart: true,
					}
				})
				.then(( { data } ) => {
					if(data && data.authenticationToken) {
						this.token = data.authenticationToken;
						return data.authenticationToken;
					}
				})
				.catch(err => {
					message('error', err);
					throw new Error(err);
				});
	};

	getEmailAccessKey(email) {
		if(!this.token) {
			return this.getToken()
					.then(token => this._getEmailAccessKey(email, token))
		} else {
			return this._getEmailAccessKey(email);
		}
	};

	_getEmailAccessKey(email, authenticationToken = this.token) {
		return axios
				.get(`${this.uri}${this.endpoints.getEmailAcessKey}`, {
					params: {
						email,
						authenticationToken
					}
				})
				.catch(err => {
					message('error', err);
					throw new Error(err);
				});
	};

	authenticateByEmailKey(login, accesskey) {
		return axios
				.get(`${this.uri}${this.endpoints.authenticateByEmailKey}`, {
					params: {
						login,
						accesskey,
						authenticationToken: this.token
					}
				})
				.then(( { data } ) => {
					this.authCookie = data.authCookie.Value;
					return data.authCookie.Value;
				})
				.catch(err => {
					message('error', err);
					throw new Error(err);
				});
	};

	checkAuthStore(account, email) {

		const storeAuthCookie = jsonfile.readFileSync(this.storeAuthCookiePath, { throws: false });

		if(!storeAuthCookie) {
			jsonfile.writeFileSync(this.storeAuthCookiePath, {});
			return false;
		}

		if(storeAuthCookie[account]
			&& storeAuthCookie[account][email]
			&& this._checkDiffDate(storeAuthCookie[account][email].lastUpdate)) return storeAuthCookie[account][email].authCookie;

		return false;
	}

	writeAuthStore(account, email, authCookie) {

		const storeAuthCookie = jsonfile.readFileSync(this.storeAuthCookiePath, { throws: false });
		const newStoreAuthCookie = {
			...storeAuthCookie,
			[account]: {
				...storeAuthCookie[account],
				[email]: {
					authCookie,
					lastUpdate: new Date()
				}
			}
		};

		jsonfile.writeFileSync(this.storeAuthCookiePath, newStoreAuthCookie, {spaces: 4});
	}

	_checkDiffDate(storeDate) {

		return Math.round(Math.abs(new Date() - new Date(storeDate)) / 36e5) < 8;
	}

};

module.exports = VtexId;