import { BaseSocket } from "./basesocket";
import { IInputDefinition } from "./interfaces/nodes";
import { ClassicPreset } from "rete";


export class BaseInput extends ClassicPreset.Input<BaseSocket> {
    constructor(socket: BaseSocket, label: string, multipleConnections: boolean, def: IInputDefinition, sub: boolean) {
        super(socket, label, multipleConnections);
        this.sub = sub;
        this.def = def;
    }

    isArray(): boolean {
        return this.def.type.startsWith('[]')
    }

    isSub(): boolean {
        return this.sub;
    }

    getDefinition(): IInputDefinition {
        return this.def;
    }

    sub: boolean;
    def: IInputDefinition;
}
