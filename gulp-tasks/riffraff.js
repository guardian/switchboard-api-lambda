var gulp = require('gulp');
var path = require('path');
process.env.ARTEFACT_PATH = path.join(__dirname, '..');
var riffraff = require('node-riffraff-artefact');

gulp.task('deploy', ['static', 'compile'], function (cb) {
	riffraff.settings.leadDir = path.join(__dirname, '../tmp');

	riffraff.s3FilesUpload().then(function () {
		cb();
	}).catch(function (error) {
		cb(error);
	});
});
