const tap = require('tap');
const lambda = require('../tmp/lambda/toggle').default;

const SWITCHES_RESPONSE = {
	Body: JSON.stringify({
		switches: [{
			name: 'alreadyOn'
		}, {
			name: 'canModify',
			canModify: ['admin'],
			emailOnChange: ['admin']
		}],
		userGroups: {
			admin: ['someone@email.com']
		}
	})
};
const STATUS_RESPONSE = {
	Body: JSON.stringify({ alreadyOn: true })
};
const DEFAULT_S3 = {
	getObject (obj, cb) {
		if (obj.Key.indexOf('switches.json') !== -1) {
			cb(null, SWITCHES_RESPONSE);
		} else if (obj.Key.indexOf('status.json') !== -1) {
			cb(null, STATUS_RESPONSE);
		} else {
			cb(new Error('aws error'));
		}
	}
};

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

tap.test('fails if parameters are missing', test => {
	lambda({
		events: { context: { 'authorizer-principal-id' : 'me' } },
		bucket: 'bucket',
		stage: 'STAGE',
		s3: DEFAULT_S3,
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /invalid input/i);
			test.end();
		}
	});
});


tap.test('fails if S3 cannot get the switches', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'me' },
			params: { path: { switch: 'two', status: 'on' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: {
			getObject (obj, cb) {
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

tap.test('fails if parameters are invalid', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'me' },
			params: { path: { switch: 'alreadyOn', status: 'banana' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: DEFAULT_S3,
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /invalid input/i);
			test.end();
		}
	});
});

tap.test('fails on invalid switch', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'me' },
			params: { path: { switch: 'missing', status: 'off' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: DEFAULT_S3,
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /invalid switch/i);
			test.end();
		}
	});
});

tap.test('denies access to unauthorized users', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'me <anon@email.com>' },
			params: { path: { switch: 'canModify', status: 'off' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: DEFAULT_S3,
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /not authorized/i);
			test.end();
		}
	});
});

tap.test('does nothing if the switch is already in the desired state', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'me <anon@email.com>' },
			params: { path: { switch: 'alreadyOn', status: 'on' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: DEFAULT_S3,
		callback (err) {
			test.ifError(err);
			test.end();
		}
	});
});

tap.test('fails if s3 cannot save the new status', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'me <anon@email.com>' },
			params: { path: { switch: 'alreadyOn', status: 'off' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: Object.assign({
			upload (obj, cb) {
				test.equal(obj.Bucket, 'bucket');
				test.equal(obj.Key, 'STAGE/status.json');
				test.equal(obj.Body, JSON.stringify({ alreadyOn: false }));
				cb(new Error('invalid write'));
			}
		}, DEFAULT_S3),
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /invalid write/i);
			test.end();
		}
	});
});

tap.test('saves the new state when email should not be sent', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'me <anon@email.com>' },
			params: { path: { switch: 'alreadyOn', status: 'off' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: Object.assign({
			upload (obj, cb) {
				cb(null);
			}
		}, DEFAULT_S3),
		callback (err) {
			test.ifError(err);
			test.end();
		}
	});
});

tap.test('fails if the email cannot be sent', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'Long Name <someone@email.com>' },
			params: { path: { switch: 'canModify', status: 'off' } }
		},
		bucket: 'bucket',
		stage: 'STAGE',
		s3: Object.assign({
			upload (obj, cb) {
				cb(null);
			}
		}, DEFAULT_S3),
		lambda: {
			invoke (obj, cb) {
				const payload = JSON.parse(obj.Payload);
				test.deepEqual(payload.to, ['someone@email.com']);
				test.deepEqual(payload.env, {
					user: {
						name: 'Long Name',
						email: 'someone@email.com'
					},
					application: 'https://switchboard.stage.dev-gutools.co.uk',
					switchName: 'canModify',
					switchStatus: 'off'
				});
				cb(new Error('invoke'));
			}
		},
		callback (err) {
			test.type(err, Error);
			test.match(err.message, /invoke/i);
			test.end();
		}
	});
});

tap.test('saves the new state when email is sent correctly', test => {
	lambda({
		events: {
			context: { 'authorizer-principal-id' : 'Long Name <someone@email.com>' },
			params: { path: { switch: 'canModify', status: 'off' } }
		},
		bucket: 'bucket',
		stage: 'PROD',
		s3: Object.assign({
			upload (obj, cb) {
				cb(null);
			}
		}, DEFAULT_S3),
		lambda: {
			invoke (obj, cb) {
				const payload = JSON.parse(obj.Payload);
				test.equal(payload.env.application, 'https://switchboard.gutools.co.uk');
				test.equal(payload.env.switchName, 'canModify');
				test.equal(payload.env.switchStatus, 'off');
				test.deepEqual(payload.env.user, {
					name: 'Long Name',
					email: 'someone@email.com'
				});
				cb(null);
			}
		},
		callback (err) {
			test.ifError(err);
			test.end();
		}
	});
});
