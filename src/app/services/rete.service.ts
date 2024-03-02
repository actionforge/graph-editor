import { Injectable } from "@angular/core";
import { ReadonlyPlugin } from "rete-readonly-plugin";
import { AreaExtra, Schemes } from "../helper/rete/editor";
import { NodeEditor } from "rete";
import { AreaPlugin } from "rete-area-plugin";
import { AutoArrangePlugin } from "rete-auto-arrange-plugin";

@Injectable({
    providedIn: 'root'
})
export class ReteService {
    private readonly = new ReadonlyPlugin<Schemes>();
    private g_editor: NodeEditor<Schemes> | null = null;
    private g_area: AreaPlugin<Schemes, AreaExtra> | null = null
    private g_arrange: AutoArrangePlugin<Schemes, never> | null = null;

    getEditor(): NodeEditor<Schemes> {
        if (this.g_editor === null) {
            throw new Error('Editor not initialized');
        }
        return this.g_editor;
    }

    getArea(): AreaPlugin<Schemes, AreaExtra> {
        if (this.g_area === null) {
            throw new Error('Area not initialized');
        }
        return this.g_area;
    }

    getArrange(): AutoArrangePlugin<Schemes, never> {
        if (this.g_arrange === null) {
            throw new Error('Arrange not initialized');
        }
        return this.g_arrange;
    }
}