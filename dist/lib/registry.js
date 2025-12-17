"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registry = void 0;
const dns_equal_1 = __importDefault(require("./utils/dns-equal"));
const service_1 = __importDefault(require("./service"));
const REANNOUNCE_MAX_MS = 60 * 60 * 1000;
const REANNOUNCE_FACTOR = 3;
const noop = function () { };
class Registry {
    constructor(server) {
        this.services = [];
        this.ownedNames = new Set();
        this.server = server;
    }
    publish(config, options) {
        function start(service, registry, opts) {
            if (service.activated)
                return;
            service.activated = true;
            registry.services.push(service);
            if (!(service instanceof service_1.default))
                return;
            if (opts === null || opts === void 0 ? void 0 : opts.probe) {
                registry.probe(registry.server.mdns, service, (exists) => {
                    if (exists) {
                        if (service.stop !== undefined)
                            service.stop();
                        console.log(new Error('Service name is already in use on the network'));
                        return;
                    }
                    registry.announce(registry.server, service, options);
                });
            }
            else {
                registry.announce(registry.server, service, options);
            }
        }
        function stop(service, registry, callback) {
            if (!callback)
                callback = noop;
            if (!service.activated)
                return process.nextTick(callback);
            if (!(service instanceof service_1.default))
                return process.nextTick(callback);
            registry.teardown(registry.server, service, callback);
            const index = registry.services.indexOf(service);
            if (index !== -1)
                registry.services.splice(index, 1);
        }
        const service = new service_1.default(config);
        service.start = start.bind(null, service, this);
        service.stop = stop.bind(null, service, this);
        this.ownedNames.add(service.fqdn);
        service.start({ probe: config.probe !== false });
        return service;
    }
    unpublishAll(callback) {
        this.teardown(this.server, this.services, callback);
        this.services = [];
    }
    destroy() {
        this.services.map(service => service.destroyed = true);
    }
    probe(mdns, service, callback) {
        if (this.ownedNames.has(service.fqdn)) {
            return process.nextTick(() => callback(false));
        }
        var sent = false;
        var retries = 0;
        var timer;
        const send = () => {
            if (!service.activated || service.destroyed)
                return;
            mdns.query(service.fqdn, 'ANY', function () {
                sent = true;
                timer = setTimeout(++retries < 3 ? send : done, 250);
                timer.unref();
            });
        };
        const onresponse = (packet) => {
            if (!sent)
                return;
            if (packet.answers.some(matchRR) || packet.additionals.some(matchRR))
                done(true);
        };
        const matchRR = (rr) => {
            return (0, dns_equal_1.default)(rr.name, service.fqdn);
        };
        const done = (exists) => {
            mdns.removeListener('response', onresponse);
            clearTimeout(timer);
            callback(!!exists);
        };
        mdns.on('response', onresponse);
        setTimeout(send, Math.random() * 250);
    }
    announce(server, service, options) {
        var delay = 1000;
        var packet = service.records();
        server.register(packet);
        const broadcast = () => {
            if (!service.activated || service.destroyed)
                return;
            server.mdns.respond(packet, function () {
                if (!service.published) {
                    service.activated = true;
                    service.published = true;
                    service.emit('up');
                }
                delay = delay * REANNOUNCE_FACTOR;
                if (options === null || options === void 0 ? void 0 : options.announceOnInterval)
                    delay = options.announceOnInterval;
                if (delay > 0 && delay < REANNOUNCE_MAX_MS && !service.destroyed) {
                    setTimeout(broadcast, delay).unref();
                }
            });
        };
        broadcast();
    }
    teardown(server, services, callback) {
        if (!Array.isArray(services))
            services = [services];
        services = services.filter((service) => service.activated);
        var records = services.flatMap(function (service) {
            service.activated = false;
            var records = service.records();
            records.forEach((record) => {
                record.ttl = 0;
            });
            return records;
        });
        if (records.length === 0)
            return callback && process.nextTick(callback);
        server.unregister(records);
        const GOODBYE_COUNT = 3;
        const GOODBYE_INTERVAL_MS = 250;
        let sentCount = 0;
        const sendGoodbye = () => {
            server.mdns.respond(records, () => {
                sentCount++;
                if (sentCount < GOODBYE_COUNT) {
                    setTimeout(sendGoodbye, GOODBYE_INTERVAL_MS);
                }
                else {
                    services.forEach(function (service) {
                        service.published = false;
                    });
                    if (typeof callback === "function") {
                        callback.apply(null, arguments);
                    }
                }
            });
        };
        sendGoodbye();
    }
}
exports.Registry = Registry;
exports.default = Registry;
//# sourceMappingURL=registry.js.map