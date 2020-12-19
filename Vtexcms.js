"use strict";

const { readFile, readdirSync, createReadStream } = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const ProgressBar = require("progress");
const md5 = require("md5");
const jsonfile = require("jsonfile");
const message = require("./utils/cli-colors");
const FormData = require("form-data");
const decode = require("decode-html");

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
      getHTMLTemplate: `/admin/a/PortalManagement/TemplateContent?templateId=`,
      getShelfTemplates: `/admin/a/PortalManagement/ShelfTemplateContent`,
      getShelfTemplate: `/admin/a/PortalManagement/ShelfTemplateContent?shelfTemplateId=`,
      getRequestToken: `/admin/a/PortalManagement/AddFile?fileType=css`,
    };
    this.authCookie = {
      name: "VtexIdclientAutCookie",
      value: authCookie,
    };
    this.AXIOS = axios.create({
      baseURL: this.uri,
      headers: {
        Cookie: `${this.authCookie.name}=${this.authCookie.value};`,
        Accept: "*/*",
        "Cache-Control": "no-cache",
      },
      timeout: 1000 * 60 * 60,
    });
    this.templates = null;
    this.defaultBar = (total) =>
      new ProgressBar("uploading [:bar] :percent - :current/:total", {
        total,
        complete: "#",
        incomplete: "-",
        width: 20,
      });
    this.localPaths = {
      lockPath: path.resolve(PROJECTDIR, "vtex-d.lock.json"),
      assetsPath: path.resolve(PROJECTDIR, "dist/files"),
      defaultAssetsPath: path.resolve(PROJECTDIR, "dist/arquivos"),
      shelvesPath: path.resolve(PROJECTDIR, "dist/"),
      templatesPath: path.resolve(PROJECTDIR, "dist/"),
      subTemplatesPath: path.resolve(PROJECTDIR, "dist/sub-templates"),
    };
  }

  /**
   * Set a account name and redefine uri
   * @param {String} account account name
   */
  setAccount(account) {
    this.account = account;
    this.uri = `http://${account}.vtexcommercestable.com.br`;
    this.baseUri = `${this.account}.vtexcommercestable.com.br`;
  }

  /**
   * Save CSS and JS files on "Portal (/files)" on VTEX
   * @param  { { force: Boolean, account: String } } cmd object with cmd commander params/options
   * @returns {Array} Array of promises
   */
  setAssetFile({ force, account }) {
    const files = readdirSync(this.localPaths.assetsPath).filter((file) =>
      /\.(css|js)$/gim.test(file)
    );
    const bar = this.defaultBar(files.length);
    const lock = this._checklockFile();

    bar.tick(0);

    const genPromises = (Cpath) => {
      return new Promise((resolve, reject) => {
        readFile(
          path.resolve(this.localPaths.assetsPath, Cpath),
          "utf8",
          (err, text) => {
            if (err) throw new Error(err);

            const templateName = `files/${Cpath}`;

            if (this._checkUpload(text, templateName, force, account, lock)) {
              bar.tick();
              return resolve({ templateName, account, type: "notice" });
            }

            this.AXIOS.put(`${this.endpoints.setAsset}/${Cpath}`, {
              path: Cpath,
              text,
            })
              .then(({ data }) => {
                bar.tick();

                resolve({
                  account,
                  templateName,
                  content: md5(text),
                  type: "success",
                });
                // resolve(Cpath);
              })
              .catch((err) => {
                message("error", `Upload File error ${err}`);
                reject(err);
              });
          }
        );
      });
    };

    let uploadPromises = files.map(genPromises);

    return uploadPromises;
  }

  /**
   * Save CSS and JS files on "CMS (/arquivos)" on VTEX
   * @param  {String} requestToken
   * @param  { { force: Boolean, account: String } } cmd object with cmd commander params/options
   * @returns {Array} Array of promises
   */
  defaultAssets(requestToken, { force, account }) {
    const files = readdirSync(
      this.localPaths.defaultAssetsPath
    ).filter((file) => /\.(css|js)$/gim.test(file));
    const bar = this.defaultBar(files.length);
    const lock = this._checklockFile();

    bar.tick(0);

    const genPromises = (Cpath) => {
      return new Promise((resolve, reject) => {
        // const host = this.baseUri.replace(/(http:|https:|\/)/g, '');
        const filePath = path.resolve(this.localPaths.defaultAssetsPath, Cpath);

        readFile(filePath, "utf8", (err, text) => {
          if (err) throw new Error(err);

          const form = new FormData();
          const templateName = `arquivos/${Cpath}`;

          if (this._checkUpload(text, templateName, force, account, lock)) {
            bar.tick();
            return resolve({ templateName, account, type: "notice" });
          }

          form.append("Filename", Cpath);
          form.append("fileext", "*.js;*.css");
          form.append("requestToken", requestToken);
          form.append("folder", "/uploads");
          form.append("Upload", "Submit Query");
          form.append("Filedata", createReadStream(filePath));

          this.AXIOS.post(this.endpoints.setDefaultAsset, form, {
            headers: {
              "Content-Type": form.getHeaders()["content-type"],
            },
          })
            .then((res) => {
              if (
                res.data &&
                res.data.mensagem &&
                res.data.mensagem === "File(s) saved successfully."
              ) {
                bar.tick();

                resolve({
                  account,
                  templateName,
                  content: md5(text),
                  type: "success",
                });
              } else {
                const errorMessage = `Upload File error ${filePath} (Error: ${res.status})`;

                message("error", errorMessage);
                reject(errorMessage);
              }
            })
            .catch((err) => {
              message("error", `Upload File ${filePath} error: ${err}`);
              reject(err);
            });
        });
      });
    };

    let uploadPromises = files.map(genPromises);

    return uploadPromises;
  }

  /**
   * Get HTML of templates on VTEX CMS
   * @param  {Boolean} IsSub specify if want to get subtemplates
   * @param  {Boolean} isShelf specify if want to get shelves templates
   * @returns {Promise} Promise with templates (in HTML format)
   */
  getHTMLTemplates(IsSub = false, isShelf = false) {
    IsSub = IsSub ? "1" : "0";
    isShelf = isShelf ? "shelfTemplate" : "viewTemplate";

    return this.AXIOS.post(
      `${this.endpoints.getHTMLTemplates}?type=${isShelf}&IsSub=${IsSub}`,
      qs.stringify({
        type: isShelf,
        IsSub,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    )
      .then(({ data }) => {
        this.templates = data;
        return data;
      })
      .catch((err) => {
        message("error", `Get HTML templates error: ${err}`);
        throw new Error(err);
      });
  }

  /**
   * Get HTML of a single template on VTEX CMS
   * @param  {String} templateId hash with templateId to make a api call
   * @param  {Boolean} isShelf specify if want to get shelves template
   * @returns {Promise} Promise with a single template formated/decoded HTML
   */
  getHTMLTemplate(templateId, isShelf = false) {
    return this.AXIOS.post(
      `${
        isShelf
          ? this.endpoints.getShelfTemplate
          : this.endpoints.getHTMLTemplate
      }${templateId}`
    )
      .then(({ data }) => {
        const $ = cheerio.load(data),
          htmlString = $(`#originalTemplate`).val();

        return decode(htmlString);
      })
      .catch((err) => {
        message("error", `Get HTML template error: ${err}`);
        throw new Error(err);
      });
  }

  /**
   * Set file name with the specific HTML
   * @param  {Array} files array of file names in your project
   * @param  {String} templateList string with html containing the total templates and ids
   * @param  {Boolean} isShelf specify if want to get shelves template
   * @returns {Array} Array of promises containing a object with file and html decoded
   */
  setTemplateContent(files, templateList, isShelf = false) {
    const $ = cheerio.load(templateList);

    return files.map((file) => {
      return new Promise((resolve) => {
        const fileName = this._pathToFileName(file);
        const templateName = this._sanitizeFileName(fileName);
        const templateId = this._getTemplateId($, templateName);

        this.getHTMLTemplate(templateId, isShelf).then((html) =>
          resolve({
            file,
            html,
          })
        );
      });
    });
  }

  /**
   * Get templates names from VTEX admin HTML
   * @param  {String} templateList HTML list of all templates
   * @returns {Array} with all template names on VTEX
   */
  getTemplateNames(templateList) {
    const $ = cheerio.load(templateList);

    return $(`.template > div`)
      .map(function () {
        return $(this).text();
      })
      .get();
  }

  /**
   * Get HTML Shelf template by ID on VTEX CMS
   * @param  {String} shelfTemplateId UID of Shelf Template
   * @returns {Promise} Promise with unique template (in HTML format)
   */
  _getShelfTemplate(shelfTemplateId) {
    return this.AXIOS.post(
      `${this.endpoints.getShelfTemplates}?shelfTemplateId=${shelfTemplateId}`,
      qs.stringify({
        shelfTemplateId,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    )
      .then(({ data }) => data)
      .catch((err) => {
        message("error", `Get Shelf template error: ${err}`);
        throw new Error(err);
      });
  }

  /**
   * Get Request Token on VTEX CMS HTML
   * @returns {Promise} Promise with hash contains RequestToken
   */
  getRequestToken() {
    return this.AXIOS.post(`${this.endpoints.getRequestToken}`)
      .then(({ data }) => {
        const $ = cheerio.load(data);
        const requestToken = $("#fileUploadRequestToken").val();

        if (!requestToken) {
          message("error", "Get RequestToken error");
          throw new Error("Get RequestToken error");
        }

        return requestToken;
      })
      .catch((err) => {
        message("error", `Get RequestToken error: ${err}`);
        throw new Error(err);
      });
  }

  /**
   * Save HTML files on VTEX CMS Portal
   * @param  {String} templateList HTML with list of templates returned by getHTMLTemplates method
   * @param  {Boolean} isSub specify if want to set a subtemplates
   * @param  {Boolean} isShelf specify if want to set a shelf template
   * @param  { { force: Boolean, account: String } } cmd object with cmd commander params/options
   * @returns {Array} Array of promises
   */
  setHTML(templateList, isSub = false, isShelf = false, { force, account }) {
    let filesDir = "";
    let files = "";
    if (isShelf) {
      filesDir = this.localPaths.shelvesPath;

      files = readdirSync(filesDir).filter((file) =>
        /\.(vtex\.html)$/gim.test(file)
      );
    } else if (isSub) {
      filesDir = this.localPaths.subTemplatesPath;
      files = readdirSync(filesDir).filter((file) => /\.(html)$/gim.test(file));
    } else {
      filesDir = this.localPaths.templatesPath;
      files = readdirSync(filesDir).filter((file) => /\.(html)$/gim.test(file));
      files = readdirSync(filesDir).filter((file) =>
        file.startsWith("prateleira-")
      );
    }

    const $ = cheerio.load(templateList);
    const bar = this.defaultBar(files.length);
    const lock = this._checklockFile();

    bar.tick(0);

    const genPromises = (templateName) => {
      return new Promise((resolve, reject) => {
        readFile(
          path.resolve(filesDir, templateName),
          "utf8",
          (err, template) => {
            if (err) {
              message("error", err);
              reject(err);
              throw new Error(err);
            }

            templateName = this._sanitizeFileName(templateName);

            if (
              this._checkUpload(template, templateName, force, account, lock)
            ) {
              bar.tick();
              return resolve({ templateName, account, type: "notice" });
            }

            const templateId = this._getTemplateId($, templateName);

            let reqData = {
                templateName,
                template,
                templateId,
                actionForm: "Update",
              },
              reqURI = "";

            if (isShelf) {
              reqURI = this.endpoints.setShelfTemplate;

              this._getShelfTemplate(templateId)
                .then((data) => {
                  const $ = cheerio.load(data);
                  const templateCssClass = $("input#templateCssClass").val();

                  return (reqData = {
                    ...reqData,
                    templateCssClass,
                    roundCorners: false,
                  });
                })
                .then((reqData) => {
                  this._saveHTMLRequest(reqURI, reqData)
                    .then(({ data }) => {
                      this._saveHTMLSuccess(data, templateName, bar);

                      resolve({
                        templateName,
                        account,
                        content: md5(template),
                        type: "success",
                      });
                    })
                    .catch((err) => {
                      message("error", `Upload Template error ${err}`);
                      reject(err);
                    });
                })
                .catch((err) => {
                  message("error", ` Get unique shelf error: ${err}`);
                  reject(err);
                });
            } else {
              reqData = {
                ...reqData,
                isSub,
                textConfirm: "yes",
              };

              reqURI = this.endpoints.setHTMLTemplate;

              this._saveHTMLRequest(reqURI, reqData)
                .then(({ data }) => {
                  this._saveHTMLSuccess(data, templateName, bar);

                  resolve({
                    templateName,
                    account,
                    content: md5(template),
                    type: "success",
                  });
                })
                .catch((err) => {
                  message("error", `Upload Template error ${err}`);
                  reject(err);
                });
            }
          }
        );
      });
    };

    let uploadPromises = files.map(genPromises);

    return uploadPromises;
  }

  /**
   * Get templateId from VTEX admin HTML
   * @param  {Object} $ cheerio html object
   * @param  {String} templateName string contains the current templateName
   * @returns {String} Hash with VTEX templateId
   */
  _getTemplateId($, templateName) {
    const listMatch = $(`.template div:contains("${templateName}")`);

    var match = listMatch.filter(function () {
      return $(this).text() === `${templateName}`;
    });

    const currTemplate = match.next("a").attr("href");

    try {
      currTemplate.match(/(templateId=)(.+)$/)[2];
    } catch (err) {
      message("error", `Template not found ${templateName}`);

      throw new Error(err);
    }

    return currTemplate.match(/(templateId=)(.+)$/)[2];
  }

  /**
   * Remove extension of template
   * @param  {String} templateName complete file/template name
   * @returns {String} File name without extension
   */
  _sanitizeFileName(templateName) {
    return templateName.replace(/\.html|\.css|\.js/gim, "");
  }

  /**
   * From a full path, get only the file name and extension
   * @param  {String} completePath complete path
   * @returns {String} File name with extension
   */
  _pathToFileName(completePath) {
    return path.basename(completePath);
  }

  /**
   * Read the lock file and return it, If doesn't exist: create a new one
   * @returns { {account: { templateName: { content: String } } } } lock file parsed in object
   */
  _checklockFile() {
    const lock = jsonfile.readFileSync(this.localPaths.lockPath, {
      throws: false,
    });

    if (!lock) jsonfile.writeFileSync(this.localPaths.lockPath, {});

    return lock;
  }

  /**
   * Check if the template has diff on md5 to indicate if able to upload
   * @param  {String} template content of the file/template
   * @param  {String} templateName name of the file/template
   * @param  {Boolean} force flag to force or not the upload
   * @param  {String} account name of the account
   * @param  { {account: { templateName: { content: String } } } } lock object containt de lock file
   * @returns {Boolean}
   */
  _checkUpload(template, templateName, force, account, lock) {
    return (
      !force &&
      lock &&
      lock[account] &&
      lock[account][templateName] &&
      lock[account][templateName].content === md5(template)
    );
  }

  /**
   * Request POST HTML Save Templates
   * @param  {String} reqURI URI to request
   * @param  {String} reqData Data to request
   * @returns {Promise}
   */
  _saveHTMLRequest(reqURI, reqData) {
    return this.AXIOS.post(reqURI, qs.stringify(reqData), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });
  }

  /**
   * Actions on save data on HTML Templates
   * @param  {String} data HTML Response of the request
   * @param  {String} templateName Current template name to feedback
   * @param  {{tick: Function}} bar ProgressBar to upgrade them
   */
  _saveHTMLSuccess(data, templateName, bar) {
    if (data.indexOf("originalMessage") >= 0) {
      const $ = cheerio.load(data);
      const err = JSON.parse($("applicationexceptionobject").text());

      message(
        "error",
        `Error on upload HTML Template (${templateName}): ${err.message}`
      );
      message("error", err);
    } else {
      bar.tick();
    }
  }
}

module.exports = VtexCMS;
