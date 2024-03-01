import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, ViewChild, inject } from '@angular/core';
import { Root } from 'rete';
import { Output, Socket } from 'rete/_types/presets/classic';
import { BaseConnection } from 'src/app/helper/rete/baseconnection';
import { BaseNode } from 'src/app/helper/rete/basenode';
import { BaseSocket } from 'src/app/helper/rete/basesocket';
import { Schemes, g_area, g_arrange, createEditor, g_editor, readonly, AreaExtra } from 'src/app/helper/rete/editor';
import { IGraph, INode } from 'src/app/schemas/graph';
import { GraphService, Origin, Permission } from 'src/app/services/graph.service';
import { NodeFactory } from 'src/app/services/nodefactory.service';
import { Registry } from 'src/app/services/registry.service';
import { octKey, octPlay, octTerminal } from '@ng-icons/octicons';
import { tablerArrowsJoin, tablerBracketsContain, tablerCpu, tablerCursorText, tablerDeviceDesktop } from '@ng-icons/tabler-icons';
import { YamlService } from 'src/app/services/yaml.service';
import { allComponents, provideVSCodeDesignSystem } from "@vscode/webview-ui-toolkit";
import { HostAppMessage, HostService } from 'src/app/services/host.service';
import { svgEnvGetIcon, svgEnvArray, svgFor, svgBranchIcon, svgParallelFor, svgParallelExec, svgStringArray, svgPrint, svgIterator, svgHttp, svgBoolAnd, svgBoolOr, svgBoolXand, svgBoolXor, svgNegate } from 'src/app/helper/icons';
import { Observable } from 'rxjs';
import { NotificationService, NotificationType } from 'src/app/services/notification.service';
import { getErrorMessage } from 'src/app/helper/utils';
import { GatewayService } from 'src/app/services/gateway.service';
import { environment } from 'src/environments/environment';
import { featherSearch } from '@ng-icons/feather-icons';
import { SocketData } from 'rete-connection-plugin';
import { BaseInput } from 'src/app/helper/rete/baseinput';
import { BaseOutput } from 'src/app/helper/rete/baseoutput';
import { Area2D, AreaExtensions } from 'rete-area-plugin';
import { Transform } from 'rete-area-plugin/_types/area';
import { Clipboard } from '@angular/cdk/clipboard';
import { simpleAmazons3 } from '@ng-icons/simple-icons';
import { remixBarChartGroupedFill, remixFileSearchFill, remixFolderOpenLine, remixSave3Fill } from '@ng-icons/remixicon';
import { dump } from 'js-yaml';

