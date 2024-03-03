import { Injectable, Injector, inject } from "@angular/core";
import { BaseNode, SubGraphNode } from "../helper/rete/basenode";
import { IInputDefinition, INodeTypeDefinitionFull, IOutputDefinition } from "../helper/rete/interfaces/nodes";
import { Registry } from "./registry.service";
import { IGraph, IInput, IOutput, ISubGraph } from "../schemas/graph";
import { HostService } from "./host.service";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class NodeFactory {
    injector = inject(Injector);
    host = inject(HostService);

    async createNode(id: string, args: {
        type: string,
        inputChangeEvent: Subject<unknown>,
        inputValues?: { [key: string]: IInput },
        outputValues?: { [key: string]: IOutput },
        graph?: ISubGraph
    }): Promise<BaseNode> {

        const nr = this.injector.get(Registry);

        let nodeDef: INodeTypeDefinitionFull | undefined = nr.getFullNodeTypeDefinitions().get(args.type);
        if (!nodeDef) {
            await nr.loadFullNodeTypeDefinitions(new Set([args.type]));
            nodeDef = nr.getFullNodeTypeDefinitions().get(args.type);
            if (!nodeDef) {
                throw new Error(`Node definition for ${args.type} not found`);
            }
        }

        let displayName = nodeDef.name;
        if (!displayName && !nodeDef.compact) {
            displayName = `${args.type} (not found)`;
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
        if (nodeDef.id.startsWith("subgraph@") && args.graph !== undefined) {
            if (args.graph?.inputs) {
                nodeDef.inputs = { ...nodeDef.inputs, ...args.graph.inputs };
            }
            if (args.graph?.outputs) {
                nodeDef.outputs = { ...nodeDef.inputs, ...args.graph.outputs };
            }
            n = new SubGraphNode(id, args.type, displayName, nodeDef, args.graph);
        } else {
            n = new BaseNode(id, args.type, displayName, nodeDef);
        }

        if (nodeDef.inputs !== undefined) {
            const inputDefs = new Map<string, IInputDefinition>();

            for (const [inputId, inputDef] of Object.entries(nodeDef.inputs)) {
                if (inputDef.group) {
                    if (args.inputValues) {
                        let currentInputIndex = inputDef.index + 1;
                        const r = new RegExp(`^(${inputId})\\[([0-9]+)\\]$`);
                        // for every group, we find the inputs from the graph yaml
                        // and add them to the inputDefs map as these are group maps
                        for (const [portId] of Object.entries(args.inputValues)) {
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

                const input = n.addInput2(inputId, inputDef, args.inputChangeEvent, false);

                // Regard the group initial value only for new nodes
                if (args.inputValues === undefined) {
                    if (inputDef.group_initial && typeof inputDef.group_initial === 'number') {
                        for (let i = 0; i < inputDef.group_initial; ++i) {
                            n.appendInputValue(input, args.inputChangeEvent);
                        }
                    }
                }
            }
        }

        // Set input values set in the action graph yaml
        if (args.inputValues) {
            for (const [portId, portValue] of Object.entries(args.inputValues)) {
                n.setInputValue(portId, portValue);
            }
        }

        // Add all outputs defined in the node type definition
        if (nodeDef && nodeDef.outputs !== undefined) {
            for (const [outputId, outputDef] of Object.entries(nodeDef.outputs)) {
                const output = n.addOutput2(outputId, outputDef, false);

                // Regard the group initial value only for new nodes
                if (args.outputValues === undefined) {
                    if (outputDef.group_initial && typeof outputDef.group_initial === 'number') {
                        for (let i = 0; i < outputDef.group_initial; ++i) {
                            n.appendOutputValue(output);
                        }
                    }
                }
            }
        }

        // Add outputs from the 'outputs' section of the action graph yaml.
        if (args.outputValues !== undefined) {
            const r = new RegExp(/^([\w]+)\[[0-9]+\]$/);
            for (const [outputId] of Object.entries(args.outputValues)) {
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
