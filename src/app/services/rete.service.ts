import { Injectable, Injector, inject } from "@angular/core";
import { ReadonlyPlugin } from "rete-readonly-plugin";
import { GetSchemes, NodeEditor, Root } from "rete";
import { BaseNodeComponent } from "../components/rete/node/basenode.component";
import { BaseConnectionComponent } from "../components/rete/connection/baseconnection.component";
import { ExtractPayload } from "rete-angular-plugin/presets/classic/types";
import { BaseExecComponent } from "../components/rete/exec/baseexec.component";
import { BaseSocket } from "../helper/rete/basesocket";
import { BaseSocketComponent } from "../components/rete/socket/basesocket.component";
import { BaseControlComponent } from "../components/basecontrol/basecontrol.component";
import { AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import { BaseNode } from "../helper/rete/basenode";
import { BaseConnection } from "../helper/rete/baseconnection";

import {
    ConnectionPlugin,
    Presets as ConnectionPresets,
} from "rete-connection-plugin";

import {
    AngularArea2D,
    AngularPlugin,
    Presets as AngularPresets
} from "rete-angular-plugin/16";

import {
    AutoArrangePlugin,
    Presets as ArrangePresets,
} from 'rete-auto-arrange-plugin';
import { Subject } from "rxjs";

export type Conn = BaseConnection<BaseNode, BaseNode>;
export type Schemes = GetSchemes<BaseNode, Conn>;
export type AreaExtra = AngularArea2D<Schemes>;


@Injectable({
    providedIn: 'root'
})
export class ReteService {
    private injector = inject(Injector);

    editor: NodeEditor<Schemes> | null = null;
    area: AreaPlugin<Schemes, AreaExtra> | null = null;
    arrange: AutoArrangePlugin<Schemes, never> | null = null;

    private onEvent = new Subject<unknown>();
    onEvent$ = this.onEvent.asObservable();

    createEditor(element: HTMLElement): {
        editor: NodeEditor<Schemes>,
        arrange: AutoArrangePlugin<Schemes, never>,
        area: AreaPlugin<Schemes, AreaExtra>,
        connection: ConnectionPlugin<Schemes, AreaExtra>,
    } {
        const readonly = new ReadonlyPlugin<Schemes>();
        const editor = new NodeEditor<Schemes>();
        const area = new AreaPlugin<Schemes, AreaExtra>(element);
        const arrange = new AutoArrangePlugin<Schemes>();
        const connection = new ConnectionPlugin<Schemes, AreaExtra>();
        const angularRender = new AngularPlugin<Schemes, AreaExtra>({ injector: this.injector });

        angularRender.addPreset(
            AngularPresets.classic.setup({
                customize: {
                    node() {
                        return BaseNodeComponent;
                    },
                    connection(_data: ExtractPayload<Schemes, 'connection'>) {
                        return BaseConnectionComponent;
                    },
                    socket(data: ExtractPayload<Schemes, 'socket'>) {
                        if ((data.payload as BaseSocket).isExec()) {
                            return BaseExecComponent;
                        } else {
                            return BaseSocketComponent;
                        }
                    },
                    control(data: ExtractPayload<Schemes, 'control'>) {
                        if (data.payload) {
                            return BaseControlComponent;
                        } else {
                            return null;
                        }
                    },
                },
            })
        );

        connection.addPreset(ConnectionPresets.classic.setup());
        arrange.addPreset(ArrangePresets.classic.setup());

        editor.use(area);
        editor.use(readonly.root);

        area.use(connection);
        area.use(angularRender);
        area.use(arrange);
        area.use(readonly.area);

        this.installPipes(editor);

        editor.addPipe((context) => {
            this.onEvent.next(context);
            return context;
        });

        area.addPipe((context) => {
            this.onEvent.next(context);
            return context;
        });

        connection.addPipe((context) => {
            this.onEvent.next(context);
            return context;
        });

        arrange.addPipe((context) => {
            this.onEvent.next(context);
            return context;
        });

        AreaExtensions.simpleNodesOrder(area)
        AreaExtensions.selectableNodes(area, AreaExtensions.selector(), { accumulating: AreaExtensions.accumulateOnCtrl() });
        AreaExtensions.snapGrid(area, { size: 10, dynamic: true });
        AreaExtensions.showInputControl<Schemes>(area, ({ hasAnyConnection }) => {
            return !hasAnyConnection;
        })

        this.editor = editor;
        this.area = area;
        this.arrange = arrange;

        return { editor, area, arrange, connection };
    }

    hasEditor(): boolean {
        return !!this.editor;
    }

    getEditor(): NodeEditor<Schemes> {
        if (!this.editor) {
            throw new Error('editor not initialized');
        }
        return this.editor as NodeEditor<Schemes>;
    }

    getArea(): AreaPlugin<Schemes, AreaExtra> {
        if (!this.area) {
            throw new Error('area not initialized');
        }
        return this.area;
    }

    getArrange(): AutoArrangePlugin<Schemes, never> {
        if (!this.arrange) {
            throw new Error('arrange not initialized');
        }
        return this.arrange;
    }

    private installPipes(editor: NodeEditor<Schemes>): void {
        editor.addPipe((context: Root<Schemes>) => {
            this.onEvent.next(context);
            return context;

            /*
            const { type } = context as { type: string };
            switch (type) {
                case "connectioncreated": {
                    const { data } = context as { data: { id: string, source: string, sourceOutput: string, target: string, targetInput: string } };

                    const sourceNode: BaseNode | undefined = editor.getNode(data.source);
                    if (sourceNode) {
                        sourceNode.addOutgoingConnection(data.sourceOutput);
                    }

                    break;
                }
                case "connectionremoved": {
                    const { data } = context as { data: { id: string, source: string, sourceOutput: string, target: string, targetInput: string } };

                    const sourceNode: BaseNode | undefined = editor.getNode(data.source)
                    if (sourceNode) {
                        sourceNode.removeOutgoingConnection(data.sourceOutput);
                    }

                    break;
                }
                case "connectioncreate": {
                    const { data } = context as { type: string, data: BaseConnection<BaseNode, BaseNode> };

                    const sourceNode: BaseNode | undefined = editor.getNode(data.source);
                    const targetNode: BaseNode | undefined = editor.getNode(data.target);
                    if (!sourceNode || !targetNode) {
                        return undefined;
                    }

                    const sourceOutput: BaseOutput | undefined = sourceNode.getOutput(data.sourceOutput);
                    const targetInput: BaseInput | undefined = targetNode.getInput(data.targetInput);
                    if (!sourceOutput || !targetInput) {
                        return undefined;
                    }

                    const typeSource = sourceOutput.socket.getInferredType();
                    const typeTarget = targetInput.socket.getInferredType();

                    if (targetInput.socket.isExec()) {
                        if (sourceOutput.socket.isExec()) {
                            return context;
                        } else {
                            return undefined;
                        }
                    } else {
                        if (sourceOutput.socket.isExec()) {
                            return undefined;
                        } else if ([typeSource, 'any', 'unknown'].includes(typeTarget) || typeSource === 'unknown') {
                            return context;
                        }

                        // support for casting types
                        switch (typeTarget) {
                            case 'bool':
                                return typeSource === 'number' ? context : undefined;
                            case 'number':
                                return typeSource === 'bool' ? context : undefined;
                            case 'string':
                                return ['number', 'bool'].includes(typeSource) ? context : undefined;
                            case 'option':
                                return ['number', 'string'].includes(typeSource) ? context : undefined;
                            case '[]bool':
                                return typeSource === '[]number' ? context : undefined;
                            case '[]number':
                                return typeSource === '[]bool' ? context : undefined;
                        }
                        return undefined;
                    }
                }
            }
            */
        })
    }

}
