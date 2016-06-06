const stage = (process.env.AWS_LAMBDA_FUNCTION_NAME || '')
	.split('-')
	.filter(token => /(CODE?|PROD?)/.test(token))
	.pop();

export const STAGE = stage || 'UNKNOWN';

export function buildPath (stage) {
	return stage === 'PROD' ?
		'https://switchboard.gutools.co.uk' :
		('https://switchboard.' + stage.toLowerCase() + '.dev-gutools.co.uk');
}
