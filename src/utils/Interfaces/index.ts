import clc from 'cli-color';

/* CLI COLORS */
export interface Colors {
	error:clc.Format,
	warn:clc.Format,
	notice:clc.Format,
	success:clc.Format
};

/* VTEXID */
export interface VtexIDEndpoints {
	getToken:string,
	authenticateByEmailKey:string,
	getEmailAcessKey:string
}

export interface VteIDUserInfos {
	initialCallback: {
		callbackUrl:string,
		user:null,
		locale:string,
		accountName:string
	}
}

export interface VtexIDStart {
	authenticationToken:string,
	oauthProviders:VtexIDOauthProviders[],
	showClassicAuthentication:boolean,
	showAccessKeyAuthentication:boolean,
}

export interface VtexIDOauthProviders {
	providerName:string,
	className:string,
	expectedContext:[]
}

export interface VtexIDValidateResponse {
	authStatus:string,
	authCookie: {
		Name:string,
		Value:string
	}
}

/* COMMANDER */
export interface CommanderArgs {
	account:string,
	email:string,
	site:string,
	pathFiles:string,
	force:boolean
}