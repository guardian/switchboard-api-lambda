const tap = require('tap');
const lambda = require('../tmp/lambda/status').default;

tap.test('fails if not authenticated', test => {
	lambda({
		events: { context: { 'authorizer-principal-id' : '' } },
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /not authenticated/i);
			test.end();
		}
	});
});

tap.test('fails if S3 cannot get the file', test => {
	lambda({
		events: { context: { 'authorizer-principal-id' : 'me' } },
		bucket: 'bucket',
		stage: 'STAGE',
		s3: {
			getObject (obj, cb) {
				test.equal(obj.Bucket, 'bucket');
				test.equal(obj.Key, 'STAGE/status.json');
				cb(new Error('aws error'));
			}
		},
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /aws error/i);
			test.end();
		}
	});
});

tap.test('fails if the file is not json', test => {
	lambda({
		events: { context: { 'authorizer-principal-id' : 'me' } },
		bucket: 'bucket',
		stage: 'STAGE',
		s3: {
			getObject (obj, cb) {
				cb(null, { Body: new Buffer('wrong') });
			}
		},
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /invalid json/i);
			test.end();
		}
	});
});

tap.test('returns the json content', test => {
	lambda({
		events: { context: { 'authorizer-principal-id' : 'me' } },
		bucket: 'facia-switches',
		stage: 'CODE',
		s3: {
			getObject (obj, cb) {
				cb(null, {
					Body: new Buffer(JSON.stringify({
						object: true
					}))
				});
			}
		},
		callback (err, data) {
			test.ifError(err);
			test.deepEqual(data, {
				object: true
			});
			test.end();
		}
	});
});
