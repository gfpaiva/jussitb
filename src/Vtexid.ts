'use strict';

import axios, { AxiosResponse, AxiosError } from 'axios';
import path from 'path';
import jsonfile from 'jsonfile';
import qs from 'qs';

import message, { ColorType } from './utils/cli-colors';
import { VteIDUserInfos, VtexIDEndpoints, VtexIDStart, VtexIDValidateResponse } from './utils/Interfaces';

const DIRNAME = __dirname;
const PROJECTDIR = process.cwd();

export default class VtexId {
	private account:string;
	private uri:string;
	private token:string;
	private authCookie:string;
	private endpoints:VtexIDEndpoints;
	private userInfos:VteIDUserInfos;
	private storeAuthCookiePath:string;
	/**
	* HTTP Call '/accesskey/send' to send the e-mail with accessKey.
	*/
	private _getEmailAccessKey(email:string, authenticationToken:string = this.token):Promise<AxiosResponse<{}>> {
		return axios
				.post(`${this.uri}${this.endpoints.getEmailAcessKey}`, qs.stringify({
						email,
						authenticationToken
				}))
				.catch((err:AxiosError) => {
					message(ColorType.error, `Cannot send the e-mail with access token. ${err.message}`);
					throw new Error();
				});
	}
	/**
	* Check if the storage auth token has less than 8 hours.
	*/
	private _checkDiffDate(storeDate:string):boolean {
		const diffDate = new Date().getTime() - new Date(storeDate).getTime();
		return Math.round(Math.abs(diffDate) / 36e5) < 8;
	}

	constructor(account = '') {
		this.account = account;
		this.uri = `https://${this.account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
		this.token = '';
		this.authCookie = '';
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
		this.storeAuthCookiePath = path.resolve(PROJECTDIR, 'jussitb.auth.json');
	}

	/**
	* Account setter. Also set the URI with account
	*/
	setAccount(account:string):void {
		this.account = account;
		this.uri = `http://${account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
	}

	/**
	* AuthCookie setter
	*/
	setAuthCookie(authCookie:string):void {
		this.authCookie = authCookie;
	}

	/**
	* HTTP Call '/start' to get the initial AuthToken to make another calls in VTEXID
	*/
	async getToken():Promise<string> {
		try {
			const { data }:AxiosResponse<VtexIDStart> = await axios
			.get(`${this.uri}${this.endpoints.getToken}`, {
				params: {
					...this.userInfos.initialCallback,
					appStart: true,
				}
			});

			this.token = data.authenticationToken;
			return data.authenticationToken;
		} catch(err) {
			message(ColorType.error, `Cannot get VTEXID Token to start the login logic. ${err.message}`);
			throw new Error();
		}
	}

	/**
	* HTTP Call '_getEmailAccessKey' to send the e-mail with accessKey after checks if initial token exists (if not get the token)
	*/
	async getEmailAccessKey(email:string):Promise<AxiosResponse<{}>> {
		if(!this.token) await this.getToken();
		return this._getEmailAccessKey(email);
	}

	/**
	* HTTP Call '/accesskey/validate' to validate
	*/
	async authenticateByEmailKey(login:string, accesskey:string):Promise<string> {
		try {
			const { data }:AxiosResponse<VtexIDValidateResponse> = await axios
			.post(`${this.uri}${this.endpoints.authenticateByEmailKey}`, qs.stringify({
					login,
					accesskey,
					authenticationToken: this.token
			}));

			this.authCookie = data.authCookie.Value;
			return data.authCookie.Value;
		} catch(err) {
			message(ColorType.error, `Cannot authenticate in VTEX (probably typed a wrong access key). ${err.message}`);
			throw new Error();
		}
	}

	/**
	* Check if alredy have a AuthCookie stored in 'jussitb.auth.json' and has a valid date to return it or not
	*/
	checkAuthStore(account:string, email:string, writeAuthStore:boolean):string|boolean {
		const storeAuthCookie = jsonfile.readFileSync(this.storeAuthCookiePath, { throws: false });

		if(!storeAuthCookie) {
			if(writeAuthStore) jsonfile.writeFileSync(this.storeAuthCookiePath, {});
			return false;
		}

		if(storeAuthCookie[account]
			&& storeAuthCookie[account][email]
			&& this._checkDiffDate(storeAuthCookie[account][email].lastUpdate)) return storeAuthCookie[account][email].authCookie;

		return false;
	}

	/**
	* Write a AuthCookie stored in 'jussitb.auth.json' to cache in another calls
	*/
	writeAuthStore(account:string, email:string, authCookie:string):void {
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
};