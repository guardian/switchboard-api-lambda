var gulp = require('gulp');

require('./gulp-tasks/lambda');
require('./gulp-tasks/validation');
require('./gulp-tasks/static');
require('./gulp-tasks/riffraff');

gulp.task('dev', ['lint-dev', 'cloudformation-dev', 'compile-dev', 'riffraff-deploy-dev', 'html-dev']);
