'use strict';

const axios = require('axios');

class VtexId {
	constructor(account = null) {
		this.account = account;
		this.uri = `https://${this.account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
		this.token = null;
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
	};

	setAccount(account) {
		this.account = account;
		this.uri = `http://${account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
	};

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
					console.log(err);
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
					console.log(err);
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
					console.log(data.authCookie.Value);

					return data.authCookie.Value;
				})
				.catch(err => {
					console.log(err);
					throw new Error(err);
				});
	};

};

module.exports = VtexId;