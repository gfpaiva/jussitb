'use strict';

const { readFileSync, readFile, readdirSync } = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const ProgressBar = require('progress');
const md5 = require('md5');
const jsonfile = require('jsonfile');
const message = require('./utils/cli-colors');

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
		this.defaultBar = total => new ProgressBar('uploading [:bar] :percent - :current/:total', {
			total,
			complete: '=',
			incomplete: ' ',
			width: 20,
		});
		this.lockPath = `${__dirname}/jussitb.lock.json`;
	};

	/**
	 * Set a account name and redefine uri
	 * @param  {String} account account name
	 */
	setAccount(account) {
		this.account = account;
		this.uri = `http://${account}.vtexcommercestable.com.br/api/vtexid/pub/authentication`;
	};

	/**
	 * Save CSS and JS files on "Portal (/files)" on VTEX
	 * @returns {Array} Array of promises
	 */
	setAssetFile() {
		const files = readdirSync(`${__dirname}/files`).filter(file => /\.(css|js)$/gmi.test(file));
		const bar = this.defaultBar(files.length);

		const genPromises = path => {
			return new Promise((resolve, reject ) => {
				readFile(`${__dirname}/files/${path}`, 'utf8', (err, text) => {
					if(err) throw new Error(err);

					this.AXIOS
						.put(`${this.endpoints.setAsset}/${path}`, {
							path,
							text
						})
						.then(( { data } ) => {
							bar.tick();
							resolve(path);
						})
						.catch(err => {
							message('error', `Upload File error ${err}`)
							reject(err)
						});
				});
			});
		};

		let uploadPromises = files.map(genPromises);

		return uploadPromises;
	};

	/**
	 * Get HTML of templates on VTEX CMS
	 * @param  {Boolean} IsSub specify if want to get subtemplates
	 * @param  {Boolean} isShelf specify if want to get shelves templates
	 * @returns {Promise} Promise with templates (in HTML format)
	 */
	getHTMLTemplates(IsSub = false, isShelf = false) {
		IsSub = IsSub ? '1' : '0';
		isShelf = isShelf ? 'shelfTemplate' : 'viewTemplate'

		return this.AXIOS
				.post(`${this.endpoints.getHTMLTemplates}?type=${isShelf}&IsSub=${IsSub}`, qs.stringify({
					type: isShelf,
					IsSub
				}), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
					}
				})
				.then((  data  ) => {
					// console.log(data);
					this.templates = data.data;
					return data.data;
				})
				.catch(err => {
					message('error', `Get HTML template error: ${err}`);
					throw new Error(err);
				});
	};

	/**
	 * Save HTML files on VTEX CMS Portal
	 * @param  {String} templateList HTML with list of templates returned by getHTMLTemplates method
	 * @param  {Boolean} isSub specify if want to set a subtemplates
	 * @param  {Boolean} isShelf specify if want to set a shelf template
	 * @param  {Object} cmd object with cmd commander params/options
	 * @returns {Array} Array of promises
	 */
	setHTML(templateList, isSub = false, isShelf = false, { force }) {
		const filesDir = isShelf ? `${__dirname}/shelf` : `${__dirname}/html${isSub ? '/sub' : '' }`;
		const files = readdirSync(filesDir).filter(file => /\.(html)$/gmi.test(file));
		const $ = cheerio.load(templateList);
		const bar = this.defaultBar(files.length);
		const lock = jsonfile.readFileSync(this.lockPath, { throws: false });
		bar.tick(0);

		if(!lock) jsonfile.writeFileSync(this.lockPath, {});

		const genPromises = templateName => {
			return new Promise((resolve, reject ) => {
				readFile(`${filesDir}/${templateName}`, 'utf8', (err, template) => {
					if(err) {
						message('error', err);
						reject(err);
						throw new Error(err);
					}

					templateName = templateName.substr(0, templateName.lastIndexOf('.html'));

					if( !force && lock && lock[templateName] && lock[templateName].content === md5(template) ) {
						bar.tick();
						return resolve({ templateName, type: 'notice' })
					};

					const currTemplate = $(`.template div:contains("${templateName}")`).next('a').attr('href');
					const templateId = currTemplate.match(/(templateId=)(.+)$/)[2];

					let reqData = {
						templateName,
						template,
						templateId,
						isSub,
						actionForm: 'Update',
						textConfirm: 'yes'
					};

					if(isShelf) {
						reqData = {
							...reqData,
							roundCorners: false,
							templateCssClass: 'teste'
						};
					}

					this.AXIOS
						.post(this.endpoints.setHTMLTemplate, qs.stringify(reqData), {
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
							}
						})
						.then(( { data } ) => {
							if(data.indexOf('originalMessage') >= 0) {
								const $ = cheerio.load(data);
								const err = JSON.parse($('applicationexceptionobject').text());

								message('error', `Error on upload HTML Template (${templateName}): ${err.message}`);
								reject(err);
							} else {
								bar.tick();
								let newLock = {
									...lock,
									[templateName]: {
										content: md5(template),
										lastUpdate: new Date()
									}
								};
								jsonfile.writeFileSync(this.lockPath, newLock);
								resolve({
									templateName,
									type: 'success'
								});
							}
						})
						.catch(err => {
							message('error', `Upload Template error ${err}`);
							reject(err)
						});
				});
			});
		};

		let uploadPromises = files.map(genPromises);

		return uploadPromises;
	};
}

module.exports = VtexCMS;