'use strict';

let pkg = require('./package.json');

const
	os				= require('os'),
	gulp 			= require('gulp'),
	$ 				= require('gulp-load-plugins')(),
	del 			= require('del'),
	bs 				= require('browser-sync'),
	projectConfig 	= require('./config.js'),
	shell 			= require('shelljs'),
	fs 				= require('fs'),
	middlewares 	= require('./middlewares'),
	url 			= require('url'),
	secureUrl 		= $.util.env.qa ? false : (pkg.secureUrl ? pkg.secureUrl : true),
	proxyPort		= process.env.PROXY_PORT || pkg.proxyPort || 80,
	environment 	= $.util.env.VTEX_HOST || 'vtexcommercestable',
	accountName 	= $.util.env.account ? $.util.env.account : ($.util.env.qa ? 'PROJECTACCOUNTNAMEqa' : pkg.accountName),
	httpPlease 		= require('connect-http-please'),
	serveStatic 	= require('serve-static'),
	proxy 			= require('proxy-middleware'),
	isProdEnv = () => accountName === 'PROJECTACCOUNTNAME';

const browser = os.platform() === 'linux' ? 'google-chrome' : 'chrome';

const paths = {
	scripts      : 'src/Scripts/**/*.js',
	webpack      : 'src/Scripts/*.js',
	styles       : 'src/Styles/**/*.scss',
	fonts        : 'src/Fonts/**/*.{eot,svg,ttf,woff,woff2}',
	icons        : 'src/Icons/**/*.svg',
	images       : 'src/Images/**/*.{png,jpeg,jpg,gif,svg}',
	dust         : 'src/Scripts/Dust/**/*.html',
	pages        : 'src/Pages/**/*.html',

	html         : {
		templates       : 'src/01 - HTML Templates/*.html',
		subTemplates    : 'src/01 - HTML Templates/Sub Templates/*.html',
		shelvesTemplates: 'src/02 - Shelves Templates/*.html'
	},

	dest         : {
		default: 'build/arquivos',
		files  : 'build/files',
		html   : {
			templates       : 'build/html',
			subTemplates    : 'build/html/sub',
			shelvesTemplates: 'build/shelf'
		}
	}
};

let preprocessContext = {
	context: {
		...projectConfig[accountName],
		package: {
			...pkg
		},
		DEBUG: !$.util.env.production,
	}
};

const getPath = source => {

	let newPath = [ paths[ source ] ],
		replaceSource;

	if( $.util.env.page ) {

		if( source === 'webpack' ) {
			source = 'scripts';
		}

		replaceSource = source === 'pages' ? '' : `/${source}`;

		if($.util.env.page) {
			if ( $.util.env.page === 'ALL' ) {
				let pagesDir = fs.readdirSync(`${__dirname}/src/Pages`);
				pagesDir = $.util.env.production ? pagesDir.filter(path => !/(base|styleguide|includes|header)/.test(path) ) : pagesDir;
				$.util.env.page = pagesDir.join(',');
			}

			if( $.util.env.page.indexOf(',') > 0 ) {
				const multiPages = $.util.env.page.split(',');

				multiPages.map(singlePage => {
					newPath.push( newPath[0].replace( new RegExp(source, 'i'), 'Pages/' + singlePage + replaceSource ) );
				});
			} else {
				newPath.push( newPath[0].replace( new RegExp(source, 'i'), 'Pages/' + $.util.env.page + replaceSource ) );
			}
		}

	}

	if( source === 'pages' ) {
		newPath.shift();
	}

	return newPath;
};

const getTask = (task, helpers) => {

	const _ = {
		...helpers,
		paths,
		preprocessContext,
		getPath,
		pkg,
		isProdEnv
	};

	return require('./gulpTasks/' + task)(gulp, $, _);
};

const clean = () => del('build');

const predeploy = (done) => {
	$.util.env.production = true;
	pkg = JSON.parse(require('fs').readFileSync('./package.json')); //fix update pkg from bump

	done();
};

const bump = () => {

	return gulp.src('package.json')
		.pipe((isProdEnv() && !$.util.env.nobump) ? $.bump({ version: pkg.version }) : $.util.noop())
		.pipe(gulp.dest('.'));
};

//get last git tag and bump version in package.json
const gitTag = (done) => {
	// FORCE DEPLOY CONFIGS / PRODUCTION
	$.util.env.production = true;

	if (isProdEnv() && !$.util.env.nobump) {
		if (shell.exec('git fetch --tags').code !== 0) {
			shell.echo('Error: Git fetch tags failed');
			shell.exit(1);
		} else {
			shell.exec('git for-each-ref --count=1 --sort=-creatordate --format "%(refname)" refs/tags', function (code, stdout) {
				preprocessContext = {
					context: {
						...projectConfig[accountName],
						package: {
							...pkg
						},
						DEBUG: false,
					}
				};

			});
		}
	} else {
		pkg.version = new Date().getTime();
	}

	done();
};

