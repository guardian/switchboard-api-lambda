var gulp = require('gulp');
var rollup = require('gulp-rollup');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var babel = require('rollup-plugin-babel');

var LAMBDA_SOURCE = 'src/**/*.js';
var SOURCE_FILES = [
	'src/status.js',
	'src/switches.js',
	'src/toggle.js'
];

gulp.task('compile', function () {
	return gulp.src(LAMBDA_SOURCE)
	.pipe(rollup({
		entry: SOURCE_FILES,
		plugins: [
			babel(),
			nodeResolve(),
			commonjs()
		],
		format: 'cjs',
		exports: 'named',
		external: ['aws-sdk']
	}))
	.pipe(gulp.dest('tmp/lambda'));
});

gulp.task('compile-dev', ['compile'], function () {
	gulp.watch(SOURCE_FILES, ['compile']);
});
