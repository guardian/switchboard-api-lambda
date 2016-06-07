import AWS from 'aws-sdk';
import {isUserAuthenticated, parseUser, isUserAllowed} from './lib/auth';
import {STAGE} from './lib/env';
import {fetchSwitches, fetchStatus} from './lib/fetch';
import {createStatusStore} from './lib/store';
import {emailSender} from './lib/email';

const s3Module = new AWS.S3();
const lambdaModule = new AWS.Lambda();

const DEFAULT_BUCKET = 'facia-switches';

export function handler (events, context, callback) {
	handleEvents({events, callback, s3: s3Module, stage: STAGE, bucket: DEFAULT_BUCKET, lambda: lambdaModule});
}

export default function handleEvents ({events, callback, s3, bucket, stage, lambda}) {
	if (!isUserAuthenticated(events.context)) {
		callback(new Error('User is not authenticated'));
	} else if (!isValidParams(events.params)) {
		callback(new Error('Invalid input parameters. Missing switch or status.'));
	} else {
		const {'switch': switchName, 'status': switchStatus} = events.params.path;
		const user = parseUser(events.context);
		const store = createStatusStore(bucket, stage, s3);
		const email = emailSender(stage, switchName, switchStatus, user, lambda);

		Promise.all([
			fetchSwitches({bucket, s3, stage}),
			fetchStatus({bucket, s3, stage})
		])
		.then(([switchesDefinition, status]) => {
			const switchToToggle = switchesDefinition.switches.filter(single => single.name === switchName)[0];
			if (isValidRequest(switchName, switchStatus, status, switchToToggle, user, switchesDefinition.userGroups, callback)) {
				toggle({switchName, switchStatus, switchToToggle, switchesDefinition, status, store, email, callback});
			}
		})
		.catch(callback);
	}
}

function isValidParams ({path} = {}) {
	return path && path.switch && path.status && ['off', 'on'].indexOf(path.status) !== -1;
}

function isValidRequest (switchName, switchStatus, status, switchToToggle, user, userGroups, callback) {
	const previousValue = status[switchName];
	const newValue = switchStatus === 'on';

	if (!switchToToggle) {
		callback(new Error('Invalid switch: ' + switchName));
	} else if (!user || !isUserAllowed(user.email, switchToToggle, userGroups)) {
		callback(new Error('User is not authorized to toggle ' + switchName));
	} else if (previousValue === newValue) {
		callback(null);
	} else {
		return true;
	}
}

function toggle ({switchName, switchStatus, store, switchToToggle, switchesDefinition, status, email, callback}) {
	const value = switchStatus === 'on';
	const newStatus = Object.assign({}, status, { [switchName]: value });
	sendEmailIfNecessary({switchToToggle, userGroups: switchesDefinition.userGroups, email})
	.then(() => {
		store(newStatus, callback);
	})
	.catch(callback);
}

function sendEmailIfNecessary ({switchToToggle, userGroups, email}) {
	if (switchToToggle.emailOnChange) {
		const to = switchToToggle.emailOnChange.reduce((emails, group) => {
			return emails.concat(userGroups[group]);
		}, []);

		return new Promise((resolve, reject) => {
			email(to, err => {
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
