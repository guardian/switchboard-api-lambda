export function isUserAuthenticated (context = {}) {
	return !!context['authorizer-principal-id'];
}

export function parseUser (context = {}) {
	const match = context['authorizer-principal-id'].match(/(.*)\s?<(.*)>/);

	if (match) {
		return {
			name: match[1].trim(),
			email: match[2].toLowerCase()
		};
	}
}

export function isUserAllowed (email, switchDescription, userGroups) {
	const canModify = switchDescription.canModify;

	if (canModify && canModify.length > 0) {
		return canModify.find(group => userGroups[group] && userGroups[group].indexOf(email) !== -1);
	} else {
		return true;
	}
}
