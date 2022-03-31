"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuth0 = void 0;
var nextjs_auth0_1 = require("@auth0/nextjs-auth0");
var wrappers_1 = require("./wrappers");
function initAuth0(config) {
    var _a;
    var auth0 = nextjs_auth0_1.initAuth0(config);
    var getSession = wrappers_1.auth0WrapperJson(function (req, res) { return auth0.getSession(req, res); });
    var loginUrl = ((_a = config === null || config === void 0 ? void 0 : config.routes) === null || _a === void 0 ? void 0 : _a.login) || '/api/auth/login';
    return {
        getSession: getSession,
        getAccessToken: wrappers_1.auth0WrapperJson(function (req, res, auth0FnOptions) { return auth0.getAccessToken(req, res, auth0FnOptions); }),
        handleLogin: wrappers_1.auth0Wrapper(function (req, res, auth0FnOptions) { return auth0.handleLogin(req, res, auth0FnOptions); }),
        handleLogout: wrappers_1.auth0Wrapper(function (req, res, auth0FnOptions) { return auth0.handleLogout(req, res, auth0FnOptions); }),
        handleCallback: wrappers_1.auth0Wrapper(function (req, res, auth0FnOptions) { return auth0.handleCallback(req, res, auth0FnOptions); }),
        handleProfile: wrappers_1.auth0Wrapper(function (req, res, auth0FnOptions) { return auth0.handleProfile(req, res, auth0FnOptions); }),
        handleAuth: function (svelteReq) {
            var param = svelteReq.params.auth0;
            var route = Array.isArray(param) ? param[0] : param;
            switch (route) {
                case 'login':
                    return this.handleLogin(svelteReq);
                case 'logout':
                    return this.handleLogout(svelteReq);
                case 'callback':
                    return this.handleCallback(svelteReq);
                case 'me':
                    return this.handleProfile(svelteReq);
                default:
                    return; // Fall through to other handlers
            }
        },
        withPageAuthRequired: function (opts) {
            return function (loadParams) {
                var _a, _b;
                var isAuthenticated = (_a = loadParams.session) === null || _a === void 0 ? void 0 : _a.isAuthenticated;
                if (isAuthenticated) {
                    var user_1 = (_b = loadParams.session) === null || _b === void 0 ? void 0 : _b.user;
                    if ((opts === null || opts === void 0 ? void 0 : opts.load) && typeof (opts === null || opts === void 0 ? void 0 : opts.load) === 'function') {
                        var loadResult = opts === null || opts === void 0 ? void 0 : opts.load(loadParams);
                        // Handle either promises or non-promises without making this function async
                        if (loadResult && typeof loadResult.then === 'function') {
                            // Async load() function
                            return loadResult.then(function (loadResult) {
                                if (loadResult) {
                                    return __assign(__assign({}, loadResult), { props: __assign(__assign({}, loadResult.props), { user: user_1, isAuthenticated: isAuthenticated }) });
                                }
                                else {
                                    // If user's load() function returned nothing, they intend to fall through, so we shouldn't populate user props
                                    return loadResult;
                                }
                            });
                        }
                        else if (loadResult) {
                            // Synchronous load()
                            return __assign(__assign({}, loadResult), { props: __assign(__assign({}, loadResult.props), { user: user_1, isAuthenticated: isAuthenticated }) });
                        }
                        else {
                            // If user's load() function returned nothing, they intend to fall through, so we shouldn't populate user props
                            return loadResult;
                        }
                    }
                    else {
                        // No load function passed, so just populate user prop
                        return { props: { user: user_1, isAuthenticated: isAuthenticated } };
                    }
                }
                else {
                    var queryStr = loadParams.page.query.toString();
                    var returnUrl = (opts === null || opts === void 0 ? void 0 : opts.returnTo) || "" + loadParams.page.path + (queryStr ? '?' + queryStr : '');
                    return {
                        status: 307,
                        redirect: loginUrl + "?returnTo=" + encodeURIComponent(returnUrl)
                    };
                }
            };
        },
        withApiAuthRequired: function (route, opts) {
            if (opts === void 0) { opts = {}; }
            return function (svelteReq) {
                if (svelteReq.locals.isAuthenticated && svelteReq.locals.user && svelteReq.locals.auth0Session) {
                    // Already populated in hooks.ts handle() function, so we don't need to do any work here
                    return route(svelteReq);
                }
                var session = getSession(svelteReq);
                if (session && session.user) {
                    svelteReq.locals.auth0Session = session;
                    svelteReq.locals.user = __assign(__assign({}, svelteReq.locals.user), session.user);
                    svelteReq.locals.isAuthenticated = true;
                    return route(svelteReq);
                }
                else if (opts.unauthHandler && typeof opts.unauthHandler === "function") {
                    return opts.unauthHandler(svelteReq);
                }
                else {
                    return {
                        status: 401,
                        body: opts.unauthJson || {
                            error: 'not_authenticated',
                            description: 'The user does not have an active session or is not authenticated'
                        }
                    };
                }
            };
        },
    };
}
exports.initAuth0 = initAuth0;
