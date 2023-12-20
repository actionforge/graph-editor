import { Component, inject } from '@angular/core';
import { GraphService } from 'src/app/services/graph.service';
import { NotificationService, NotificationType } from 'src/app/services/notification.service';
import { Registry } from 'src/app/services/registry.service';
import { INodeTypeDefinitionBasic } from 'src/app/helper/rete/interfaces/nodes';
import { NodeFactory } from 'src/app/services/nodefactory.service';
import { Observable } from 'rxjs';
import { provideVSCodeDesignSystem, vsCodeButton } from "@vscode/webview-ui-toolkit";
import { getErrorMessage } from 'src/app/helper/utils';
import { environment } from 'src/environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';
import { area, editor } from 'src/app/helper/rete/editor';

provideVSCodeDesignSystem().register(vsCodeButton());

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  nf = inject(NodeFactory);
  nr = inject(Registry);
  ns = inject(NotificationService);
  gs = inject(GraphService);
  clipboard = inject(Clipboard)

  nodeUrl = "";

  isDev(): boolean {
    return environment.dev;
  }

  isVsCode(): boolean {
    return environment.vscode;
  }

  onCopyToClipboard(_event: MouseEvent): void {
    const graph = this.gs.serializeGraph(editor!, area!, "Dev");
    this.clipboard.copy(graph);
  }

  getBasicNodeTypeDefinitions(): Observable<Map<string, INodeTypeDefinitionBasic> | 'loading'> {
    return this.nr.getBasicNodeTypeDefinitions();
  }

  async onLoadRegistry(event: MouseEvent, registryUri: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    try {
      await this.nr.loadRegistry(registryUri);
    } catch (error) {
      console.error(error);
      this.ns.showNotification(NotificationType.Error, getErrorMessage(error));
    }
  }

  async onCreateNode(event: MouseEvent, nodeType: INodeTypeDefinitionBasic): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    await this.gs.createNode(nodeType.id, true);
  }

  getNodeTypeId(nodeType: INodeTypeDefinitionBasic): string {
    return nodeType.id.substring('github.com/'.length);
  }
}
