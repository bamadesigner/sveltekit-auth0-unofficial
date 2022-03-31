import type { Request, EndpointOutput } from '@sveltejs/kit';
import type { NextApiRequest, NextApiResponse } from 'next';
declare function mkReq(param: Request): NextApiRequest;
declare class ResMimic {
    headers: Map<string, any>;
    statusCode: number;
    statusMessage: string | undefined;
    bodyObj: {
        [key: string]: any;
    } | undefined;
    bodyStr: string;
    constructor();
    getHeader(key: any): any;
    setHeader(key: string, value: any): this;
    writeHead(status: number, reason?: any, headers?: any): this;
    end(): this;
    send(body: {
        [key: string]: any;
    } | string): this;
    status(statusCode: any): this;
    json(bodyObj: any): this;
    getSvelteResponse(): EndpointOutput;
}
declare function auth0Wrapper(auth0fn: (req: NextApiRequest, res: NextApiResponse, arg2?: any) => Promise<any>): (param: any, auth0FnOptions: any) => Promise<EndpointOutput | {
    status: number;
    body: any;
}>;
declare function auth0WrapperJson(auth0fn: (req: NextApiRequest, res: NextApiResponse, arg2?: any) => any): (svelteReq: Request, auth0FnOptions?: any) => any;
export { mkReq, ResMimic, auth0Wrapper, auth0WrapperJson };
