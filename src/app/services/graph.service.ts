import { Injectable, Injector, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { BaseNode } from '../helper/rete/basenode';
import { dump } from 'js-yaml';
import { NodeFactory } from './nodefactory.service';
import { generateRandomWord } from '../helper/wordlist';
import { IConnection, IExecution, IGraph, IInput, IOutput, INode } from '../schemas/graph';
import { NodeEditor } from 'rete';
import { AreaExtra, Schemes, g_area, g_editor } from '../helper/rete/editor';
import { AreaPlugin, NodeView } from 'rete-area-plugin';
import { RegistryUriInfo, uriToString } from '../helper/utils';
import { VsCodeService } from './vscode.service';
import { environment } from 'src/environments/environment';

export interface Origin {
  owner: string;
  repo: string;
  ref: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  nf = inject(NodeFactory);
  injector = inject(Injector);
  vscode = inject(VsCodeService);

  private origin$ = new BehaviorSubject<Origin | null>(null);
  originObservable$ = this.origin$.asObservable();

  private graphEntry$ = new BehaviorSubject<string | null>(null);
  graphEntryObservable$ = this.graphEntry$.asObservable();

  private readOnly$ = new BehaviorSubject<boolean>(false);
  readOnlyObservable$ = this.readOnly$.asObservable();

  private graphRegistries$ = new BehaviorSubject(new Set<string>());
  graphRegistriesObservable$ = this.graphRegistries$.asObservable();

  private nodeCreated = new Subject<{ node: BaseNode, userCreated: boolean }>();
  onNodeCreated$ = this.nodeCreated.asObservable();

  private inputChangeEvent = new Subject<unknown>();
  onInputChangeEvent$ = this.inputChangeEvent.asObservable();

  constructor() {
    if (environment.vscode) {
      this.onInputChangeEvent$.subscribe(() => {
        if (g_editor && g_area) {
          const graph = this.serializeGraph(g_editor, g_area, '');
          this.vscode.postMessage({ type: 'saveGraph', requestId: -1, data: graph });
        }
      });
    }
  }

  inputChangeSuject(): Subject<unknown> {
    return this.inputChangeEvent;
  }

  async createNode(nodeId: string, userCreated: boolean, inputs?: { [key: string]: IInput }, outputs?: { [key: string]: IOutput }): Promise<BaseNode> {
    const sanitizedNodeId = nodeId.replace(/[^a-zA-Z0-9-]/g, '-');
    const node: BaseNode = await this.nf.createNode(`${sanitizedNodeId}-${generateRandomWord(3)}`, nodeId, this.inputChangeEvent, inputs, outputs);

    await g_editor!.addNode(node);

    this.nodeCreated.next({ node: node, userCreated });

    return node
  }

  isReadOnly(): boolean {
    return this.readOnly$.value;
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly$.next(readOnly);
  }

  serializeGraph(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>, description: string): string {
    if (!editor || !area) {
      throw new Error('Editor not initialized');
    }

    // Use injector to avoid circular dependency
    const gs = this.injector.get(GraphService);

    const entry = gs.getEntry();
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
      view: {
        transform: area.area.transform
      },
    };

    return dump(graph, {
      noCompatMode: true,
    });
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

    for (const nodeId of associcatedNodes) {
      promisesNodes.push(g_area!.update("node", nodeId));
    }

    await Promise.all(promisesNodes);
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

  setEntry(entry: string): void {
    this.graphEntry$.next(entry);
  }

  setRegistries(registries: Set<string>): void {
    this.graphRegistries$.next(registries);
  }

  getEntryObservable(): BehaviorSubject<string | null> {
    return this.graphEntry$;
  }

  getEntry(): string | null {
    return this.graphEntry$.value;
  }
}



