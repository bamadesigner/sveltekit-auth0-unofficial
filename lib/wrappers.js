"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth0WrapperJson = exports.auth0Wrapper = exports.ResMimic = exports.mkReq = void 0;
function ensureLeadingSlash(path) {
    return path.startsWith('/') ? path : "/" + path;
}
function buildUrl(host, path, query) {
    var slashPath = ensureLeadingSlash(path || '/');
    var urlObj = new URL("https://" + host + slashPath);
    if (typeof query === "string") {
        urlObj.search = query;
    }
    else if (query && typeof query.toString === "function") {
        urlObj.search = query.toString();
    }
    return urlObj.toString();
}
// TODO: Implement caching with WeakMap so that auth0's session cache can be used to best effect, as otherwise we'll be calling this too often
// Cache should, given the same Svelte request object, always return the same NextApiRequest mimic
function mkReq(param) {
    var result = {
        method: 'GET',
        headers: (param.headers ? param.headers : param),
        query: Object.fromEntries(param.query),
        url: buildUrl(param.host || 'localhost', param.path || '/', param.query),
        // TODO: Build "cookies" object since Auth0 will want it
    };
    if (param.body && typeof param.body.getAll === "function") {
        // Body is a ReadOnlyFormData object from Svelte, but auth0-nextjs will expect a plain object
        result.body = Object.fromEntries(param.body);
    }
    else if (typeof param.body === "string") {
        result.body = param.body;
    }
    else {
        result.body = param.body || {};
    }
    return result;
}
exports.mkReq = mkReq;
// TODO: Implement caching with WeakMap based on original Svelte request object (which we'll preserve a reference to in the ResMimic instance so that they're deferenced together)
var ResMimic = /** @class */ (function () {
    function ResMimic() {
        this.headers = new Map();
        this.statusCode = 200;
        this.bodyObj = undefined;
        this.bodyStr = "";
    }
    ResMimic.prototype.getHeader = function (key) {
        var value = this.headers.get(key);
        if (value && value.length === 1) {
            return value[0];
        }
        else {
            return value;
        }
    };
    ResMimic.prototype.setHeader = function (key, value) {
        var oldValue = this.headers.get(key.toLowerCase()) || [];
        var newValue = typeof value === 'string' ? __spreadArray(__spreadArray([], __read(oldValue)), [value]) : __spreadArray(__spreadArray([], __read(oldValue)), __read(value));
        this.headers.set(key.toLowerCase(), newValue);
        return this;
    };
    ResMimic.prototype.writeHead = function (status, reason, headers) {
        this.statusCode = status;
        var realHeaders;
        if (typeof reason === 'string') {
            this.statusMessage = reason;
            realHeaders = headers;
        }
        else if (typeof reason === 'object' && !headers) {
            realHeaders = reason;
        }
        else {
            realHeaders = headers || {};
        }
        for (var key in realHeaders) {
            if (Object.prototype.hasOwnProperty.call(realHeaders, key)) {
                this.setHeader(key, realHeaders[key]);
            }
        }
        return this;
    };
    ResMimic.prototype.end = function () {
        return this;
    };
    ResMimic.prototype.send = function (body) {
        if (typeof body === "object") {
            this.bodyObj = body;
        }
        else {
            this.bodyStr = body;
        }
        return this;
    };
    ResMimic.prototype.status = function (statusCode) {
        this.statusCode = statusCode;
        return this;
    };
    ResMimic.prototype.json = function (bodyObj) {
        this.bodyObj = bodyObj;
        this.setHeader('content-type', 'application/json');
        return this;
    };
    ResMimic.prototype.getSvelteResponse = function () {
        var e_1, _a;
        var status = this.statusCode;
        var headers = {};
        try {
            for (var _b = __values(this.headers.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), k = _d[0], v = _d[1];
                headers[k] = (v.length === 1 ? v[0] : v);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var body = this.bodyObj ? this.bodyObj : this.bodyStr;
        return { status: status, headers: headers, body: body };
    };
    return ResMimic;
}());
exports.ResMimic = ResMimic;
function auth0Wrapper(auth0fn) {
    return function (param, auth0FnOptions) {
        var req = mkReq(param);
        var res = new ResMimic();
        return auth0fn(req, res, auth0FnOptions).then(function () { return res.getSvelteResponse(); }).catch(function (error) { return ({ status: 500, body: error }); });
    };
}
exports.auth0Wrapper = auth0Wrapper;
function auth0WrapperJson(auth0fn) {
    return function (svelteReq, auth0FnOptions) {
        var req = mkReq(svelteReq);
        var res = new ResMimic();
        return auth0fn(req, res, auth0FnOptions);
    };
}
exports.auth0WrapperJson = auth0WrapperJson;
