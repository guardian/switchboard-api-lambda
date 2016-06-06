export function isUserAuthenticated (context = {}) {
	return !!context['authorizer-principal-id'];
}
