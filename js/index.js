"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var sql = require("mssql");
var _ = require("lodash");
__export(require("mssql"));
;
var defaultOptions = {
    configSrc: function (req) { return null; },
    msnodesqlv8: false,
    connectedPoolCallback: function (req, pool) { },
    connectErrorCode: 500,
    connectErrorMsg: null,
    badConfigErrorMsg: "invalid database configuration",
    poolErrorCallback: function (err) { }
};
function createPool(msnodesqlv8, config) {
    if (msnodesqlv8) {
        var nsql = require('mssql/msnodesqlv8');
        return new nsql.ConnectionPool(config);
    }
    else
        return new sql.ConnectionPool(config);
}
function get(options) {
    options = options || defaultOptions;
    options = _.assignIn({}, defaultOptions, options);
    return function (req, res, next) {
        var config = options.configSrc(req); // get the sql config
        if (!config)
            res.status(500).end(options.badConfigErrorMsg);
        else {
            var pool = createPool(options.msnodesqlv8, config);
            pool.on("error", options.poolErrorCallback)
                .connect()
                .then(function (value) {
                // connected to the database
                // install lastware to close the db connection
                //////////////////////////////////////////////////////////
                res.on("finish", function () {
                    value.close();
                }).on("close", function () {
                    value.close();
                });
                //////////////////////////////////////////////////////////
                if (typeof options.connectedPoolCallback === "function")
                    options.connectedPoolCallback(req, value);
                next();
            }).catch(function (err) {
                //connect error
                if (options.connectErrorMsg)
                    res.status(options.connectErrorCode).end(options.connectErrorMsg);
                else
                    res.status(options.connectErrorCode).json(err);
            });
        }
    };
}
exports.get = get;
