"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sql = require("mssql");
var _ = require("lodash");
;
var defaultOptions = {
    configSrc: function (req) { return null; },
    connectedPoolCallback: function (req, pool) { },
    connectErrorCode: 500,
    connectErrorMsg: null,
    badConfigErrorMsg: "invalid database configuration",
    poolErrorCallback: function (err) { }
};
function get(options) {
    options = options || defaultOptions;
    options = _.assignIn({}, defaultOptions, options);
    return function (req, res, next) {
        var config = options.configSrc(req); // get the sql config
        if (!config)
            res.status(500).end(options.badConfigErrorMsg);
        else {
            var pool = new sql.ConnectionPool(config);
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
