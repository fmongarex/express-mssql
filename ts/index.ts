import * as express from "express";
import * as sql from "mssql";
import * as _ from "lodash";

export type ConfigSource = (req: express.Request) => sql.config;
export type ConnectedPoolCallback = (req: express.Request, pool: sql.ConnectionPool) => void;

export interface Options {
    configSrc: ConfigSource
    msnodesqlv8?: boolean;
    connectedPoolCallback?: ConnectedPoolCallback;
    connectErrorCode?: number;
    connectErrorMsg?: string;
    badConfigErrorMsg?: string;
    poolErrorCallback?: (err: any) => void;
};

let defaultOptions: Options = {
    configSrc: (req: express.Request) => {return null;}
    ,msnodesqlv8: false
    ,connectedPoolCallback: (req: express.Request, pool: sql.ConnectionPool) => {}
    ,connectErrorCode: 500
    ,connectErrorMsg: null
    ,badConfigErrorMsg: "invalid database configuration"
    ,poolErrorCallback: (err: any) => {}
};

function createPool(msnodesqlv8: boolean, config: sql.config) : sql.ConnectionPool {
    if (msnodesqlv8) {
        const nsql = require('mssql/msnodesqlv8');
        return new nsql.ConnectionPool(config);
    } else
        return new sql.ConnectionPool(config);
}

export function get(options: Options) : express.RequestHandler {
    options = options || defaultOptions;
    options = _.assignIn({}, defaultOptions, options);
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        let config = options.configSrc(req);    // get the sql config
        if (!config)
            res.status(500).end(options.badConfigErrorMsg);
        else {
            let pool = createPool(options.msnodesqlv8, config);
            pool.on("error", options.poolErrorCallback)
            .connect()
            .then((value: sql.ConnectionPool) => {
                // connected to the database
                // install lastware to close the db connection
                //////////////////////////////////////////////////////////
                res.on("finish", () => {
                    value.close();
                }).on("close", () => {
                    value.close();
                });
                //////////////////////////////////////////////////////////
                if (typeof options.connectedPoolCallback === "function") options.connectedPoolCallback(req, value);
                next();
            }).catch((err: any) => {
                //connect error
                if (options.connectErrorMsg)
                    res.status(options.connectErrorCode).end(options.connectErrorMsg);
                else
                    res.status(options.connectErrorCode).json(err);
            });
        }
    };
}