
module.exports = function (gulp, $, _) {

	const cssnano = require('cssnano'),
		cssMqpacker = require('css-mqpacker'),
		autoprefixer = require('autoprefixer'),
		flexibility = require('postcss-flexibility');

	const styles = done => {
		gulp.src(_.getPath('styles'))
			.pipe($.util.env.page ? $.util.noop() : $.cached('styling'))
			.pipe($.util.env.page ? $.util.noop() : $.sassPartialsImported('src/Styles/'))
			.pipe($.plumber())
			.pipe($.util.env.production ? $.util.noop() : $.sourcemaps.init())
			.pipe($.sass({
				errLogToConsole: true,
				outputStyle: $.util.env.production ? 'compressed' : 'nested',
				includePaths: [
					'src/Styles',
					'node_modules/'
				]
			}).on('error', $.sass.logError))
			.pipe($.util.env.production ? $.postcss([
				autoprefixer(),
				flexibility(),
				cssMqpacker(/* {sort: true} */),
				cssnano({
					zindex: false,
					reduceIdents: false
				}),
			]) : $.postcss([
				cssMqpacker(/* {sort: true} */)
			]))
			.pipe($.util.env.production ? $.preprocess(_.preprocessContext) : $.util.noop())
			.pipe(!$.util.env.production ? $.sourcemaps.write('.') : $.util.noop())
			.pipe((_.isProdEnv()) ? gulp.dest(_.paths.dest.default) : gulp.dest(_.paths.dest.files))
			.pipe($.filter(f => /checkout/.test(f.path)))
			.pipe($.rename(file => file.basename = file.basename.replace('.min', '')))
			.pipe(gulp.dest(_.paths.dest.files));

		done();
	};

	return gulp.series(_.getTask('styles.lint'), styles);
};
