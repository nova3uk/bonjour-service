"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = void 0;
const dns_txt_1 = __importDefault(require("./dns-txt"));
const dns_equal_1 = __importDefault(require("./utils/dns-equal"));
const events_1 = require("events");
const service_types_1 = require("./service-types");
const filter_service_1 = __importDefault(require("./utils/filter-service"));
const filter_txt_1 = __importDefault(require("./utils/filter-txt"));
const equal_txt_1 = __importDefault(require("./utils/equal-txt"));
const parse_packet_1 = require("./utils/parse-packet");
const TLD = '.local';
const WILDCARD = '_services._dns-sd._udp' + TLD;
class Browser extends events_1.EventEmitter {
    constructor(mdns, opts, onup) {
        super();
        this.onresponse = undefined;
        this.wildcard = false;
        this._services = [];
        if (typeof opts === 'function') {
            onup = opts;
            opts = null;
        }
        this.mdns = mdns;
        this.txt = new dns_txt_1.default(opts !== null && opts.txt != null ? opts.txt : undefined);
        if (opts === null || opts.type === undefined) {
            this.name = WILDCARD;
            this.wildcard = true;
        }
        else {
            this.name = (0, service_types_1.toString)({ name: opts.type, protocol: opts.protocol || 'tcp' }) + TLD;
            if (opts.name)
                this.name = opts.name + '.' + this.name;
            this.wildcard = false;
        }
        if (opts != null && opts.txt !== undefined)
            this.txtQuery = (0, filter_txt_1.default)(opts.txt);
        if (onup)
            this.on('up', onup);
        this.start();
    }
    start() {
        if (this.onresponse || this.name === undefined)
            return;
        var self = this;
        var nameMap = {};
        if (!this.wildcard)
            nameMap[this.name] = true;
        this.onresponse = (packet, rinfo) => {
            if (self.wildcard) {
                packet.answers.forEach((answer) => {
                    if (answer.type !== 'PTR' || answer.name !== self.name || answer.name in nameMap)
                        return;
                    nameMap[answer.data] = true;
                    self.mdns.query(answer.data, 'PTR');
                });
            }
            const receiveTime = Date.now();
            Object.keys(nameMap).forEach(function (name) {
                self.goodbyes(name, packet).forEach(self.removeService.bind(self));
                const matches = (0, parse_packet_1.parsePacketToServices)(self.txt, name, packet, rinfo, receiveTime);
                if (matches.length === 0)
                    return;
                matches.forEach((service) => {
                    const existingService = self._services.find((s) => (0, dns_equal_1.default)(s.fqdn, service.fqdn));
                    if (existingService) {
                        existingService.lastSeen = service.lastSeen;
                        self.updateServiceSrv(existingService, service);
                        self.updateServiceTxt(existingService, service);
                        return;
                    }
                    self.addService(service);
                });
            });
        };
        this.mdns.on('response', this.onresponse);
        this.update();
    }
    stop() {
        if (!this.onresponse)
            return;
        this.mdns.removeListener('response', this.onresponse);
        this.onresponse = undefined;
    }
    update() {
        this.mdns.query(this.name, 'PTR');
    }
    expire() {
        const currentTime = Date.now();
        this._services = this._services.filter((service) => {
            if (!service.ttl)
                return true;
            const expireTime = service.lastSeen + service.ttl * 1000;
            if (expireTime < currentTime) {
                this.emit('down', service);
                return false;
            }
            return true;
        });
    }
    get services() {
        return this._services;
    }
    addService(service) {
        if ((0, filter_service_1.default)(service, this.txtQuery) === false)
            return;
        this._services.push(service);
        this.emit('up', service);
    }
    updateServiceSrv(existingService, newService) {
        if (existingService.name !== newService.name
            || existingService.host !== newService.host
            || existingService.port !== newService.port
            || existingService.type !== newService.type
            || existingService.protocol !== newService.protocol) {
            this.replaceService(newService);
            this.emit('srv-update', newService, existingService);
        }
    }
    updateServiceTxt(existingService, service) {
        if ((0, equal_txt_1.default)(service.txt, (existingService === null || existingService === void 0 ? void 0 : existingService.txt) || {}))
            return;
        if (!(0, filter_service_1.default)(service, this.txtQuery)) {
            this.removeService(service.fqdn);
            return;
        }
        this.replaceService(service);
        this.emit('txt-update', service, existingService);
    }
    replaceService(service) {
        this._services = this._services.map((s) => {
            if (!(0, dns_equal_1.default)(s.fqdn, service.fqdn))
                return s;
            return service;
        });
    }
    removeService(fqdn) {
        var service, index;
        this._services.some(function (s, i) {
            if ((0, dns_equal_1.default)(s.fqdn, fqdn)) {
                service = s;
                index = i;
                return true;
            }
        });
        if (!service || index === undefined)
            return;
        this._services.splice(index, 1);
        this.emit('down', service);
    }
    goodbyes(name, packet) {
        return packet.answers.concat(packet.additionals)
            .filter((rr) => rr.type === 'PTR' && rr.ttl === 0 && (0, dns_equal_1.default)(rr.name, name))
            .map((rr) => rr.data);
    }
}
exports.Browser = Browser;
exports.default = Browser;
//# sourceMappingURL=browser.js.map