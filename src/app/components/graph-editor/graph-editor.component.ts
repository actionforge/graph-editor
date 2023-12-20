import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, ViewChild, inject } from '@angular/core';
import { Root } from 'rete';
import { Output, Socket } from 'rete/_types/presets/classic';
import { BaseConnection } from 'src/app/helper/rete/baseconnection';
import { BaseNode } from 'src/app/helper/rete/basenode';
import { BaseSocket } from 'src/app/helper/rete/basesocket';
import { Schemes, area, arrange, createEditor, editor, readonly } from 'src/app/helper/rete/editor';
import { IGraph, INode } from 'src/app/schemas/graph';
import { GraphService, Origin } from 'src/app/services/graph.service';
import { NodeFactory } from 'src/app/services/nodefactory.service';
import { Registry } from 'src/app/services/registry.service';
import { octKey, octTerminal } from '@ng-icons/octicons';
import { tablerBracketsContain, tablerCursorText } from '@ng-icons/tabler-icons';
import { YamlService } from 'src/app/services/yaml.service';
import { allComponents, provideVSCodeDesignSystem } from "@vscode/webview-ui-toolkit";
import { VsCodeMessage, VsCodeService } from 'src/app/services/vscode.service';
import { svgEnvGetIcon, svgEnvArray, svgArchSwitch, svgFor, svgPlatformSwitch, svgNegate, svgBoolXor, svgBoolXand, svgBoolAnd, svgBoolOr, svgBranchIcon, svgParallelFor, svgParallelExec, svgWaitFor } from 'src/app/helper/icons';
import { INodeTypeDefinitionBasic } from 'src/app/helper/rete/interfaces/nodes';
import { load } from 'js-yaml';
import { Observable } from 'rxjs';
import { NotificationService, NotificationType } from 'src/app/services/notification.service';
import { getErrorMessage } from 'src/app/helper/utils';
import { GatewayService } from 'src/app/services/gateway.service';
import { environment } from 'src/environments/environment';
import { featherSearch } from '@ng-icons/feather-icons';
import { SocketData } from 'rete-connection-plugin';
import { BaseInput } from 'src/app/helper/rete/baseinput';
import { BaseOutput } from 'src/app/helper/rete/baseoutput';

provideVSCodeDesignSystem().register(
  // vsCodeButton(),
  // TODO (Seb): I'm lazy, fix this
  allComponents
);

@Component({
  selector: 'app-graph-editor',
  templateUrl: './graph-editor.component.html',
  styleUrls: ['./graph-editor.component.scss']
})
export class GraphEditorComponent implements AfterViewInit, OnDestroy {
  nr = inject(Registry);
  gs = inject(GraphService);
  nf = inject(NodeFactory);
  ns = inject(NotificationService);
  gw = inject(GatewayService);
  injector = inject(Injector);
  yamlService = inject(YamlService);
  vscode = inject(VsCodeService);

  @ViewChild('rete') container!: ElementRef<HTMLElement>;

  loading = false;

  nodeButtonSeries = [
    [
      {
        type: "branch@v1",
        icon: svgBranchIcon,
        tooltip: "Conditional Branch",
      },
    ], [
      {
        type: "for@v1",
        icon: svgFor,
        tooltip: "For Loop",
      },
      {
        type: "parallel-for@v1",
        icon: svgParallelFor,
        tooltip: "Parallel For Loop",
      },
      {
        type: "parallel-exec@v1",
        icon: svgParallelExec,
        tooltip: "Parallel Execution",
      },
      {
        type: "wait-for@v1",
        icon: svgWaitFor,
        tooltip: "Wait For",
      },
    ], [
      {
        type: "switch-platform@v1",
        icon: svgPlatformSwitch,
        tooltip: "Platform Switch",
      },
      {
        type: "switch-arch@v1",
        icon: svgArchSwitch,
        tooltip: "Architecture Switch",
      },
    ], [
      {
        type: "negate@v1",
        icon: svgNegate,
        tooltip: "Negate",
      }
    ], [
      {
        type: "bool-and@v1",
        icon: svgBoolAnd,
        tooltip: "Bool AND",
      },
      {
        type: "bool-or@v1",
        icon: svgBoolOr,
        tooltip: "Bool OR",
      },
      {
        type: "bool-xand@v1",
        icon: svgBoolXand,
        tooltip: "Bool XAND",
      },
      {
        type: "bool-xor@v1",
        icon: svgBoolXor,
        tooltip: "Bool XOR",
      }
    ], [
      {
        type: "env-get@v1",
        icon: svgEnvGetIcon,
        tooltip: "Single Environment Variable",
      },
      {
        type: "env-array@v1",
        icon: svgEnvArray,
        tooltip: "Environment Variables",
      },
      {
        type: "gh-secret@v1",
        icon: octKey,
        tooltip: "Github Secret",
      },
    ], [
      {
        type: "run@v1",
        icon: octTerminal,
        tooltip: "Run",
      }
    ], [
      {
        type: "string-match@v1",
        icon: featherSearch,
        tooltip: "String Match",
      }, {
        type: "string-op@v1",
        icon: tablerBracketsContain,
        tooltip: "String Operations",
      }, {
        type: "string-fmt@v1",
        icon: tablerCursorText,
        tooltip: "String Format",
      }
    ]
  ]

