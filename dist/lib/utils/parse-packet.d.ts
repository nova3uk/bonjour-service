/// <reference types="node" />
import type { ResponsePacket } from "../../../multicast-dns";
import type { DiscoveredService } from "../browser";
import type { RemoteInfo } from "dgram";
import DnsTxt from "../dns-txt";
export declare function parsePacketToServices(txtParser: DnsTxt, name: string, packet: ResponsePacket, referer: RemoteInfo, receiveTime: number): DiscoveredService[];