const watch = (done) => {
	gulp.watch(getPath('fonts'), gulp.parallel(getTask('fonts')));
	gulp.watch(getPath('images'), gulp.parallel(getTask('images')));
	gulp.watch(getPath('styles'), gulp.parallel(getTask('styles', { getTask })));
	gulp.watch(getPath('scripts'), gulp.parallel(getTask('scripts', { getTask })));
	gulp.watch(getPath('dust'), gulp.parallel(getTask('scripts', { getTask })));
	gulp.watch(getPath('pages'), gulp.parallel(getTask('pages', { getTask })));

	done();
};

const server = () => {
	let htmlFile = null;

	let portalHost = `${accountName}.${environment}.com.br`,
		imgProxyOptions = url.parse(`https://${accountName}.vteximg.com.br/arquivos`),
		portalProxyOptions = url.parse(`https://${portalHost}/`),
		localHost = `${accountName}.vtexlocal.com.br`;

	if (proxyPort !== 80) localHost += `:${proxyPort}`;

	imgProxyOptions.route = '/arquivos';
	portalProxyOptions.preserveHost = true;
	portalProxyOptions.cookieRewrite = `${accountName}.vtexlocal.com.br`;

	const rewriteLocation = location => location.replace('https:', 'http:').replace(portalHost, localHost);
	const rewriteReferer = (referer = '') => {
		referer = referer.replace('http:', 'https:');

		return referer.replace(localHost, portalHost);
	};

	bs({
		files: $.util.env.page ? [] : ['build/**', '!build/**/*.map'],
		startPath: `${secureUrl ? `http://${accountName}.vtexlocal.com.br${proxyPort !== 80 ? `:${proxyPort}` : ''}/?debugcss=true&debugjs=true` : '/admin/Site/Login.aspx?ReturnUrl=%2f%3fdebugcss%3dtrue%26debugjs%3dtrue'}`,
		rewriteRules: [
			{
				match: new RegExp('["\'](?:https?://|//)' + pkg.name + '.*?(/.*?)?["\']', 'gm'),
				replace: '"$1"'
			}
		],
		proxy: {
			target: `${accountName}.${secureUrl ? 'vtexlocal' : environment}.com.br${secureUrl ? `:${proxyPort}` : ''}/?debugcss=true&debugjs=true`,
			proxyReq: [
				function (proxyReq) {

					proxyReq.setHeader('host', `${accountName}.vtexlocal.com.br`);
					proxyReq.setHeader('protocol', 'https');
					proxyReq.setHeader('accept-encoding', 'identity');
					proxyReq.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
					proxyReq.setHeader('Expires', '-1');
					proxyReq.setHeader('Pragma', 'no-cache');
				}
			]
		},
		middleware: secureUrl ? [
			middlewares.disableCompression,
			middlewares.rewriteLocationHeader(rewriteLocation),
			middlewares.replaceHost(portalHost),
			middlewares.replaceReferer(rewriteReferer),
			middlewares.replaceHtmlBody(environment, accountName, secureUrl),
			httpPlease({
				host: portalHost
			}),
			serveStatic('./build'),
			proxy(imgProxyOptions),
			proxy(portalProxyOptions),
			middlewares.errorHandler
		] : [],
		serveStatic: ['./build'],
		port: proxyPort,
		open: false,
		reloadOnRestart: true
	});

	const options = {
		uri: secureUrl ? `http://${accountName}.vtexlocal.com.br:${proxyPort}/?debugcss=true&debugjs=true` : `http://localhost:3000`,
		app: browser
	};

	if ($.util.env.page) htmlFile = fs.readdirSync(`${__dirname}/src/Pages/${$.util.env.page}`).filter(file => /\.html$/.test(file))[0];

	return $.util.env.page ? bs.create().init({
		files: ['build/**', '!build/**/*.map'],
		server: {
			baseDir: ['build']
		},
		ui: false,
		port: 3002,
		startPath: $.util.env.page.indexOf(',') > 0 ? 'pages' : (htmlFile ? `${$.util.env.page}/${htmlFile}` : $.util.env.page),
		open: !$.util.env.no
	}) : (!$.util.env.no ? gulp.src(__filename).pipe($.open(options)) : null);
};

gulp.task('pre-commit-lint', done => {
	$.util.env.preCommit = true;
	$.util.env.page = 'ALL';

	gulp.parallel(
		getTask('styles.lint'),
		getTask('scripts.lint')
	);

	done();
});

gulp.task('watch', gulp.parallel([
	getTask('fonts'),
	getTask('images'),
	getTask('styles', { getTask }),
	getTask('scripts', { getTask }),
	getTask('pages', { getTask })
], watch));

gulp.task('develop', gulp.series('watch', server));

gulp.task('default', gulp.series([clean, 'develop']));

gulp.task('deploy',
	gulp.series([clean, gitTag, bump, predeploy],
		gulp.parallel(
			getTask('fonts'),
			getTask('images'),
			getTask('html'),
			getTask('styles', { getTask }),
			getTask('scripts', { getTask })
		)
	)
);
