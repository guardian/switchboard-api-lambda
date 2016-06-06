import AWS from 'aws-sdk';
import {isUserAuthenticated, parseUser, isUserAllowed} from './lib/auth';
import {STAGE, buildPath} from './lib/env';
import {fetchSwitches, fetchStatus} from './lib/fetch';
import {statusKey} from './lib/keys';

const s3Module = new AWS.S3();
const lambdaModule = new AWS.Lambda();

const DEFAULT_BUCKET = 'facia-switches';
const SENDER = 'aws-cms-fronts@theguardian.com';
const EMAIL_LAMBDA = 'send-email-lambda-Lambda-K6KFP5O8NU99';
const EMAIL_TEMPLATE = `
<html>
<body>
Switch {{ switchName }} was turned {{ switchStatus }} by <a href="mailto:{{ user.email }}">{{ user.name }}</a>.
<br><br>
Yours, <a href="https://{{ application }}">Switchboard</a>.
</body>
</html>`;

export function handler (events, context, callback) {
	handleEvents({events, callback, s3: s3Module, stage: STAGE, bucket: DEFAULT_BUCKET, lambda: lambdaModule});
}

export default function handleEvents ({events, callback, s3, bucket, stage, lambda}) {
	if (!isUserAuthenticated(events.context)) {
		callback(new Error('User is not authenticated'));
	} else if (!isValidParams(events.params)) {
		callback(new Error('Invalid input parameters. Missing switch or status.'));
	} else {
		const user = parseUser(events.context);
		Promise.all([
			fetchSwitches({bucket, s3, stage}),
			fetchStatus({bucket, s3, stage})
		])
		.then(([switchesDefinition, status]) => {
			validateToggle({params: events.params, s3, stage, bucket, switchesDefinition, status, user, lambda, callback});
		})
		.catch(callback);
	}
}

function isValidParams (params) {
	return params && params.switch && params.status && ['off', 'on'].includes(params.status);
}

function validateToggle ({params, s3, stage, bucket, switchesDefinition, status, user, lambda, callback}) {
	const switchToToggle = switchesDefinition.switches.filter(single => single.name === params.switch)[0];
	if (switchToToggle) {
		validateUser({params, s3, stage, bucket, switchToToggle, switchesDefinition, status, user, lambda, callback});
	} else {
		callback(new Error('Invalid switch: ' + params.switch));
	}
}

function validateUser ({params, s3, stage, bucket, switchToToggle, switchesDefinition, status, user, lambda, callback}) {
	if (user && isUserAllowed(user.email, switchToToggle, switchesDefinition.userGroups)) {
		validateAction({params, s3, stage, bucket, switchToToggle, switchesDefinition, status, user, lambda, callback});
	} else {
		callback(new Error('User is not authorized to toggle ' + switchToToggle.name));
	}
}

function validateAction ({params, s3, stage, bucket, switchToToggle, switchesDefinition, status, user, lambda, callback}) {
	const previousValue = status[switchToToggle.name];
	const newValue = params.status === 'on';
	if (previousValue === newValue) {
		callback(null);
	} else {
		toggle({value: newValue, s3, stage, bucket, switchToToggle, switchesDefinition, status, user, lambda, callback});
	}
}

function toggle ({value, s3, stage, bucket, switchToToggle, switchesDefinition, status, user, lambda, callback}) {
	const newStatus = Object.assign({}, status, { [switchToToggle.name]: value });
	sendEmailIfNecessary({switchToToggle, userGroups: switchesDefinition.userGroups, lambda, user, value, stage})
	.then(() => {
		s3.upload({
			Bucket: bucket,
			Key: statusKey(stage),
			Body: JSON.stringify(newStatus),
			ACL: 'private',
			ContentType: 'application/json'
		}, callback);
	})
	.catch(callback);
}

function sendEmailIfNecessary ({switchToToggle, userGroups, lambda, user, value, stage}) {
	if (switchToToggle.emailOnChange) {
		const to = switchToToggle.emailOnChange.reduce((emails, group) => {
			return emails.concat(userGroups[group]);
		}, []);

		return new Promise((resolve, reject) => {
			lambda.invoke({
				FunctionName: EMAIL_LAMBDA,
				InvocationType: 'RequestResponse',
				Payload: JSON.stringify({
					from: SENDER,
					to: to,
					subject: 'Switchboard configuration alert',
					template: EMAIL_TEMPLATE,
					env: {
						user,
						switchName: switchToToggle.name,
						switchStatus: value ? 'on' : 'off',
						application: buildPath(stage)
					}
				})
			}, err => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	} else {
		return Promise.resolve();
	}
}
