import {switchesKey, statusKey} from './keys';

export function fetchSwitches ({bucket, stage, s3, callback}) {
	getJSON({bucket, s3, key: switchesKey(stage), callback});
}

export function fetchStatus ({bucket, stage, s3, callback}) {
	getJSON({bucket, s3, key: statusKey(stage), callback});
}

function getJSON ({bucket, key, s3, callback}) {
	s3.getObject({
		Bucket: bucket,
		Key: key
	}, (err, data) => {
		if (err) {
			callback(err);
		} else {
			try {
				const json = JSON.parse(data.Body.toString('utf8'));
				callback(null, json);
			} catch (ex) {
				callback(new Error('Invalid JSON in switches file.'));
			}
		}
	});
}
