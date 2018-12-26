
module.exports = function (gulp, $, _) {

	return function fonts() {
		return gulp.src(_.paths.fonts)
			.pipe($.rename(function (file) {
				file.extname += '.css';
			}))
			.pipe(gulp.dest(_.paths.dest.default));
	};


};
