
module.exports = (gulp, $, _) => {

	const webpack = require('webpack-stream'),
		named = require('vinyl-named'),
		path = require('path'),
		HardSourceWebpackPlugin = require('hard-source-webpack-plugin');;

	const lint = () => {
		return gulp.src(_.getPath('scripts')
			.concat('!src/Scripts/vendors/*.js')
			.concat('!src/Scripts/Helpers/helpers.js')
			.concat('!src/Scripts/modules/vtex/*.js'))
			.pipe($.cached('jsLinting'))
			.pipe($.eslint())
			.pipe($.eslint.format())
			.pipe($.eslint.failAfterError());
	};

	const scripts = () => {
		return gulp.src(_.getPath('webpack'))
			.pipe($.plumber())
			.pipe(named())
			.pipe(webpack({
				output: {
					filename: '[name].min.js'
				},
				externals: {
					'jquery': 'jQuery'
				},
				resolve: {
					modules: ['src/Scripts', 'node_modules'],
					alias: {
						// templates: path.resolve('./src/templates')
						bootstrap: path.resolve('./node_modules/bootstrap-sass/assets/javascripts/bootstrap'),
						bs: path.resolve('./node_modules/bootstrap/js/')
					}
				},
				module: {
					rules: [
						{
							test: /\.js$/,
							exclude: /node_modules\/(?!bootstrap\/).*/,
							use: {
								loader: 'babel-loader?cacheDirectory',
								options: {
									presets: ['@babel/preset-env'],
									plugins: ['@babel/plugin-proposal-object-rest-spread']
								}
							}
						},
						{
							test: /\.html$/,
							use: {
								loader: 'dust-loader'
							}
						}
					]
				},
				mode: $.util.env.production ? 'production' : 'development',
				optimization: {
					minimize: $.util.env.production ? true : false,
				},
				plugins: [
					new webpack.webpack.DefinePlugin({
						VERSION: JSON.stringify(_.pkg.version)
					}),
					new webpack.webpack.BannerPlugin('Build Version: ' + _.pkg.version),
					$.util.env.production ? $.util.noop : new HardSourceWebpackPlugin()
				],
				devtool: $.util.env.production ? '' : 'eval-source-map'
			}))
			.pipe($.preprocess(_.preprocessContext))
			.pipe((isProdEnv()) ? gulp.dest(_.paths.dest.default) : gulp.dest(_.paths.dest.files))
			.pipe($.filter(f => /checkout/.test(f.path)))
			.pipe($.rename(file => file.basename = file.basename.replace('.min', '')))
			.pipe(gulp.dest(_.paths.dest.files));
	};


	return gulp.series(lint, scripts);
};
