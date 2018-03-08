'use strict';

const { readFileSync, readFile, readdirSync } = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const { error, success } = require('./utils/cli-colors');

const DIRNAME = __dirname;

class VtexCMS {
	constructor(account = null, authCookie, site = 'default') {
		this.account = account;
		this.authCookie = authCookie;
		this.uri = `https://${this.account}.vtexcommercestable.com.br`;
		this.endpoints = {
			setAsset: `/api/portal/pvt/sites/${site}/files`,
			setHTMLTemplate: `/admin/a/PortalManagement/SaveTemplate`,
			getHTMLTemplates: `/admin/a/PortalManagement/GetTemplateList`
		};
		this.authCookie =  {
			name: 'VtexIdclientAutCookie',
			value: authCookie
		};
		this.AXIOS = axios.create({
			baseURL: this.uri,
			headers: {
				Cookie: `${this.authCookie.name}=${this.authCookie.value};`,
				Accept: '*/*',
				'Cache-Control': 'no-cache',
			},
			timeout: 10000
		});
		this.templates = null;
	};

	setAccount(account) {
		this.account = account;
		this.uri = `http://${account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
	};

	setAssetFile() {
		const files = readdirSync(`${DIRNAME}/files`).filter(file => /\.(css|js)$/gmi.test(file));

		let uploadPromises = files.map(path => {
			return new Promise((resolve, reject ) => {
				readFile(`${DIRNAME}/files/${path}`, 'utf8', (err, text) => {
					if(err) throw new Error(err);

					this.AXIOS
						.put(`${this.endpoints.setAsset}/${path}`, {
							path,
							text
						})
						.then(( { data } ) => {
							console.log(success(`File ${path} uploaded`));

							resolve(data);

							return data;
						})
						.catch(err => {
							console.log(error(`Upload File error ${err}`));

							reject(err)
						});
				});
			});
		});

		return uploadPromises;
	};

	getHTMLTemplates() {
		return this.AXIOS
				.post(this.endpoints.getHTMLTemplates, qs.stringify({
					type: 'viewTemplate',
					IsSub: '0'
				}))
				.then(( { data } ) => {
					this.templates = data;

					return data;
				})
				.catch(err => {
					console.log(error(`Get HTML template error: ${err}`)) ;
					throw new Error(err);
				});
	};

	setHTML(templateList) {
		const files = readdirSync(`${DIRNAME}/html`).filter(file => /\.(html)$/gmi.test(file));
		const $ = cheerio.load(templateList);

		let uploadPromises = files.map(templateName => {
			return new Promise((resolve, reject ) => {
				readFile(`${DIRNAME}/html/${templateName}`, 'utf8', (err, template) => {
					if(err) throw new Error(err);

					templateName = templateName.substr(0, templateName.lastIndexOf('.html'));

					const currTemplate = $(`.template div:contains("${templateName}")`).next('a').attr('href');
					const templateId = currTemplate.match(/(templateId=)(.+)$/)[2];

					this.AXIOS
						.post(this.endpoints.setHTMLTemplate, qs.stringify({
							templateName,
							template,
							templateId,
							actionForm: 'Update',
							isSub: false,
							textConfirm: 'yes'
						}), {
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
							}
						})
						.then(( { data } ) => {
							if(data.indexOf('originalMessage') >= 0) {
								const $ = cheerio.load(data);
								const err = JSON.parse($('applicationexceptionobject').text());

								console.log(error(`Error on upload HTML Template (${templateName}): ${err.message}`));
								reject(err);
							} else {
								console.log(success(`(${templateName}) uploaded`));

								resolve(data);
							}

							return data;
						})
						.catch(err => {
							console.log(error(`Upload File error ${err}`));

							reject(err)
						});
				});
			});
		});
	};
}

module.exports = VtexCMS;