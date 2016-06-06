import AWS from 'aws-sdk';
import {STAGE} from './lib/env';
import {fetchSwitches} from './lib/fetch';
import {isUserAuthenticated} from './lib/auth';

const s3Module = new AWS.S3();

const DEFAULT_BUCKET = 'facia-switches';

export function handler (events, context, callback) {
	console.log('stage', STAGE);
	handleEvents({events, callback, s3: s3Module, stage: STAGE, bucket: DEFAULT_BUCKET});
}

export default function handleEvents ({events, callback, s3, bucket, stage}) {
	if (isUserAuthenticated(events.context)) {
		fetchSwitches({bucket, s3, stage, callback});
	} else {
		callback(new Error('User is not authenticated'));
	}
}
