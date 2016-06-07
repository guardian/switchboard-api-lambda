import {statusKey} from './keys';

export function createStatusStore (bucket, stage, s3) {
	return function (newStatus, callback) {
		s3.upload({
			Bucket: bucket,
			Key: statusKey(stage),
			Body: JSON.stringify(newStatus),
			ACL: 'private',
			ContentType: 'application/json'
		}, callback);
	};
}
