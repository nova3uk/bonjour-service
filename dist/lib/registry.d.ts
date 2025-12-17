import Server from './mdns-server';
import Service, { ServiceConfig } from './service';
export interface PublishOptions {
    announceOnInterval?: number;
}
export declare class Registry {
    private server;
    private services;
    constructor(server: Server);
    publish(config: ServiceConfig, options?: PublishOptions): Service;
    unpublishAll(callback: CallableFunction | undefined): void;
    destroy(): void;
    private probe;
    private announce;
    private teardown;
}
export default Registry;
