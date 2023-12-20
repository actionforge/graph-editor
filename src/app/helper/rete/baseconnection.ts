import { ClassicPreset } from "rete";
import { BaseNode } from "./basenode";
import { BaseSocket } from "./basesocket";


export class BaseConnection<Source extends BaseNode, Target extends BaseNode> extends ClassicPreset.Connection<Source, Target> {
    constructor(source: Source, sourceSocket: BaseSocket, target: Target, targetSocket: BaseSocket) {
        super(source, sourceSocket.name, target, targetSocket.name);
    }
}