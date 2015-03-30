
(function () {

	'use strict';

	var
		cfg = {
			summary: {
				verbose: true,
				reasonCol: 'cyan,bold',
				codeCol: 'green'
			},
			uglify: {
				mangle: true,
				compress: true
			}
		},

		gulp = require('gulp'),
		concat = require('gulp-concat-util'),
		rename = require('gulp-rename'),
		uglify = require('gulp-uglify'),
		gutil = require('gulp-util'),
		webpack = require('webpack')
	;

	gulp.task('js:webpack', function(callback) {
		webpack(require('./webpack.config.js'), function(err, stats) {
			if (err) {
				throw new gutil.PluginError('webpack', err);
			}
			gutil.log('[webpack]', stats.toString({}));
			callback();
		});
	});

	gulp.task('js:min', ['js:webpack'], function() {
		return gulp.src('./dist/build.js')
			.pipe(uglify(cfg.uglify))
			.pipe(rename({suffix: '.min'}))
			.pipe(gulp.dest('./dist/'))
			.on('error', gutil.log);
	});

	gulp.task('js:result', ['js:min'], function() {
		return gulp.src(['./vendors/queue.min.js', './dist/build.min.js'])
			.pipe(concat('jua.min.js'))
			.pipe(concat.header('/* RainLoop Webmail (c) RainLoop Team | MIT */\n'))
			.pipe(gulp.dest('./dist/'))
			.on('error', gutil.log);
	});

	gulp.task('js:normal', ['js:webpack'], function() {
		return gulp.src(['./vendors/queue.min.js', './dist/build.js'])
			.pipe(concat('jua.js'))
			.pipe(concat.header('/* RainLoop Webmail (c) RainLoop Team | MIT */\n'))
			.pipe(gulp.dest('./dist/'))
			.on('error', gutil.log);
	});

	// lint
	gulp.task('js:lint', function() {

		var
			jshint = require('gulp-jshint'),
			closureCompiler = require('gulp-closure-compiler')
		;

		return gulp.src('./src/*.js')
			.pipe(jshint('.jshintrc'))
			.pipe(jshint.reporter('jshint-summary', cfg.summary))
			.pipe(jshint.reporter('fail'))

			.pipe(closureCompiler({
				compilerPath: './vendors/compiler.jar',
				fileName: 'gc.js',
				compilerFlags: {
					output_wrapper: '(function(){%output%}());'
				}
			}))
		;
	});

	// MAIN
	gulp.task('default', ['js:result']);

}());