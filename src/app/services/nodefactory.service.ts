import { Injectable, Injector, inject } from "@angular/core";
import { BaseNode, SubGraphNode } from "../helper/rete/basenode";
import { IInputDefinition, INodeTypeDefinitionFull, IOutputDefinition } from "../helper/rete/interfaces/nodes";
import { Registry } from "./registry.service";
import { IInput, IOutput } from "../schemas/graph";
import { HostService } from "./host.service";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class NodeFactory {
    injector = inject(Injector);
    host = inject(HostService);

    async createNode(id: string, type: string, inputChangeEvent: Subject<unknown>, inputs?: { [key: string]: IInput }, outputs?: { [key: string]: IOutput }): Promise<BaseNode> {

        const nr = this.injector.get(Registry);

        let nodeDef: INodeTypeDefinitionFull | undefined = nr.getFullNodeTypeDefinitions().get(type);
        if (!nodeDef) {
            await nr.loadFullNodeTypeDefinitions(new Set([type]));
            nodeDef = nr.getFullNodeTypeDefinitions().get(type);
            if (!nodeDef) {
                throw new Error(`Node definition for ${type} not found`);
            }
        }

        let displayName = nodeDef.name;
        if (!displayName && !nodeDef.compact) {
            displayName = `${type} (not found)`;
            nodeDef.name = displayName;
            nodeDef.style = {
                header: {
                    background: "#ff0000"
                },
                body: {
                    background: "#ff0000"
                }
            }
        }

        let n: BaseNode;
        if (nodeDef.id.startsWith("subgraph@")) {
            n = new SubGraphNode(id, type, displayName, nodeDef);
        } else {
            n = new BaseNode(id, type, displayName, nodeDef);
        }

        if (nodeDef.inputs !== undefined) {
            const inputDefs = new Map<string, IInputDefinition>();

            for (const [inputId, inputDef] of Object.entries(nodeDef.inputs)) {
                if (inputDef.group) {
                    if (inputs) {
                        let currentInputIndex = inputDef.index + 1;
                        const r = new RegExp(`^(${inputId})\\[([0-9]+)\\]$`);
                        // for every group, we find the inputs from the graph yaml
                        // and add them to the inputDefs map as these are group maps
                        for (const [portId] of Object.entries(inputs)) {
                            const match = portId.match(r);
                            if (match) {
                                inputDefs.set(portId, {
                                    ...inputDef,
                                    group: undefined,
                                    index: currentInputIndex++,
                                    name: '',
                                });
                            }
                        }
                    }
                }
                inputDefs.set(inputId, inputDef);
            }

            for (const [inputId, inputDef] of inputDefs) {

                const input = n.addInput2(inputId, inputDef, inputChangeEvent, false);

                // Regard the group initial value only for new nodes
                if (inputs === undefined) {
                    if (inputDef.group_initial && typeof inputDef.group_initial === 'number') {
                        for (let i = 0; i < inputDef.group_initial; ++i) {
                            await n.appendInputValue(input, inputChangeEvent);
                        }
                    }
                }
            }
        }

        // Set input values set in the action graph yaml
        if (inputs) {
            for (const [portId, portValue] of Object.entries(inputs)) {
                n.setInputValue(portId, portValue);
            }
        }

        // Add all outputs defined in the node type definition
        if (nodeDef.outputs !== undefined) {
            for (const [outputId, outputDef] of Object.entries(nodeDef.outputs)) {
                const output = n.addOutput2(outputId, outputDef, false);

                // Regard the group initial value only for new nodes
                if (outputs === undefined) {
                    if (outputDef.group_initial && typeof outputDef.group_initial === 'number') {
                        for (let i = 0; i < outputDef.group_initial; ++i) {
                            await n.appendOutputValue(output);
                        }
                    }
                }
            }
        }

        // Add outputs from the 'outputs' section of the action graph yaml.
        if (outputs !== undefined) {
            const r = new RegExp(/^([\w]+)\[[0-9]+\]$/);
            for (const [outputId] of Object.entries(outputs)) {
                const m = outputId.match(r);
                if (!m) {
                    throw new Error(`Invalid output id: ${outputId}`);
                }

                const outputDef: IOutputDefinition | undefined = nodeDef.outputs[m[1]];
                if (!outputDef) {
                    throw new Error(`unknown port id: ${outputId}`);
                }

                if (!outputDef.group) {
                    throw new Error(`port is not a group port: ${outputId}`);
                }

                n.addOutput2(outputId, {
                    ...outputDef,
                    group: false,
                }, true)
            }
        }

        return n
    }
}
