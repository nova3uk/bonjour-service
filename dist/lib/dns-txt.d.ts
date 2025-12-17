/// <reference types="node" />
import KeyValue from './KeyValue';
export declare class DnsTxt {
    private binary;
    constructor(opts?: KeyValue);
    encode(data?: KeyValue): Buffer[];
    decode(buffer: Buffer | string): KeyValue;
    decodeAll(buffer: Array<Buffer | string>): KeyValue;
}
export default DnsTxt;
