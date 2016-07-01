var gulp = require('gulp');
var eslint = require('gulp-eslint');

var SOURCE_FILES = [
	'src/**/*.js',
	'test/**/*.js',
	'static/**/*.js'
];

gulp.task('lint', function () {
	return gulp.src(SOURCE_FILES)
	.pipe(eslint())
	.pipe(eslint.formatEach('compact', process.stderr))
	.pipe(eslint.failAfterError());
});

gulp.task('lint-dev', ['lint'], function () {
	gulp.watch(SOURCE_FILES, ['lint']);
});
