var gulp = require('gulp');
var cssmin = require('gulp-cssmin');
var gulpif = require('gulp-if');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var useref = require('gulp-useref');
var imagemin = require('gulp-imagemin');

const SOURCE_FILES = ['static/index.html'];
const SOURCE_IMAGES = ['static/images/**/*'];

gulp.task('html', function () {
	return gulp.src(SOURCE_FILES)
	.pipe(useref())
	.pipe(gulpif('*.css', cssmin()))
	.pipe(gulpif('!*.html', rev()))
	.pipe(revReplace())
	.pipe(gulp.dest('tmp/switchboardStatic'));
});

gulp.task('images', function () {
	return gulp.src(SOURCE_IMAGES)
		.pipe(imagemin())
		.pipe(gulp.dest('tmp/switchboardStatic/images'));
});

gulp.task('html-dev', ['html'], function () {
	gulp.watch(SOURCE_FILES, ['html']);
});

gulp.task('static', ['html', 'images']);