  messageSubscription = this.vscode.messageObservable$.subscribe((e: VsCodeMessage) => {
    const { type, data, requestId } = e.data;
    switch (type) {
      case 'setFileData': {
        const d = data as {
          data: string;
          uri: string;
        }

        const graph = load(d.data) as IGraph | null;
        void this.openGraph(d.uri, graph)
          .catch((error) => {
            console.error(error);
            void this.ns.showNotification(NotificationType.Error, getErrorMessage(error));
          })
        break;
      }
      case 'getFileData': {
        const graph = this.gs.serializeGraph(editor!, area!, '');
        this.vscode.postMessage({ type: 'callbackResponse', requestId, data: graph });
        break;
      }
    }
  });

  isReadOnly(): Observable<boolean> {
    return this.gs.readOnlyObservable$;
  }

  isVsCode(): boolean {
    return environment.vscode;
  }

  isWeb(): boolean {
    return environment.web;
  }

  isDev(): boolean {
    return environment.dev;
  }

  getOrigin(): Observable<Origin | null> {
    return this.gs.originObservable$;
  }

  async openGraph(uri: string, graph: IGraph | null): Promise<void> {
    this.loading = true;

    try {
      // Assume this is a new document if graph is empty and prefill with a trigger node
      if (!graph || Object.keys(graph).length === 0) {
        await this.nr.loadBasicNodeTypeDefinitions(new Set(["gh-start@v1"]));

        const nodeDef = (this.nr.getBasicNodeTypeDefinitionsSync() as Map<string, INodeTypeDefinitionBasic>).get("gh-start@v1");

        const startNodeId = "gh-start";

        graph = {
          description: '',
          entry: startNodeId,
          nodes: [
            {
              id: startNodeId,
              type: nodeDef!.id,
              inputs: {},
              position: { x: 100, y: 100 },
              settings: undefined,
            },
          ],
          connections: [],
          executions: [],
          registries: [],
        };
      }

      await this.loadGraphToEditor(graph);

      this.gs.setRegistries(new Set(graph.registries));
      this.gs.setEntry(graph.entry);
      this.gs.setReadOnly(environment.web || uri.startsWith("git:"));

      await this.nr.loadBasicNodeTypeDefinitions(this.gs.getRegistries());

    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.messageSubscription.unsubscribe()
  }

  async onCreateNode(_event: MouseEvent, nodeTypeId: string): Promise<void> {
    await this.gs.createNode(nodeTypeId, true);
  }

  async createAndAddNodes(node: INode, nodes: Map<string, BaseNode>): Promise<void> {
    const n = await this.nf.createNode(node.id, node.type, node.inputs, node.outputs);
    if (node.settings) {
      n.setSettings(node.settings);
    }

    await editor!.addNode(n);

    if (node.position?.x > 0 && node.position?.y > 0) {
      await area!.translate(n.id, node.position);
    }

    nodes.set(node.id, n);
  }

  async loadGraphToEditor(graph: IGraph): Promise<void> {
    if (!editor) {
      throw new Error('Editor not initialized');
    }

    await editor.clear();

    await this.nr.loadFullNodeTypeDefinitions(new Set(graph.nodes.map(n => n.type)));

    const creates = [];

    const nodes = new Map<string, BaseNode>();
    for (const node of graph.nodes) {
      creates.push(this.createAndAddNodes(node, nodes));
    }

    await Promise.all(creates);

    const createConnections = [];

    // Connect input/output connections
    for (const conn of graph.connections) {
      const sourceNode: BaseNode | undefined = nodes.get(conn.src.node);
      const targetNode: BaseNode | undefined = nodes.get(conn.dst.node);

      if (sourceNode !== undefined && targetNode !== undefined) {
        const srcSocket: Output<Socket> | undefined = sourceNode.getOutput(conn.src.port);
        const dstSocket: Output<Socket> | undefined = targetNode.getInput(conn.dst.port);

        if (srcSocket !== undefined && dstSocket !== undefined) {
          const c = new BaseConnection(sourceNode, srcSocket.socket as BaseSocket, targetNode, dstSocket.socket as BaseSocket);
          createConnections.push(editor.addConnection(c))

        }
      }
    }

    // Connect execution connections
    for (const exec of graph.executions) {
      const sourceNode: BaseNode | undefined = nodes.get(exec.src.node);
      const targetNode: BaseNode | undefined = nodes.get(exec.dst.node);

      if (sourceNode !== undefined && targetNode !== undefined) {
        const srcSocket: BaseOutput | undefined = sourceNode.getOutput(exec.src.port);
        const dstSocket: BaseInput | undefined = targetNode.getInput(exec.dst.port);

        if (srcSocket !== undefined && dstSocket !== undefined) {

          const promise = editor.addConnection(new BaseConnection(sourceNode, srcSocket.socket as BaseSocket, targetNode, dstSocket.socket as BaseSocket));
          createConnections.push(promise);
        }
      }
    }

    await Promise.all(createConnections);

    for (const node of nodes.values()) {
      void area!.update("node", node.id);
    }
  }

  cdr = inject(ChangeDetectorRef);

  async ngAfterViewInit() {

    const { editor, area, connection } = await createEditor(this.container.nativeElement, this.injector);

    editor.use(readonly.root);
    area.use(readonly.area);

    this.gs.onNodeCreated$.subscribe(async (e: { node: BaseNode, userCreated: boolean }) => {
      if (e.userCreated) {
        // center node on screen
        const [hw, hh] = [this.container.nativeElement.clientWidth / 2, this.container.nativeElement.clientHeight / 2];
        const { x, y, k } = area!.area.transform;
        await area!.translate(e.node.id, { x: (hw - x) / k, y: (hh - y) / k });
      }
    });

    connection.addPipe((context) => {
      const { type } = context as { type: string };

      // In the editor, the events 'connectionpick' and 'connectiondrop' are triggered
      // by user actions. When a connection is initiated by the user, a temporary connection
      // is used for interactive purposes. This tempo connection needs to count as an outgoing
      // for the output port, otherwise the output port would disappear on a folded node
      // as soon as the user picked the connection (reducing the number of outgoing connections potentially to 0).
      // Therefore count the temporary connection as well to keep the connection count > 0
      // during the interactive phase.
      switch (type) {
        case "connectionpick": {
          const { data } = context as unknown as { data: { socket: SocketData } };
          console.log("Connection picked on socket");
          const node: BaseNode | undefined = editor.getNode(data.socket.nodeId);
          if (node) {
            node.addOutgoingConnection(data.socket.key);
          }
          break;
        }
        case "connectiondrop": {
          const { data } = context as unknown as { data: { initial: SocketData, socket?: SocketData | null } };
          if (data.socket) {
            // Use the node id, depending on where the connection was dropped.
            // Either on the socket of the output node, or on the socket of the input node.
            console.log("Connection dropped on socket");
            const node: BaseNode | undefined = editor.getNode(data.initial.side === 'output' ? data.initial.nodeId : data.socket.nodeId);
            if (node) {
              node.removeOutgoingConnection(data.initial.key);
            }
          } else {
            console.log("Connection dropped on empty space");
            const node: BaseNode | undefined = editor.getNode(data.initial.nodeId);
            if (node) {
              node.removeOutgoingConnection(data.initial.key);
              // This is a little hack to force the node to re-render
              // after the connection got dropped on empty space.
              void area.update("node", node.id);
            }
          }
          break;
        }
      }
      return context;
    });

    editor.addPipe((context: Root<Schemes>) => {
      const { type, data } = context as { type: string, data: { id: string, source: string, sourceOutput: string } };
      switch (type) {
        case "connectioncreated": {
          console.log("Connection created")
          const node: BaseNode | undefined = editor.getNode(data.source);
          if (node) {
            node.addOutgoingConnection(data.sourceOutput);
          }
          break;
        }
        case "connectionremoved": {
          console.log("Connection removed")
          const node: BaseNode | undefined = editor.getNode(data.source)
          if (node) {
            node.removeOutgoingConnection(data.sourceOutput);
          }
          break;
        }
      }
      return context;
    });

    if (environment.vscode) {

      editor.addPipe((context: Root<Schemes>) => {
        const { type } = context as { type: string };
        switch (type) {
          case "nodecreated":
          case "noderemoved":
          case "connectioncreated":
          case "connectionremoved": {

            // VS Code has no way of knowing if the events are fired by/during
            // loading of the graph, or are user interactions. To avoid
            // the graph file in VS Code being marked as dirty, only
            // send the 'saveGraph' message outside of the loading operation.
            if (!this.loading) {
              const graph = this.gs.serializeGraph(editor, area!, '');
              this.vscode.postMessage({ type: 'saveGraph', requestId: -1, data: graph });
            }
            break;
          }
        }
        return context;
      });
    } else {

      // ensure 'owner' and 'repo' are conform to GitHub name rules.
      // TODO: (Seb) Find proper ruleset in GH docs.
      const pattern = /github\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/;
      const match = location.pathname.match(pattern);
      if (!match) {
        throw new Error('invalid url');
      }

      const owner = match[1] as string;
      const repo = match[2] as string;
      const ref = match[3] as string;
      const path = match[4] as string;
      if (!owner || !repo || !ref || !path) {
        throw new Error('invalid url');
      }

      const graph: IGraph = await this.gw.graphRead({
        provider: 'github', owner, repo, ref, path,
      });
      await this.openGraph(location.pathname, graph);
    }
  }

  async arrangeNodes(): Promise<void> {
    await arrange!.layout();
  }
}
