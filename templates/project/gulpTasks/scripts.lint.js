module.exports = (gulp, $, _) => {

	return function lint(done) {
		gulp.src(_.getPath('scripts')
			.concat('!src/Scripts/vendors/*.js')
			.concat('!src/Scripts/Helpers/helpers.js')
			.concat('!src/Scripts/modules/vtex/*.js'))
			.pipe($.util.env.preCommit ? $.util.noop() : $.cached('jsLinting'))
			.pipe($.eslint({
				'configFile': `.eslintrc${$.util.env.preCommit ? '.commit' : ''}.js`
			}))
			.pipe($.eslint.format())
			.pipe($.eslint.failAfterError());

		done();
	};
};
