
module.exports = function (gulp, $, _) {

	return function images() {
		return gulp.src(_.getPath('images'))
			.pipe($.plumber())
			.pipe($.newer(_.paths.dest.default))
			/* .pipe($.imagemin({
				optimizationLevel: $.util.env.production ? 5 : 1,
				progressive: true,
				interlaced: true
			}))
			.pipe($.flatten()) */
			.pipe(gulp.dest(_.paths.dest.default));
	};


};

