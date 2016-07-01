/* globals Vue */
var mainView, DOMAIN = getDomain();
registerComponents();
load();

function fetchJSON (endpoint) {
    return fetch(endpoint, {
        credentials: 'include',
        mode: 'cors'
    })
    .then(function (response) {
        if (response.ok) {
            return response.json();
        } else {
            return Promise.reject(
                new Error('Invalid server response for ' + endpoint + ': ' + response.status + ' ' + response.statusText)
            );
        }
    });
}

function load () {
    Promise.all([
        fetchJSON('//login' + DOMAIN + '/whoami'),
        fetchJSON('//switchboard-api' + DOMAIN + '/switches'),
        fetchJSON('//switchboard-api' + DOMAIN + '/status')
    ])
    .then(showSwitches)
    .catch(handleAPIError)
    .then(initializeView);
}

function showSwitches (res) {
    var user = res[0];
    var switchesDefinition = res[1];
    var status = res[2];

    document.body.classList.add('body__knownUser');
    document.body.classList.remove('body__unknownUser');
    document.querySelector('html').classList.add('html__knownUser');
    document.querySelector('html').classList.remove('html__unknownUser');
    const loading = document.querySelector('.js-loading');
    loading.parentNode.removeChild(loading);

    return {
        switches: switchesDefinition.switches,
        userGroups: switchesDefinition.userGroups,
        status: status,
        email: user.email,
        api: '//switchboard-api' + DOMAIN
    };
}

function handleAPIError (error) {
    document.querySelector('.js-loading').innerHTML = '<error msg="' + error.message + '"></error>';
}

function initializeView (data) {
    mainView = new Vue({
        el: document.body,
        data: data
    });
}

function changeState (url, localView) {
    localView.loading = true;

    fetch(url, {
        method: 'post',
        mode: 'cors',
        credentials: 'include'
    })
    .then(result => {
        localView.loading = false;
        localView.error = '';
        mainView.status = result;
    })
    .catch(error => {
        localView.loading = false;
        localView.error = error.message;
    });
}

function registerComponents () {
    Vue.component('login', {
        template: '#loginTemplate',
        data: function () {
            return {
                domain: DOMAIN,
                app: 'switchboard'
            };
        }
    });
    Vue.component('error', {
        template: '#errorTemplate',
        props: ['msg']
    });
    Vue.component('switch-card', {
        template: '#switchboardCard',
        props: {
            apiEndpoint: {
                type: String,
                default: '//switchboard-api' + DOMAIN
            },
            name: String,
            description: String,
            status: Boolean,
            loading: Boolean,
            error: String,
            triggersEmail: {
                type: Boolean,
                coerce: function (val) {
                    if (val && 'length' in val) {
                        return val.length > 0;
                    } else {
                        return !!val;
                    }
                }
            },
            preferredState: Boolean,
            inPreferredState: {
                type: Boolean,
                coerce: function (val) {
                    if (val && 'length' in val) {
                        return val[0] === (val[1] || false);
                    } else {
                        return !!val;
                    }
                }
            },
            userHasPermission: {
                type: Boolean,
                coerce: function (val) {
                    if (val && 'length' in val) {
                        var email = val[0].toLowerCase(), canModify = val[1], groups = val[2];
                        if (canModify && canModify.length) {
                            return canModify.filter(function (group) {
                                if (group === 'all') {
                                    return true;
                                } else {
                                    return groups[group].filter(function (name) {
                                        return name.toLowerCase() === email;
                                    }).length > 0;
                                }
                            }).length > 0;
                        } else {
                            return true;
                        }
                    } else {
                        return !!val;
                    }
                }
            },
            actionUrl: {
                type: String,
                coerce: function (val) {
                    if (val && 'length' in val) {
                        const switchName = val[0], api = val[1], status = val[2];
                        return [api, switchName, status ? 'off' : 'on'].join('/');
                    } else {
                        return '/';
                    }
                }
            }
        },
        methods: {
            toggle: function () {
                changeState(this.actionUrl, this);
            }
        }
    });
}

function getDomain () {
    return document.location.host.slice(document.location.host.indexOf('.'));
}
