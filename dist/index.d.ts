import { PublishOptions } from './lib/registry';
import Browser, { BrowserConfig, DiscoveredService } from './lib/browser';
import Service, { ServiceConfig, ServiceReferer } from './lib/service';
export declare class Bonjour {
    private server;
    private registry;
    constructor(opts?: Partial<ServiceConfig>, errorCallback?: Function | undefined);
    publish(opts: ServiceConfig, options?: PublishOptions): Service;
    unpublishAll(callback?: CallableFunction | undefined): void;
    find(opts?: BrowserConfig | null, onup?: (service: DiscoveredService) => void): Browser;
    findOne(opts?: BrowserConfig | null, timeout?: number, callback?: (service: DiscoveredService | null) => void): Browser;
    destroy(callback?: CallableFunction): void;
}
export { Service, ServiceReferer, ServiceConfig, Browser, BrowserConfig, DiscoveredService };
export default Bonjour;
