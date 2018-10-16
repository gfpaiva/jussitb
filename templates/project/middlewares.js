const pkg = require('./package.json');

var disableCompression,
	errorHandler,
	replaceHost,
	replaceHtmlBody,
	replaceReferer,
	rewriteLocationHeader,
	ignoreReplace = [/\.js(\?.*)?$/, /\.css(\?.*)?$/, /\.svg(\?.*)?$/, /\.ico(\?.*)?$/, /\.woff(\?.*)?$/, /\.png(\?.*)?$/, /\.jpg(\?.*)?$/, /\.jpeg(\?.*)?$/, /\.gif(\?.*)?$/, /\.pdf(\?.*)?$/],
	proxyPort = process.env.PORT || pkg.proxyPort || 80;

replaceHtmlBody = (environment, accountName, secureUrl) => (req, res, next) => {

	var ignore = ignoreReplace.some(function (ignore) {
		return ignore.test(req.url);
	});

	if (ignore) return next();

	var data = '';
	var write = res.write;
	var end = res.end;
	var writeHead = res.writeHead;
	var proxiedStatusCode = null;
	var proxiedHeaders = null;

	res.writeHead = function (statusCode, headers) {
		proxiedStatusCode = statusCode;
		proxiedHeaders = headers;
	};

	res.write = function (chunk) {
		return data += chunk;
	};

	res.end = function (chunk, encoding) {
		if (chunk) {
			data += chunk;
		}

		if (data) {
			data = data.replace(new RegExp(environment, 'g'), 'vtexlocal');
			data = data.replace(new RegExp('vteximg', 'g'), 'vtexlocal');

			if (secureUrl) {
				data = data.replace(new RegExp('https:\/\/' + accountName, 'g'), 'http://' + accountName);
			}

			if (proxyPort !== 80) {
				data = data.replace(new RegExp("vtexlocal.com.br\/", "g"), `vtexlocal.com.br:${proxyPort}\/`);
			}
		}

		res.write = write;
		res.end = end;
		res.writeHead = writeHead;

		if (proxiedStatusCode && proxiedHeaders) {
			proxiedHeaders['content-length'] = Buffer.byteLength(data);

			if (secureUrl) {
				delete proxiedHeaders['content-security-policy'];
			}

			res.writeHead(proxiedStatusCode, proxiedHeaders);
		}

		res.end(data, encoding);
	};

	return next();
};

disableCompression = function (req, res, next) {
	req.headers['accept-encoding'] = 'identity';
	return next();
};

rewriteLocationHeader = rewriteFn => (req, res, next) => {
	var writeHead;
	writeHead = res.writeHead;
	res.writeHead = function (statusCode, headers) {
		if (headers && headers.location) {
			headers.location = rewriteFn(headers.location);
		}
		res.writeHead = writeHead;
		return res.writeHead(statusCode, headers);
	};
	return next();
};

replaceHost = host => (req, res, next) => {
	req.headers.host = host;
	return next();
};

replaceReferer = rewriteReferer => (req, res, next) => {
	req.headers.referer = rewriteReferer(req.headers.referer);
	return next();
};

errorHandler = function (err, req) {
	var errString, ref, ref1;
	errString = (ref = (ref1 = err.code) != null ? ref1.red : void 0) != null ? ref : err.toString().red;
	return console.log(errString, req.url.yellow);
};

module.exports = {
	rewriteLocationHeader: rewriteLocationHeader,
	replaceHost: replaceHost,
	replaceHtmlBody: replaceHtmlBody,
	replaceReferer: replaceReferer,
	disableCompression: disableCompression,
	errorHandler: errorHandler
};
