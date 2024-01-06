import { Injectable, Injector, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { BaseNode } from '../helper/rete/basenode';
import { dump, load } from 'js-yaml';
import { NodeFactory } from './nodefactory.service';
import { generateRandomWord } from '../helper/wordlist';
import { IConnection, IExecution, IGraph, IInput, IOutput, INode } from '../schemas/graph';
import { NodeEditor } from 'rete';
import { AreaExtra, Schemes, g_area, g_editor } from '../helper/rete/editor';
import { AreaPlugin, NodeView } from 'rete-area-plugin';
import { RegistryUriInfo, uriToString } from '../helper/utils';
import { VsCodeService } from './vscode.service';
import { Registry } from './registry.service';
import { INodeTypeDefinitionBasic } from '../helper/rete/interfaces/nodes';

import AsyncLock from 'async-lock';

export interface Origin {
  owner: string;
  repo: string;
  ref: string;
  path: string;
}

export type LoadingGraphFunction = (g: IGraph) => Promise<void>;

export enum Permission {
  Unknown,
  ReadOnly,
  Writable,
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  nf = inject(NodeFactory);
  injector = inject(Injector);
  vscode = inject(VsCodeService);

  loadingLock = new AsyncLock();

  lastGraph = '';

  private origin$ = new BehaviorSubject<Origin | null>(null);
  originObservable$ = this.origin$.asObservable();

  private graphEntry$ = new BehaviorSubject<string | null>(null);
  graphEntryObservable$ = this.graphEntry$.asObservable();

  private permission$ = new BehaviorSubject<Permission>(Permission.Unknown);
  permissionObservable$ = this.permission$.asObservable();

  private graphRegistries$ = new BehaviorSubject(new Set<string>());
  graphRegistriesObservable$ = this.graphRegistries$.asObservable();

  private nodeCreated = new Subject<{ node: BaseNode, userCreated: boolean }>();
  onNodeCreated$ = this.nodeCreated.asObservable();

  private inputChangeEvent = new Subject<unknown>();
  onInputChangeEvent$ = this.inputChangeEvent.asObservable();

  inputChangeSubject(): Subject<unknown> {
    return this.inputChangeEvent;
  }

  async loadGraph(graph: string, writable: boolean, cb: LoadingGraphFunction): Promise<void> {

    if (graph !== "" && this.lastGraph === graph) {
      return;
    }

    const nr = this.injector.get(Registry);

    let g = load(graph) as IGraph;

    await this.loadingLock.acquire("loadGraph", async () => {

      this.permission$.next(Permission.Unknown);
      this.lastGraph = '';

      // Assume this is a new document if graph is empty and prefill with a trigger node
      if (!graph || Object.keys(graph).length === 0) {
        await nr.loadBasicNodeTypeDefinitions(new Set(["gh-start@v1"]));

        const nodeGhStart = (nr.getBasicNodeTypeDefinitionsSync() as Map<string, INodeTypeDefinitionBasic>).get("gh-start@v1");
        if (!nodeGhStart) {
          throw new Error("gh-start@v1 not found");
        }

        const nodeGhCheckout = (nr.getBasicNodeTypeDefinitionsSync() as Map<string, INodeTypeDefinitionBasic>).get("github.com/actions/checkout@v4");
        if (!nodeGhCheckout) {
          throw new Error("github.com/actions/checkout not found");
        }

        const startNodeId = "gh-start";
        const checkoutNodeId = "gh-checkout";

        g = {
          description: '',
          entry: startNodeId,
          nodes: [
            {
              id: startNodeId,
              type: nodeGhStart.id,
              inputs: {},
              position: { x: 100, y: 100 },
              settings: undefined,
            },
            {
              id: checkoutNodeId,
              type: nodeGhCheckout.id,
              inputs: {},
              position: { x: 450, y: 100 },
              settings: undefined,
            },
          ],
          connections: [],
          executions: [{
            src: {
              port: "exec-on-push",
              node: startNodeId,
            }, dst: {
              port: "exec",
              node: checkoutNodeId,
            }
          }],
          registries: [],
        };
      }

      const prom = nr.loadBasicNodeTypeDefinitions(this.getRegistries());

      await cb(g);

      await Promise.all([prom]);

      this.lastGraph = graph;
      this.graphRegistries$.next(new Set(g.registries));
      this.graphEntry$.next(g.entry);
      this.permission$.next(writable ? Permission.Writable : Permission.ReadOnly);
    });
  }

  serializeGraph(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>, description: string): string {
    if (!editor || !area) {
      throw new Error('Editor not initialized');
    }

    // Use injector to avoid circular dependency
    const gs = this.injector.get(GraphService);

    const entry = this.graphEntry$.value;
    if (!entry) {
      throw new Error('Entry not set');
    }

    const nodes: INode[] = [];
    const connections: IConnection[] = [];
    const executions: IExecution[] = [];

    const nodeMap = new Map<string, BaseNode>();
    const nodeArray = editor.getNodes();
    for (const node of nodeArray) {
      nodeMap.set(node.id, node);
    }

    for (const [_, node] of nodeMap) {

      // Store all changed input values
      const inputs: Record<string, IInput> = {};

      const defaultInputValues = new Map<string, unknown>();
      if (node.getDefinition().inputs) {
        for (const [key, port] of Object.entries(node.getDefinition().inputs)) {
          defaultInputValues.set(key, port.default);
        }
      }

      for (const [inputId, userValue] of node.getInputValues()) {
        // If the entered value is different than the default value
        // from the node definition, store it in the yaml
        const defValue: unknown | undefined = defaultInputValues.get(inputId);
        if (userValue !== undefined && userValue !== defValue) {
          inputs[inputId] = userValue;
        }
      }

      const outputs: Record<string, IOutput> = {};

      // Add all sub ports to the 'outputs' section of the action graph yaml
      for (const [outputId, output] of node.getOutputs()) {
        if (output.sub) {
          outputs[outputId] = "";
        }
      }

      const view: NodeView | undefined = area.nodeViews.get(node.id);
      nodes.push({
        id: node.id,
        type: node.getType(),
        position: view?.position || { x: 0, y: 0 },
        inputs: Object.values(inputs).length > 0 ? inputs : undefined,
        outputs: Object.values(outputs).length > 0 ? outputs : undefined,
        settings: Object.values(node.getSettings()).length > 0 ? node.getSettings() : undefined
      });
    }

    for (const connection of editor.getConnections()) {

      const sourceNode: BaseNode | undefined = nodeMap.get(connection.source);
      const targetNode: BaseNode | undefined = nodeMap.get(connection.target);

      if (sourceNode && targetNode) {

        const execSource = connection.sourceOutput.startsWith('exec');
        const execTarget = connection.targetInput.startsWith('exec');

        if (execSource && execTarget) {
          executions.push({
            src: {
              node: sourceNode.id,
              port: connection.sourceOutput,
            },
            dst: {
              node: targetNode.id,
              port: connection.targetInput,
            }
          });
        } else if (!execSource && !execTarget) {
          connections.push({
            src: {
              node: sourceNode.id,
              port: connection.sourceOutput,
            },
            dst: {
              node: targetNode.id,
              port: connection.targetInput,
            }
          });
        } else {
          throw new Error("")
        }
      }
    }

    const graph: IGraph = {
      entry,
      executions: executions,
      connections: connections,
      nodes: nodes,
      registries: [...gs.getRegistries()],
      description,
    };

    const g = dump(graph, {
      noCompatMode: true,
    });

    this.lastGraph = g;

    return g;
  }

  async createNode(nodeTypeId: string, nodeId: string | null, userCreated: boolean, inputs?: { [key: string]: IInput }, outputs?: { [key: string]: IOutput }): Promise<BaseNode> {
    const sanitizedNodeId = nodeTypeId.replace(/[^a-zA-Z0-9-]/g, '-');

    if (!nodeId) {
      nodeId = `${sanitizedNodeId}-${generateRandomWord(3)}`
    }

    const node: BaseNode = await this.nf.createNode(nodeId, nodeTypeId, this.inputChangeEvent, inputs, outputs);

    await g_editor!.addNode(node);

    this.nodeCreated.next({ node: node, userCreated });

    return node
  }

  async deleteNode(nodeId: string): Promise<void> {
    // First remove all connections of the node
    // and identify their associcated nodes as
    // they might need to be updated as well,
    // since a connection got taken away from them.
    const promisesConns = [];

    const associcatedNodes = new Set<string>();

    for (const conn of g_editor!.getConnections()) {
      if (conn.source === nodeId || conn.target === nodeId) {
        promisesConns.push(g_editor!.removeConnection(conn.id));
        if (conn.source === nodeId) {
          associcatedNodes.add(conn.target);
        } else {
          associcatedNodes.add(conn.source);
        }
      }
    }

    await g_editor!.removeNode(nodeId);
    await Promise.all(promisesConns);

    const promisesNodes = [];

    for (const subNodeId of associcatedNodes) {
      promisesNodes.push(g_area!.update("node", subNodeId));
    }

    await Promise.all(promisesNodes);
  }

  isLoading(): boolean {
    return this.loadingLock.isBusy("loadGraph");
  }

  getPermission(): Permission {
    return this.permission$.value;
  }

  removeRegistry(registry: string): void {
    const registries = this.graphRegistries$.value;
    registries.delete(registry);
    this.graphRegistries$.next(registries);
  }

  addRegistry(registry: RegistryUriInfo): void {
    // Caller has to make sure that all fields of the type uri are filled
    if (registry.registry === ""
      || registry.owner === ""
      || registry.regname === ""
    ) {
      throw new Error("Invalid registry uri");
    }

    const registries = this.graphRegistries$.value;
    registries.add(uriToString(registry));
    this.graphRegistries$.next(registries);
  }

  getRegistries(): Set<string> {
    return this.graphRegistries$.value;
  }

  getRegistriesCopy(): Set<string> {
    return new Set(this.graphRegistries$.value);
  }

  clear(): void {
    this.graphEntry$.next(null);
  }

  setOrigin(o: Origin): void {
    this.origin$.next(o);
  }
}



