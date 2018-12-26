module.exports = function (gulp, $, _) {

	const pages = (done) => {
		done();
	};

	return gulp.series(_.getTask('html'), pages);
};
