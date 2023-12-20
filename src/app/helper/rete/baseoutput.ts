import { ClassicPreset } from "rete";
import { BaseSocket } from "./basesocket";
import { IOutputDefinition } from "./interfaces/nodes";


export class BaseOutput extends ClassicPreset.Output<BaseSocket> {
    constructor(socket: BaseSocket, label: string, multipleConnections: boolean, def: IOutputDefinition, sub: boolean) {
        super(socket, label, multipleConnections);
        this.sub = sub;
        this.def = def;
    }

    public readonly sub: boolean;
    public readonly def: IOutputDefinition;
}
