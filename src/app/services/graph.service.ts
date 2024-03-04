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

  root: IGraph = {
    description: '',
    entry: '',
    nodes: [],
    connections: [],
    executions: [],
    registries: [],
  }

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

  async loadGraph(graph: string, writable: boolean, loadCb: LoadingGraphFunction): Promise<void> {

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

      await loadCb(g);

      await Promise.all([prom]);

      this.lastGraph = graph;
      this.root = g;

      this.graphEntry$.next(g.entry);
      this.graphRegistries$.next(registries);
      this.permission$.next(writable ? Permission.Writable : Permission.ReadOnly);
    });
  }

  serializeGraph(): string {
    const g = dump(this.root, {
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



