import {buildPath} from './env';

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

export function emailSender (stage, switchName, switchStatus, user, lambda) {
	return function (recipients, callback) {
		lambda.invoke({
			FunctionName: EMAIL_LAMBDA,
			InvocationType: 'RequestResponse',
			Payload: JSON.stringify({
				from: SENDER,
				to: recipients,
				subject: 'Switchboard configuration alert',
				template: EMAIL_TEMPLATE,
				env: {
					user,
					switchName: switchName,
					switchStatus: switchStatus,
					application: buildPath(stage)
				}
			})
		}, callback);
	};
}
