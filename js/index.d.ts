/// <reference types="express" />
import * as express from "express";
import * as sql from "mssql";
export * from "mssql";
export declare type ConfigSource = (req: express.Request) => sql.config;
export declare type ConnectedPoolCallback = (req: express.Request, pool: sql.ConnectionPool) => void;
export interface Options {
    configSrc: ConfigSource;
    msnodesqlv8?: boolean;
    connectedPoolCallback?: ConnectedPoolCallback;
    connectErrorCode?: number;
    connectErrorMsg?: string;
    badConfigErrorMsg?: string;
    poolErrorCallback?: (err: any) => void;
}
export declare function get(options: Options): express.RequestHandler;
