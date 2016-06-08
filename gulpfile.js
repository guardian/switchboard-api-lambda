var gulp = require('gulp');
var eslint = require('gulp-eslint');
var foreach = require('gulp-foreach');
var yaml = require('gulp-yaml');
var rollup = require('gulp-rollup');
var zip = require('gulp-zip');
var path = require('path');
process.env.ARTEFACT_PATH = __dirname;
var riffraff = require('node-riffraff-artefact');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var babel = require('rollup-plugin-babel');

var LAMBDA_SOURCE = 'src/*.js';
var SOURCE_FILES = 'src/**/*.js';
var DEPLOY_SOURCE = 'conf/deploy.yml';
var CLOUDFORMATION_SOURCE = 'conf/cloudformation.yml';

gulp.task('compile', function () {
	return gulp.src(LAMBDA_SOURCE, { read: false})
		.pipe(rollup({
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

gulp.task('cloudformation', function () {
	return gulp.src(CLOUDFORMATION_SOURCE)
		.pipe(yaml({ space: 4 }))
		.pipe(gulp.dest('./tmp/riffraff/packages/cloudformation'));
});
gulp.task('cfn', ['cloudformation']);

gulp.task('cloudformation-dev', ['cloudformation'], function () {
	gulp.watch(CLOUDFORMATION_SOURCE, ['cloudformation']);
});

gulp.task('lint', function () {
	return gulp.src([
		SOURCE_FILES,
		'test/**/*.js'
	])
	.pipe(eslint())
	.pipe(eslint.formatEach('compact', process.stderr))
	.pipe(eslint.failAfterError());
});

gulp.task('lint-dev', ['lint'], function () {
	gulp.watch(SOURCE_FILES, ['lint']);
});

gulp.task('riffraff-deploy', function () {
	return gulp.src(DEPLOY_SOURCE)
		.pipe(yaml({ space: 4 }))
		.pipe(gulp.dest('tmp/riffraff'));
});

gulp.task('riffraff-deploy-dev', ['riffraff-deploy'], function () {
	gulp.watch(DEPLOY_SOURCE, ['riffraff-deploy']);
});


gulp.task('dev', ['lint-dev', 'cloudformation-dev', 'compile-dev', 'riffraff-deploy-dev']);

gulp.task('archive', ['riffraff-deploy'], function () {
	return gulp.src('tmp/lambda/*.js')
		.pipe(foreach(function (stream, file) {
			const targetName = file.relative.replace(/\.js$/, 'Lambda');
			return stream
				.pipe(zip('artifact.zip'))
				.pipe(gulp.dest('tmp/riffraff/packages/' + targetName))
				.pipe(gulp.dest('tmp/riffraff/packages/switchboardAPILambda/' + targetName));
		}));
});

gulp.task('package', ['archive'], function () {
	return gulp.src('tmp/riffraff/**/*')
		.pipe(zip('artifacts.zip'))
		.pipe(gulp.dest('tmp/'));
});

gulp.task('deploy', ['package'], function (cb) {
	riffraff.settings.leadDir = path.join(__dirname, 'tmp/');

	riffraff.s3Upload().then(function () {
		cb();
	}).catch(function (error) {
		cb(error);
	});
});
