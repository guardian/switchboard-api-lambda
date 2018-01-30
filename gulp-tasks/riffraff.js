var gulp = require('gulp');
var foreach = require('gulp-foreach');
var yaml = require('gulp-yaml');
var zip = require('gulp-zip');
var path = require('path');
process.env.ARTEFACT_PATH = path.join(__dirname, '..');
var riffraff = require('node-riffraff-artefact');

var DEPLOY_SOURCE = 'conf/deploy.yml';

gulp.task('riffraff-deploy', function () {
	return gulp.src(DEPLOY_SOURCE)
		.pipe(yaml({ space: 4 }))
		.pipe(gulp.dest('tmp/riffraff'));
});

gulp.task('riffraff-deploy-dev', ['riffraff-deploy'], function () {
	gulp.watch(DEPLOY_SOURCE, ['riffraff-deploy']);
});

gulp.task('archive', ['compile', 'riffraff-deploy'], function () {
	return gulp.src('tmp/lambda/*.js')
		.pipe(foreach(function (stream, file) {
			const targetName = file.relative.replace(/\.js$/, 'Lambda');
			return stream
				.pipe(zip('artifact.zip'))
				.pipe(gulp.dest('tmp/riffraff/packages/' + targetName))
				.pipe(gulp.dest('tmp/riffraff/packages/switchboardAPILambda/' + targetName));
		}));
});

gulp.task('package', ['archive', 'static'], function () {
	return gulp.src('tmp/riffraff/**/*')
		.pipe(zip('artifacts.zip'))
		.pipe(gulp.dest('tmp/'));
});

gulp.task('deploy', ['package'], function (cb) {
	riffraff.settings.leadDir = path.join(__dirname, '../tmp');

	riffraff.s3FilesUpload().then(function () {
		cb();
	}).catch(function (error) {
		cb(error);
	});
});
