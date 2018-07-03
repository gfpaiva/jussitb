'use strict';

const { readFileSync, readFile, readdirSync, createReadStream } = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const ProgressBar = require('progress');
const md5 = require('md5');
const jsonfile = require('jsonfile');
const message = require('./utils/cli-colors');
const FormData = require('form-data');

const PROJECTDIR = process.cwd();

class VtexCMS {
	constructor(account = null, authCookie, site) {
		this.account = account;
		this.authCookie = authCookie;
		this.uri = `https://${this.account}.vtexcommercestable.com.br`;
		this.baseUri = `${this.account}.vtexcommercestable.com.br`;
		this.endpoints = {
			setAsset: `/api/portal/pvt/sites/${site}/files`,
			setDefaultAsset: `/admin/a/FilePicker/UploadFile`,
			setHTMLTemplate: `/admin/a/PortalManagement/SaveTemplate`,
			setShelfTemplate: `/admin/a/PortalManagement/SaveShelfTemplate`,
			getHTMLTemplates: `/admin/a/PortalManagement/GetTemplateList`,
			getShelfTemplates: `/admin/a/PortalManagement/ShelfTemplateContent`,
			getRequestToken: `/admin/a/PortalManagement/AddFile?fileType=css`
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
			timeout: 50000
		});
		this.templates = null;
		this.defaultBar = total => new ProgressBar('uploading [:bar] :percent - :current/:total', {
			total,
			complete: '#',
			incomplete: '-',
			width: 20,
		});
		this.localPaths = {
			lockPath: `${PROJECTDIR}/jussitb.lock.json`,
			assetsPath: `${PROJECTDIR}/build/files`,
			defaultAssetsPath: `${PROJECTDIR}/build/arquivos`,
			shelvesPath: `${PROJECTDIR}/build/shelf`,
			templatesPath: `${PROJECTDIR}/build/html`,
			subTemplatesPath: `${PROJECTDIR}/build/html/sub`,
		};
	};

	/**
	 * Set a account name and redefine uri
	 * @param {String} account account name
	 */
	setAccount(account) {
		this.account = account;
		this.uri = `http://${account}.vtexcommercestable.com.br`;
		this.baseUri = `${this.account}.vtexcommercestable.com.br`;
	};

	/**
	 * Save CSS and JS files on "Portal (/files)" on VTEX
	 * @returns {Array} Array of promises
	 */
	setAssetFile() {
		const files = readdirSync(this.localPaths.assetsPath).filter(file => /\.(css|js)$/gmi.test(file));
		const bar = this.defaultBar(files.length);

		const genPromises = path => {
			return new Promise((resolve, reject ) => {
				readFile(`${this.localPaths.assetsPath}/${path}`, 'utf8', (err, text) => {
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
	 * Save CSS and JS files on "CMS (/arquivos)" on VTEX
	 * @returns {Array} Array of promises
	 */
	defaultAssets(requestToken) {
		const files = readdirSync(this.localPaths.defaultAssetsPath).filter(file => /\.(css|js)$/gmi.test(file));
		const bar = this.defaultBar(files.length);

		const genPromises = path => {
			// return console.log('PATH', `${this.localPaths.defaultAssetsPath}/${path}`, createReadStream(`${this.localPaths.defaultAssetsPath}/${path}`));
			return new Promise((resolve, reject ) => {

				const host = this.baseUri.replace(/(http:|https:|\/)/g, '');
				const filePath = `${this.localPaths.defaultAssetsPath}/${path}`;
				const form = new FormData();

				form.append('Filename', path);
				form.append('fileext', '*.js;*.css');
				form.append('requestToken', requestToken);
				form.append('folder', '/uploads');
				form.append('Upload', 'Submit Query');
				form.append('Filedata', createReadStream(filePath));

				form.submit({
					host,
					'path': this.endpoints.setDefaultAsset,
					'headers': {
							'Cookie': `${this.authCookie.name}=${this.authCookie.value};`,
							'Content-Type': form.getHeaders()['content-type']
						}
					}, (err, res) => {

						if (err) {
							message('error', `Upload File ${filePath} error: ${err}`);
							reject(err);
						}

						if (res.statusCode.toString().substr(0, 1) !== '2') {
							const errorMessage = `Upload File error ${filePath} (Error: ${res.statusCode})`;

							message('error', errorMessage);
							reject(errorMessage);
						} else {
							bar.tick();
							resolve(path);
						}
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
				.then(( { data } ) => {
					this.templates = data;
					return data;
				})
				.catch(err => {
					message('error', `Get HTML template error: ${err}`);
					throw new Error(err);
				});
	};

	/**
	 * Get HTML Shelf template by ID on VTEX CMS
	 * @param  {String} shelfTemplateId UID of Shelf Template
	 * @returns {Promise} Promise with unique template (in HTML format)
	 */
	_getShelfTemplate(shelfTemplateId) {
		return this.AXIOS
				.post(`${this.endpoints.getShelfTemplates}?shelfTemplateId=${shelfTemplateId}`, qs.stringify({
					shelfTemplateId
				}), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
					}
				})
				.then(( { data } ) => {
					return data;
				})
				.catch(err => {
					message('error', `Get Shelf template error: ${err}`);
					throw new Error(err);
				});
	};

	/**
	 * Get Request Token on VTEX CMS HTML
	 * @returns {Promise} Promise with hash contains RequestToken
	 */
	getRequestToken() {
		return this.AXIOS
				.post(`${this.endpoints.getRequestToken}`)
				.then(( { data } ) => {
					const $ = cheerio.load(data);
					const requestToken = $('#fileUploadRequestToken').val();

					if (!requestToken) {
						message('error', 'Get RequestToken error');
						throw new Error('Get RequestToken error');
					}

					return requestToken;
				})
				.catch(err => {
					message('error', `Get RequestToken error: ${err}`);
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
	setHTML(templateList, isSub = false, isShelf = false, { force, account }) {
		const filesDir = isShelf ? this.localPaths.shelvesPath : (isSub ? this.localPaths.subTemplatesPath : this.localPaths.templatesPath);
		const files = readdirSync(filesDir).filter(file => /\.(html)$/gmi.test(file));
		const $ = cheerio.load(templateList);
		const bar = this.defaultBar(files.length);
		const lock = jsonfile.readFileSync(this.localPaths.lockPath, { throws: false });
		bar.tick(0);

		if(!lock) jsonfile.writeFileSync(this.localPaths.lockPath, {});

		const genPromises = templateName => {
			return new Promise((resolve, reject ) => {
				readFile(`${filesDir}/${templateName}`, 'utf8', (err, template) => {
					if(err) {
						message('error', err);
						reject(err);
						throw new Error(err);
					}

					templateName = templateName.substr(0, templateName.lastIndexOf('.html'));

					if( !force && lock && lock[account] && lock[account][templateName] && lock[account][templateName].content === md5(template) ) {
						bar.tick();
						return resolve({ templateName, account, type: 'notice' });
					};

					const currTemplate = $(`.template div:contains("${templateName}")`).next('a').attr('href');

					try {
						currTemplate.match(/(templateId=)(.+)$/)[2];
					} catch(err) {
						message('error', `Template not found ${templateName}`);

						throw new Error(err);
					}

					const templateId = currTemplate.match(/(templateId=)(.+)$/)[2];

					let reqData = {
						templateName,
						template,
						templateId,
						actionForm: 'Update',
					},
					reqURI = '';

					if(isShelf) {
						reqURI = this.endpoints.setShelfTemplate;

						this._getShelfTemplate(templateId)
							.then(data => {
								const $ = cheerio.load(data);
								const templateCssClass = $('input#templateCssClass').val();

								return reqData = {
										...reqData,
										templateCssClass,
										roundCorners: false,
									};
							})
							.then(reqData => {
								this._saveHTMLRequest(reqURI, reqData)
									.then(( { data } ) => {
										this._saveHTMLSuccess(data, templateName, bar);

										resolve({
											templateName,
											account,
											content: md5(template),
											type: 'success'
										});
									})
									.catch(err => {
										message('error', `Upload Template error ${err}`);
										reject(err)
									});
							})
							.catch(err => {
								message('error', ` Get unique shelf error: ${err}`);
								reject(err);
							});
					} else {
						reqData = {
							...reqData,
							isSub,
							textConfirm: 'yes'
						};

						reqURI = this.endpoints.setHTMLTemplate;

						this._saveHTMLRequest(reqURI, reqData)
							.then(( { data } ) => {
								this._saveHTMLSuccess(data, templateName, bar);

								resolve({
									templateName,
									account,
									content: md5(template),
									type: 'success'
								});
							})
							.catch(err => {
								message('error', `Upload Template error ${err}`);
								reject(err)
							});
					}
				});
			});
		};

		let uploadPromises = files.map(genPromises);

		return uploadPromises;
	};

	/**
	 * Request POST HTML Save Templates
	 * @param  {String} reqURI URI to request
	 * @param  {String} reqData Data to request
	 * @returns {Promise}
	 */
	_saveHTMLRequest (reqURI, reqData) {
		return this.AXIOS
				.post(reqURI, qs.stringify(reqData), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
					}
				});
	};

	/**
	 * Actions on save data on HTML Templates
	 * @param  {String} data HTML Response of the request
	 * @param  {String} templateName Current template name to feedback
	 * @param  {Object} bar ProgressBar to upgrade them
	 */
	_saveHTMLSuccess( data, templateName, bar ) {
		if(data.indexOf('originalMessage') >= 0) {
			const $ = cheerio.load(data);
			const err = JSON.parse($('applicationexceptionobject').text());

			message('error', `Error on upload HTML Template (${templateName}): ${err.message}`);
			reject(err);
		} else {
			bar.tick();
		}
	}
}

module.exports = VtexCMS;