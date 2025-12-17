/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import KeyValue from './KeyValue';
import { EventEmitter } from 'events';
import { RemoteInfo } from 'dgram';
export interface BrowserConfig {
    type: string;
    name?: string;
    protocol?: 'tcp' | 'udp';
    subtypes?: string[];
    txt?: KeyValue;
}
export type BrowserOnUp = (service: DiscoveredService) => void;
export interface DiscoveredService {
    fqdn: string;
    name: string;
    type: string | undefined;
    subtypes: string[];
    protocol: 'tcp' | 'udp' | string | null | undefined;
    addresses: string[];
    host: string;
    port: number;
    txt: Record<string, string>;
    rawTxt: Array<string | Buffer> | undefined;
    referer: RemoteInfo;
    ttl: number | undefined;
    lastSeen: number;
}
export interface BrowserEvents {
    up: [service: DiscoveredService];
    down: [service: DiscoveredService];
    'srv-update': [newService: DiscoveredService, existingService: DiscoveredService];
    'txt-update': [newService: DiscoveredService, existingService: DiscoveredService];
}
export declare class Browser extends EventEmitter<BrowserEvents> {
    private mdns;
    private onresponse;
    private txt;
    private name?;
    private txtQuery;
    private wildcard;
    private _services;
    constructor(mdns: any, opts: BrowserConfig | BrowserOnUp | null, onup?: BrowserOnUp);
    start(): void;
    stop(): void;
    update(): void;
    expire(): void;
    get services(): DiscoveredService[];
    private addService;
    private updateServiceSrv;
    private updateServiceTxt;
    private replaceService;
    private removeService;
    private goodbyes;
}
export default Browser;
