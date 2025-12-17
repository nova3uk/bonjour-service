"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePacketToServices = void 0;
const dns_equal_1 = __importDefault(require("./dns-equal"));
const service_types_1 = require("../service-types");
function parsePacketToServices(txtParser, name, packet, referer, receiveTime) {
    const records = packet.answers
        .concat(packet.additionals)
        .filter((rr) => "ttl" in rr && rr.ttl && rr.ttl > 0);
    return records
        .map((ptr) => {
        if (ptr.type !== "PTR" || !(0, dns_equal_1.default)(ptr.name, name))
            return;
        const service = {
            addresses: [],
            subtypes: [],
            name: "",
            fqdn: "",
            type: undefined,
            protocol: undefined,
            host: "",
            port: 0,
            referer,
            txt: {},
            rawTxt: undefined,
            ttl: ptr.ttl,
            lastSeen: receiveTime,
        };
        for (const rr of records) {
            if (rr.type === "PTR" &&
                (0, dns_equal_1.default)(rr.data, ptr.data) &&
                rr.name.includes("._sub")) {
                const types = (0, service_types_1.toType)(rr.name);
                if (types.subtype)
                    service.subtypes.push(types.subtype);
            }
            else if (rr.type === "SRV" && (0, dns_equal_1.default)(rr.name, ptr.data)) {
                const parts = rr.name.split(".");
                const name = parts[0];
                const types = (0, service_types_1.toType)(parts.slice(1, -1).join("."));
                service.name = name;
                service.fqdn = rr.name;
                service.host = rr.data.target;
                service.port = rr.data.port;
                service.type = types.name;
                service.protocol = types.protocol;
            }
            else if (rr.type === "TXT" && (0, dns_equal_1.default)(rr.name, ptr.data)) {
                const data = Array.isArray(rr.data) ? rr.data : [rr.data];
                service.rawTxt = data;
                service.txt = txtParser.decodeAll(data);
            }
        }
        if (!service.name)
            return;
        for (const rr of records) {
            if ((rr.type === "A" || rr.type === "AAAA") &&
                (0, dns_equal_1.default)(rr.name, service.host)) {
                service.addresses.push(rr.data);
            }
        }
        return service;
    })
        .filter((rr) => !!rr);
}
exports.parsePacketToServices = parsePacketToServices;
//# sourceMappingURL=parse-packet.js.map