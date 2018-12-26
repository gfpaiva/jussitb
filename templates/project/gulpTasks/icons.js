
module.exports = function (gulp, $, _) {

	const fontName = `${_.pkg.accountName}-icons`;

	return function icons() {
		return gulp.src(_.paths.icons)
			.pipe($.iconfontCss({
				fontName,
				path: './src/Icons/template.scss',
				targetPath: '../Styles/helpers/_icons.scss',
				fontPath: '/arquivos/',
			}))
			.pipe($.iconfont({
				fontName,
				normalize: true,
				fontHeight: 1000,
				centerHorizontally: true,
				formats: ['ttf', 'eot', 'woff', 'svg', 'woff2'],
				prependUnicode: false
			}))
			.pipe(gulp.dest('src/Fonts/'));
	};


};

