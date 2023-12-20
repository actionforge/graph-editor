import { NodeEditor, GetSchemes, BaseSchemes, Root } from 'rete';
import { Injector } from '@angular/core';
import { AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from 'rete-connection-plugin';
import {
  AngularPlugin,
  AngularArea2D,
  Presets as AngularPresets,
} from 'rete-angular-plugin/16';

import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
} from 'rete-auto-arrange-plugin';

import { ExtractPayload } from 'rete-angular-plugin/presets/classic/types';
import { BaseNode } from './basenode';
import { BaseConnection } from './baseconnection';
import { BaseNodeComponent } from 'src/app/components/rete/node/basenode.component';
import { BaseConnectionComponent } from 'src/app/components/rete/connection/baseconnection.component';
import { BaseSocketComponent } from 'src/app/components/rete/socket/basesocket.component';
import { BaseExecComponent } from 'src/app/components/rete/exec/baseexec.component';
import { BaseControlComponent as BaseControlComponent } from 'src/app/components/basecontrol/basecontrol.component';
import { BaseSocket } from './basesocket';
import { ReadonlyPlugin } from 'rete-readonly-plugin';
import { BaseInput } from './baseinput';
import { BaseOutput } from './baseoutput';

export type Conn = BaseConnection<BaseNode, BaseNode>;
export type Schemes = GetSchemes<BaseNode, Conn>;
export type AreaExtra = AngularArea2D<Schemes>;

export const readonly = new ReadonlyPlugin<Schemes>();
export let editor: NodeEditor<Schemes> | undefined;
export let area: AreaPlugin<Schemes, AreaExtra> | undefined;
export let arrange: AutoArrangePlugin<Schemes, never> | undefined;

function addCustomBackground<S extends BaseSchemes, K>(
  area: AreaPlugin<S, K>
) {
  const background = document.createElement("div");

  background.classList.add("bg-red-50");

  area.area.content.add(background);
}

// TODO: (Seb) Move this into editor.service.ts
export async function createEditor(element: HTMLElement, injector: Injector): Promise<{
  editor: NodeEditor<Schemes>,
  arrange: AutoArrangePlugin<Schemes, never>,
  area: AreaPlugin<Schemes, AreaExtra>,
  connection: ConnectionPlugin<Schemes, AreaExtra>,
}> {

  // disable double click for now
  element.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    e.preventDefault();
  }, true /* use capture to fire this event before area zoom dblclick event listener */);

  editor = new NodeEditor<Schemes>();
  area = new AreaPlugin<Schemes, AreaExtra>(element);
  arrange = new AutoArrangePlugin<Schemes>();

  const connection = new ConnectionPlugin<Schemes, AreaExtra>();

  const angularRender = new AngularPlugin<Schemes, AreaExtra>({ injector });

  angularRender.addPreset(
    AngularPresets.classic.setup({
      customize: {
        node() {
          return BaseNodeComponent;
        },
        connection(_data: ExtractPayload<Schemes, 'connection'>) {
          return BaseConnectionComponent;
        },
        socket(data: ExtractPayload<Schemes, 'socket'>) {
          if ((data.payload as BaseSocket).isExec()) {
            return BaseExecComponent;
          } else {
            return BaseSocketComponent;
          }
        },
        control(data: ExtractPayload<Schemes, 'control'>) {
          if (data.payload) {
            return BaseControlComponent;
          } else {
            return null;
          }
        },
      },
    })
  );

  connection.addPreset(ConnectionPresets.classic.setup());

  addCustomBackground(area);

  editor.use(area);

  area.use(connection);
  area.use(angularRender);

  arrange.addPreset(ArrangePresets.classic.setup());
  area.use(arrange);

  AreaExtensions.simpleNodesOrder(area)
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), { accumulating: AreaExtensions.accumulateOnCtrl() });
  AreaExtensions.snapGrid(area, { size: 10, dynamic: true });
  AreaExtensions.showInputControl<Schemes>(area, ({ hasAnyConnection }) => {
    return !hasAnyConnection;
  })

  editor.addPipe((context: Root<Schemes>) => {
    const { type } = context as { type: string };
    switch (type) {
      case "connectioncreate": {

        const { data } = context as { type: string, data: BaseConnection<BaseNode, BaseNode> };

        const sourceNode: BaseNode | undefined = editor!.getNode(data.source);
        const targetNode: BaseNode | undefined = editor!.getNode(data.target);

        if (sourceNode && targetNode) {

          const sourceOutput: BaseOutput | undefined = sourceNode.getOutput(data.sourceOutput);
          const targetInput: BaseInput | undefined = targetNode.getInput(data.targetInput);

          if (sourceOutput && targetInput) {
            const typeSource = sourceOutput.socket.getType();
            const typeTarget = targetInput.socket.getType();

            if (targetInput.socket.isExec()) {
              if (sourceOutput.socket.isExec()) {
                return context;
              } else {
                return undefined;
              }
            } else {
              if (sourceOutput.socket.isExec()) {
                return undefined;
              } else if (typeSource === typeTarget || typeTarget === 'any') {
                return context;
              }

              // support for casting types
              switch (typeTarget) {
                case 'bool':
                  return typeSource === 'number' ? context : undefined;
                case 'number':
                  return typeSource === 'bool' ? context : undefined;
                case 'string':
                  return ['number', 'bool'].includes(typeSource) ? context : undefined;
                case 'option':
                  return ['number', 'string'].includes(typeSource) ? context : undefined;
                case '[]bool':
                  return typeSource === '[]number' ? context : undefined;
                case '[]number':
                  return typeSource === '[]bool' ? context : undefined;
              }
              return undefined;
            }
          }
        }
      }
    }
    return context;
  })

  await arrange.layout();

  return {
    editor,
    area,
    arrange,
    connection,
  };
}
