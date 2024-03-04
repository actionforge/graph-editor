import { Component, Injector, inject } from '@angular/core';
import { GraphService } from 'src/app/services/graph.service';
import { NotificationService, NotificationType } from 'src/app/services/notification.service';
import { Registry } from 'src/app/services/registry.service';
import { INodeTypeDefinitionBasic } from 'src/app/helper/rete/interfaces/nodes';
import { NodeFactory } from 'src/app/services/nodefactory.service';
import { Observable } from 'rxjs';
import { provideVSCodeDesignSystem, vsCodeButton } from "@vscode/webview-ui-toolkit";
import { RegistryUriInfo, getErrorMessage } from 'src/app/helper/utils';
import { environment } from 'src/environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';
import { HostService as HostService } from 'src/app/services/host.service';
import { ReteService } from 'src/app/services/rete.service';

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
  clipboard = inject(Clipboard);
  injector = inject(Injector);
  rs = inject(ReteService);

  nodeUrl = "";

  isDev(): boolean {
    return environment.dev;
  }

  isVsCode(): boolean {
    return environment.vscode;
  }

  isElectron(): boolean {
    return environment.electron;
  }

  onCopyToClipboard(_event: MouseEvent): void {
    const graph = this.gs.serializeGraph();
    this.clipboard.copy(graph);
  }

  getBasicNodeTypeDefinitions(): Observable<Map<string, INodeTypeDefinitionBasic> | 'loading'> {
    return this.nr.getBasicNodeTypeDefinitions();
  }

  async onLoadRegistry(event: MouseEvent, registryUri: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    try {
      const ruri: RegistryUriInfo = await this.nr.loadRegistry(registryUri);

      if (this.isVsCode() || this.isElectron()) {
        const host = this.injector.get(HostService);
        const graph = this.gs.serializeGraph();
        void host.postMessage({ type: 'saveGraph', data: graph });
      }

      void this.ns.showNotification(NotificationType.Success, `Loaded ${ruri.owner}/${ruri.regname}@${ruri.ref} successfully.`);
    } catch (error) {
      console.error(error);
      this.ns.showNotification(NotificationType.Error, getErrorMessage(error));
    }
  }

  async onCreateNode(event: MouseEvent, nodeTypeId: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    await this.gs.createNode(nodeTypeId, {
      nodeId: null,
      userCreated: true,
    });
  }

  trimNodeUri(nodeUri: string): string {
    return nodeUri.substring('github.com/'.length);
  }
}
