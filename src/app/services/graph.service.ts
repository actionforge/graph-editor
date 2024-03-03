import { Injectable, Injector, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { BaseNode, SubGraphNode } from '../helper/rete/basenode';
import { dump, load } from 'js-yaml';
import { NodeFactory } from './nodefactory.service';
import { generateRandomWord } from '../helper/wordlist';
import { IConnection, IExecution, IGraph, IInput, IOutput, INode, ISubGraph } from '../schemas/graph';
import { NodeEditor } from 'rete';
import { AreaPlugin, NodeView } from 'rete-area-plugin';
import { parseRegistryUri } from '../helper/utils';
import { HostService } from './host.service';
import { Registry } from './registry.service';
import { AreaExtra, ReteService, Schemes } from './rete.service';

import AsyncLock from 'async-lock';

export interface SourceInfo {
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
  vscode = inject(HostService);
  rs = inject(ReteService);

  loadingLock = new AsyncLock();

  lastGraph = '';
  nodes = new Map<string, INode>();

  private sourceInfo = new BehaviorSubject<SourceInfo | null>(null);
  sourceInfoObservable$ = this.sourceInfo.asObservable();

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
      if (graph === "" || Object.keys(g).length === 0) {

        g = {
          description: '',
          entry: "gh-start",
          nodes: [
            {
              id: "gh-start",
              type: "gh-start@v1",
              inputs: {},
              position: { x: 100, y: 100 },
              settings: undefined,
            },
            {
              id: "gh-checkout",
              type: "github.com/actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11", // @v4.1.1
              inputs: {},
              position: { x: 450, y: 100 },
              settings: undefined,
            },
          ],
          connections: [],
          executions: [{
            src: {
              port: "exec-on-push",
              node: "gh-start",
            }, dst: {
              port: "exec",
              node: "gh-checkout",
            }
          }],
          registries: [],
        };
      }

      const registries = new Set(g.registries);
      const prom = nr.loadBasicNodeTypeDefinitions(registries);

      await cb(g);

      await Promise.all([prom]);

      this.lastGraph = graph;

      this.graphEntry$.next(g.entry);
      this.graphRegistries$.next(registries);
      this.permission$.next(Permission.Writable);
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

    const nodes: (INode | (INode & IGraph))[] = [];
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
      if (node instanceof SubGraphNode) {
        nodes.push({
          id: node.id,
          type: node.getType(),
          position: view?.position || { x: 0, y: 0 },
          inputs: Object.values(inputs).length > 0 ? inputs : undefined,
          outputs: Object.values(outputs).length > 0 ? outputs : undefined,
          settings: Object.values(node.getSettings()).length > 0 ? node.getSettings() : undefined,
          ... {
            entry: "123"
          }
        });
      } else {
        nodes.push({
          id: node.id,
          type: node.getType(),
          position: view?.position || { x: 0, y: 0 },
          inputs: Object.values(inputs).length > 0 ? inputs : undefined,
          outputs: Object.values(outputs).length > 0 ? outputs : undefined,
          settings: Object.values(node.getSettings()).length > 0 ? node.getSettings() : undefined
        });
      }
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
      executions,
      connections,
      nodes,
      registries: [...gs.getRegistries()],
      description,
    };

    const g = dump(graph, {
      noCompatMode: true,
    });

    this.lastGraph = g;

    return g;
  }

  async createNode(nodeTypeId: string, args: {
    nodeId: string | null,
    userCreated: boolean,
    inputValues?: { [key: string]: IInput },
    outputValues?: { [key: string]: IOutput },
    graph?: ISubGraph,
  }): Promise<BaseNode> {
    const sanitizedNodeId = nodeTypeId.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^github.com-/, 'gh-');

    if (!args.nodeId) {
      args.nodeId = `${sanitizedNodeId}-${generateRandomWord(3)}`
    }

    const node: BaseNode = await this.nf.createNode(args.nodeId, {
      type: nodeTypeId,
      inputChangeEvent: this.inputChangeEvent,
      inputValues: args.inputValues,
      outputValues: args.outputValues,
      graph: args.graph,
    });

    await this.rs.getEditor().addNode(node);

    this.nodeCreated.next({ node: node, userCreated: args.userCreated });

    return node
  }

  async deleteNode(nodeId: string): Promise<void> {
    const associcatedNodes = new Set<string>();

    for (const conn of this.rs.getEditor().getConnections()) {
      if (conn.source === nodeId || conn.target === nodeId) {
        await this.rs.getEditor().removeConnection(conn.id);
        if (conn.source === nodeId) {
          associcatedNodes.add(conn.target);
        } else {
          associcatedNodes.add(conn.source);
        }
      }
    }

    await this.rs.getEditor().removeNode(nodeId);

    const promisesNodes = [];
    for (const subNodeId of associcatedNodes) {
      promisesNodes.push(this.rs.getArea()!.update("node", subNodeId));
    }
    await Promise.all(promisesNodes);
  }

  isLoading(): boolean {
    return this.loadingLock.isBusy("loadGraph");
  }

  getPermission(): Permission {
    return this.permission$.value;
  }

  removeRegistry(uri: string): void {
    try {
      parseRegistryUri(uri);
    } catch (error) {
      console.log(error);
      return;
    }
    const registries = this.graphRegistries$.value;
    registries.delete(uri);
    this.graphRegistries$.next(registries);
  }

  addRegistry(uri: string): void {
    try {
      parseRegistryUri(uri);
    } catch (error) {
      console.log(error);
      return;
    }
    const registries = this.graphRegistries$.value;
    registries.add(uri);
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

  setSource(o: SourceInfo): void {
    this.sourceInfo.next(o);
  }
}



