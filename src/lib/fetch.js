import {switchesKey, statusKey} from './keys';

export function fetchSwitches ({bucket, stage, s3, callback}) {
	return toCallback(
		getJSON({bucket, s3, key: switchesKey(stage)}),
		callback
	);
}

export function fetchStatus ({bucket, stage, s3, callback}) {
	return toCallback(
		getJSON({bucket, s3, key: statusKey(stage)}),
		callback
	);
}

function toCallback (promise, callback) {
	if (callback) {
		return promise.then(data => callback(null, data)).catch(callback);
	} else {
		return promise;
	}
}

function getJSON ({bucket, key, s3}) {
	return new Promise((resolve, reject) => {
		s3.getObject({
			Bucket: bucket,
			Key: key
		}, (err, data) => {
			if (err) {
				reject(err);
			} else {
				try {
					const json = JSON.parse(data.Body.toString('utf8'));
					resolve(json);
				} catch (ex) {
					reject(new Error('Invalid JSON in switches file.'));
				}
			}
		});
	});
}
