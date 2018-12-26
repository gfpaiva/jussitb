
module.exports = function (gulp, $, _) {

	const processHTML = (sourcePath, destPath) => {
		return gulp.src(sourcePath)
			.pipe($.preprocess(_.preprocessContext)) //To set environment variables in-line
			.pipe(Array.isArray(destPath) ? $.multiDest(destPath) : gulp.dest(destPath));
	};


	const templates = () => ($.util.env.production) && processHTML(_.paths.html.templates, _.paths.dest.html.templates);

	const sub = () => ($.util.env.production) && processHTML(_.paths.html.subTemplates, _.paths.dest.html.subTemplates);

	const shelves = () => ($.util.env.production) && processHTML(_.paths.html.shelvesTemplates, _.paths.dest.html.shelvesTemplates);


	return function html(done) {
		let pagesDest = [`build/${$.util.env.page}`];

		if ($.util.env.page && $.util.env.page.indexOf(',') > 0) {
			pagesDest = [`build/pages`];
		}

		if ($.util.env.production) {
			templates();
			sub();
			shelves();

			pagesDest = pagesDest.concat(_.paths.dest.html.templates);
		}


		if ($.util.env.page) {
			processHTML(_.getPath('pages'), pagesDest);
		}

		done();
	};

};
