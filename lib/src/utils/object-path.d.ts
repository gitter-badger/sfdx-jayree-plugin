import * as objectPath from 'object-path';
interface QueryParameters {
    path: any;
    key?: any;
    value?: any;
}
declare class ObjectPathResolver {
    private _path;
    private _object;
    constructor(object: any);
    value(): any[];
    resolve({ path, key, value }: QueryParameters): this;
    resolveString(string: any): this;
}
export { ObjectPathResolver, objectPath };