import debounce from 'lodash.debounce';

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
  host = inject(HostService);
  cdr = inject(ChangeDetectorRef);
  clipboard = inject(Clipboard);

  @ViewChild('rete') container!: ElementRef<HTMLElement>;

  debounceOpenGraph = debounce(this.openGraph, 1000, {
    leading: true, // with no delay, open the graph
    trailing: true, // don't discard the last open call
  });

  Permission = Permission;

  onCopyToClipboard(_event: MouseEvent): void {
    const graph = this.gs.serializeGraph(g_editor!, g_area!, "Dev");
    this.clipboard.copy(graph);
  }

  nodeButtonSeries = [
    // Group for Control Flow
    [
      {
        type: "branch@v1",
        icon: svgBranchIcon,
        tooltip: "Conditional Branch",
      },
      {
        type: "for@v1",
        icon: svgFor,
        tooltip: "For Loop",
      },
      {
        type: "iterator@v1",
        icon: svgIterator,
        tooltip: "Iterator",
      },
    ],
    // Group for Multi-threading / Processing
    [
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
        type: "parallel-multi-queue@v1",
        icon: remixBarChartGroupedFill,
        tooltip: "Parallel Multi Queue",
      },
      {
        type: "wait-for@v1",
        icon: tablerArrowsJoin,
        tooltip: "Wait For",
      },
    ],
    // Group for File Handling
    [
      {
        type: "dirwalk@v1",
        icon: remixFileSearchFill,
        tooltip: "Dir Walker",
      },
      {
        type: "file-read@v1",
        icon: remixFolderOpenLine,
        tooltip: "Read File",
      },
      {
        type: "file-write@v1",
        icon: remixSave3Fill,
        tooltip: "Write File",
      },
    ],
    // Group for Internet Access
    [
      {
        type: "http@v1",
        icon: svgHttp,
        tooltip: "Http Branch",
      },
      {
        type: "aws-s3-upload@v1",
        icon: simpleAmazons3,
        tooltip: "AWS S3 Upload",
      },
      {
        type: "aws-s3-list@v1",
        icon: simpleAmazons3,
        tooltip: "AWS S3 List",
      },
    ], [
      {
        type: "run@v1",
        icon: octTerminal,
        tooltip: "Run",
      },
      {
        type: "run-exec@v1",
        icon: octPlay,
        tooltip: "Run Executable",
      }
    ],
    // Boolean operators
    [
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
      },
      {
        type: "negate@v1",
        icon: svgNegate,
        tooltip: "Negate",
      }
    ],
    // Group for String and File Path Operations
    [
      {
        type: "string-match@v1",
        icon: featherSearch,
        tooltip: "String Match",
      },
      {
        type: "string-fmt@v1",
        icon: tablerCursorText,
        tooltip: "String Format",
      },
      {
        type: "string-array@v1",
        icon: svgStringArray,
        tooltip: "String Array",
      },
      {
        type: "filepath-op@v1",
        icon: tablerBracketsContain,
        tooltip: "Filepath Operations",
      },
      {
        type: "filepath-join@v1",
        icon: tablerBracketsContain,
        tooltip: "Filepath Join",
      },
    ],
    // Group for Basic Operations and Utilities
    [
      {
        type: "switch-platform@v1",
        icon: tablerDeviceDesktop,
        tooltip: "Platform Switch",
      },
      {
        type: "switch-arch@v1",
        icon: tablerCpu,
        tooltip: "Architecture Switch",
      },
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
      {
        type: "print@v1",
        icon: svgPrint,
        tooltip: "Print Stuff",
      },
    ],
  ];



  githubGraph = false;

  messageSubscription = this.host.messageObservable$.subscribe(async (e: HostAppMessage) => {
    const { type, data } = e.data;
    switch (type) {
      case 'arrangeNodes': {
        await this.arrangeNodes();
        break;
      }
      case 'fitToCanvas': {
        await this.fitToCanvas();
        break;
      }
      case 'setFileData': {
        const d = data as {
          data: string;
          uri: string;
          transform: Transform | null
        }

        try {
          await this.debounceOpenGraph(d.uri, d.data, d.transform);
        } catch (error) {
          console.error(error);
          void this.ns.showNotification(NotificationType.Error, getErrorMessage(error));
        }
        break;
      }
    }
  });

  getPermission(): Observable<Permission> {
    return this.gs.permissionObservable$;
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

  isGitHubGraph(): boolean {
    return this.githubGraph;
  }

  getOrigin(): Observable<Origin | null> {
    return this.gs.originObservable$;
  }

  async openGraph(uri: string, graph: string, transform: Transform | null): Promise<void> {
    if (!g_editor) {
      throw new Error('editor not initialized');
    } else if (!g_area) {
      throw new Error('area not initialized');
    }

    await this.gs.loadGraph(graph, environment.vscode && !uri.startsWith("git:"), async (g: IGraph) => {
      await this.loadGraphToEditor(g, transform);
    });

    const promises = [];

    for (const node of g_editor.getNodes()) {
      promises.push(g_area.update("node", node.id));
    }

    await Promise.all(promises);

    if (!transform) {
      await this.fitToCanvas();
    }
  }

  ngOnDestroy(): void {
    this.messageSubscription.unsubscribe();
  }

  async onCreateNode(_event: MouseEvent, nodeTypeId: string): Promise<void> {
    await this.gs.createNode(nodeTypeId, null, true);
  }

  async createAndAddNodes(node: INode, nodes: Map<string, BaseNode>): Promise<void> {
    const n = await this.gs.createNode(node.type, node.id, false, node.inputs, node.outputs);
    if (node.settings) {
      n.setSettings(node.settings);
    }

    await g_area!.translate(n.id, node.position);

    nodes.set(node.id, n);
  }

  async loadGraphToEditor(graph: IGraph, transform: Transform | null): Promise<void> {
    if (!g_editor) {
      throw new Error('Editor not initialized');
    }

    this.githubGraph = graph.entry.startsWith("gh-start");

    await g_editor.clear();

    if (transform) {
      await g_area!.area.zoom(transform.k, 0, 0);
      await g_area!.area.translate(transform.x, transform.y);
    }

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
          createConnections.push(g_editor.addConnection(c))
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

          const promise = g_editor.addConnection(new BaseConnection(sourceNode, srcSocket.socket as BaseSocket, targetNode, dstSocket.socket as BaseSocket));
          createConnections.push(promise);
        }
      }
    }

    await Promise.all(createConnections);
  }

  async ngAfterViewInit(): Promise<void> {

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
            const node: BaseNode | undefined = editor.getNode(data.initial.side === 'output' ? data.initial.nodeId : data.socket.nodeId);
            if (node) {
              node.removeOutgoingConnection(data.initial.key);
            }
          } else {
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

    if (environment.vscode || environment.electron) {
      const debounceSaveGraph = debounce(() => {
        if (g_editor && g_area) {
          const graph = this.gs.serializeGraph(g_editor, g_area, '');
          this.host.postMessage({ type: 'saveGraph', data: graph });
        }
      }, 500, {
        leading: true, // with no delay, send the graph to vscode
        trailing: true, // don't discard the last input change
        maxWait: 500, // ensure the graph is saved after max 1s
      });

      this.gs.onInputChangeEvent$.subscribe(() => {
        debounceSaveGraph();
      });

      area.addPipe((context: Root<Schemes> | AreaExtra | Area2D<Schemes>) => {
        const { type } = context as { type: string };
        switch (type) {
          case "nodedragged": {
            if (!this.gs.isLoading()) {
              const graph = this.gs.serializeGraph(editor, area!, '');
              void this.host.postMessage({ type: 'saveGraph', data: graph });
            }
            break;
          }
          case "pointerup": { // finish dragging
            if (!this.gs.isLoading()) {
              void this.host.postMessage({ type: 'saveTransform', data: area.area.transform });
            }
            break;
          }
        }
        return context;
      })

      editor.addPipe((context: Root<Schemes>) => {
        const { type } = context as { type: string };
        switch (type) {
          case "nodetranslated":
          case "nodecreated":
          case "noderemoved":
          case "connectioncreated":
          case "connectionremoved": {
            // VS Code has no way of knowing if the events are fired by/during
            // loading of the graph, or are user interactions. To avoid
            // the graph file in VS Code being marked as dirty, only
            // send the 'saveGraph' message outside of the loading operation.
            if (!this.gs.isLoading()) {
              const graph = this.gs.serializeGraph(editor, area!, '');
              void this.host.postMessage({ type: 'saveGraph', data: graph });
            }
            break;
          }
        }
        return context;
      });
    } else if (environment.web) {

      const foo = `entry: start
executions:
  - src:
      node: file-read-v1-lion-gray-strawberry
      port: exec
    dst:
      node: aws-s3-upload-v1-grape-parrot-parrot
      port: exec
  - src:
      node: start
      port: exec
    dst:
      node: dirwalk-v1-octopus-blue-purple
      port: exec
  - src:
      node: dirwalk-v1-octopus-blue-purple
      port: exec
    dst:
      node: iterator-v1-cranberry-blue-red
      port: exec
  - src:
      node: iterator-v1-cranberry-blue-red
      port: exec
    dst:
      node: file-read-v1-lion-gray-strawberry
      port: exec
connections:
  - src:
      node: file-read-v1-lion-gray-strawberry
      port: file
    dst:
      node: aws-s3-upload-v1-grape-parrot-parrot
      port: content
  - src:
      node: iterator-v1-cranberry-blue-red
      port: value
    dst:
      node: aws-s3-upload-v1-grape-parrot-parrot
      port: name
  - src:
      node: dirwalk-v1-octopus-blue-purple
      port: items
    dst:
      node: iterator-v1-cranberry-blue-red
      port: array
  - src:
      node: iterator-v1-cranberry-blue-red
      port: value
    dst:
      node: file-read-v1-lion-gray-strawberry
      port: path
nodes:
  - id: start
    type: start@v1
    position:
      x: -600
      y: -10
    settings:
      folded: false
  - id: dirwalk-v1-octopus-blue-purple
    type: dirwalk@v1
    position:
      x: -220
      y: -100
    inputs:
      dir: /Users/sebastian/Desktop/test-actiongraph
    settings:
      folded: false
  - id: file-read-v1-lion-gray-strawberry
    type: file-read@v1
    position:
      x: 500
      y: -320
    settings:
      folded: false
  - id: aws-s3-upload-v1-grape-parrot-parrot
    type: aws-s3-upload@v1
    position:
      x: 800
      y: -240
    inputs:
      bucket: actionforge
    settings:
      folded: false
  - id: iterator-v1-cranberry-blue-red
    type: iterator@v1
    position:
      x: 140
      y: -180
    settings:
      folded: false
registries: []
description: ''
              
`
      await this.openGraph(location.pathname, foo, null);

      try {

        if (location.pathname !== '/') {
          const re = /github\/(?<owner>[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\/(?<repo>[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\/(?<ref>.+)\/(?<path>.github\/.+\.yml)/;

          const components: RegExpExecArray | null = re.exec(location.pathname);
          if (!components) {
            throw new Error('invalid url format');
          }

          const { owner, repo, ref, path } = components.groups as { [key: string]: string };

          if (!owner || !repo || !ref || !path) {
            throw new Error('invalid url');
          }

          const graph: IGraph = await this.gw.graphRead({
            provider: 'github', owner, repo, ref, path,
          });

          await this.openGraph(location.pathname, dump(graph), null);
        }
      } catch (error) {
        void this.ns.showNotification(NotificationType.Error, getErrorMessage(error));
      }
    }
  }

  async arrangeNodes(): Promise<void> {
    if (!g_arrange) {
      throw new Error('arrange not initialized');
    }
    await g_arrange.layout();
  }

  async fitToCanvas(): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(() => {
        if (!g_editor) {
          throw new Error('editor not initialized');
        } else if (!g_area) {
          throw new Error('area not initialized');
        }
        void AreaExtensions.zoomAt(g_area, g_editor.getNodes(), { scale: 0.75 })
          .then(resolve)
      }, 0);
    })

    const graph = this.gs.serializeGraph(g_editor!, g_area!, '');
    void this.host.postMessage({ type: 'saveGraph', data: graph });
  }
}
