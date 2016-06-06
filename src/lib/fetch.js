import {switchesKey} from './keys';

export function fetchSwitches ({bucket, stage, s3, callback}) {
	s3.getObject({
		Bucket: bucket,
		Key: switchesKey(stage)
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
