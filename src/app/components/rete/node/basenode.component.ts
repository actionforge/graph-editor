import {
  Component,
  Input as _Input,
  HostBinding,
  ChangeDetectorRef,
  OnChanges,
  inject,
  HostListener,
} from "@angular/core";
import { getGhActionIcon } from "src/app/helper/gh-icons";
import { BaseControl, BaseControlType } from "src/app/helper/rete/basecontrol";
import { BaseInput } from "src/app/helper/rete/baseinput";
import { BaseNode } from "src/app/helper/rete/basenode";
import { BaseOutput } from "src/app/helper/rete/baseoutput";
import { g_area, g_editor } from "src/app/helper/rete/editor";
import { GraphService, Permission } from "src/app/services/graph.service";
import { NodeFactory } from "src/app/services/nodefactory.service";
import { Registry } from "src/app/services/registry.service";

const DEFAULT_HEADER_COLOR = 'linear-gradient(to right, rgb(34, 118, 197), rgb(21, 67, 128))'
const DEFAULT_BODY_COLOR = 'linear-gradient(to right, rgb(50, 120, 200), rgb(10, 50, 128))'

// Constants for Header Background. The colors are defined here:
// https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#brandingcolor
const HEADER_BACKGROUND_COLORS = new Map<string, string>([
  ['white', 'white'],
  ['yellow', 'linear-gradient(to right, #996633 0%, #ff9900 100%)'],
  ['blue', 'linear-gradient(to right, #333399 0%, #0066ff 100%)'],
  ['green', 'linear-gradient(135deg, rgba(5, 171, 18, 1.0), rgba(2, 64, 16, 1.0))'],
  ['orange', 'linear-gradient(to right, #cc6600 0%, #996633 100%)'],
  ['red', 'linear-gradient(to right, #990000 0%, #cc3300 100%)'],
  ['purple', 'linear-gradient(to right, #660033 0%, #660066 100%)'],
  ['gray-dark', '#303030']
]);

// Constants for Body Background. The colors are defined here:
// https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#brandingcolor
const BODY_BACKGROUND_COLORS = new Map<string, string>([
  ['white', 'white'],
  ['yellow', 'linear-gradient(to right, #ff9933 0%, #996600 100%)'],
  ['blue', 'linear-gradient(to right, #003366 0%, #0066cc 100%)'],
  ['green', 'linear-gradient(135deg, rgba(5, 171, 18, 1.0), rgba(2, 64, 16, 1.0))'],
  ['orange', 'linear-gradient(to right, #cc6600 0%, #996600 100%)'],
  ['red', 'linear-gradient(to right, #990000 0%, #cc3300 100%)'],
  ['purple', 'linear-gradient(to right, #660066 0%, #660033 100%)'],
  ['gray-dark', '#404040']
]);

@Component({
  templateUrl: "./basenode.component.html",
  styleUrls: ["./basenode.component.scss"],
})
export class BaseNodeComponent implements OnChanges {

  cdr = inject(ChangeDetectorRef);
  gs = inject(GraphService);
  nf = inject(NodeFactory);
  nr = inject(Registry);

  @_Input() data!: BaseNode;
  @_Input() emit!: (data: unknown) => void;
  @_Input() rendered!: () => void;

  seed = 0;
  mouseover = false;

  Permission = Permission

  constructor() {
    this.cdr.detach();
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
    this.seed++; // force render sockets
  }

  isCompact(): boolean {
    return this.data.getDefinition().compact;
  }

  async onShowHideConnectedPorts(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const n = g_editor!.getNode(this.data.id);
    n.getSettings().folded = Boolean(!n.getSettings().folded);

    await g_area!.update("node", this.data.id);
    this.cdr.detectChanges();
  }

  async onDeleteNode(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    await this.gs.deleteNode(this.data.id);
  }

  async onAppendOutputValue(event: MouseEvent, output: BaseOutput): Promise<void> {
    event.stopPropagation();

    await this.data.appendOutputValue(output);

    await g_area!.update("node", this.data.id);
    this.cdr.detectChanges();
  }

  async onAppendInputValue(event: MouseEvent, input: BaseInput): Promise<void> {
    event.stopPropagation();

    await this.data.appendInputValue(input, this.gs.inputChangeSubject());

    const control = input.control as BaseControl<BaseControlType> | null;
    if (control) {
      await g_area!.update("control", control.id);
    }
    await g_area!.update("node", this.data.id);
    this.cdr.detectChanges();
  }

  async onPopOutputValue(event: MouseEvent, output: BaseOutput): Promise<void> {
    event.stopPropagation();

    await this.data.popOutputValue(output);
    await g_area!.update("node", this.data.id);
    this.cdr.detectChanges();
  }

  async onPopInputValue(event: MouseEvent, input: BaseInput): Promise<void> {
    event.stopPropagation();

    await this.data.popInputValue(input);
    const control = input.control as BaseControl<BaseControlType> | null;
    if (control) {
      await g_area!.update("control", control.id);
    }
    await g_area!.update("node", this.data.id);
    this.cdr.detectChanges();
  }

  @HostListener('mouseover')
  onMouseOver(): void {
    if (!this.mouseover) {
      this.mouseover = true;
      this.cdr.detectChanges();
    }
  }

  @HostListener('mouseout')
  onMouseOut(): void {
    if (this.mouseover) {
      this.mouseover = false;
      this.cdr.detectChanges();
    }
  }

  @HostBinding('class.selected')
  get selected(): boolean {
    return Boolean(this.data.selected);
  }

  getFoldIcon(): string {
    return this.data.getSettings().folded ? "tablerArrowsMaximize" : "tablerArrowsMinimize";
  }

  getFoldTooltip(): string {
    return this.data.getSettings().folded ? "Show All Ports" : "Hide Unconnected Ports";
  }

  getHeaderBackground(): string {
    if (this.data.getDefinition().registry === "github.com") {
      const color = this.data.getDefinition().style?.header?.background;
      if (color) {
        return HEADER_BACKGROUND_COLORS.get(color) || DEFAULT_HEADER_COLOR;
      }
    }
    return this.data.getDefinition().style?.header?.background || DEFAULT_HEADER_COLOR;
  }

  getBodyBackground(): string {
    if (this.data.getDefinition().registry === "github.com") {
      const color = this.data.getDefinition().style?.body?.background;
      if (color) {
        return BODY_BACKGROUND_COLORS.get(color) || DEFAULT_BODY_COLOR;
      }
    }
    return this.data.getDefinition().style?.body?.background || DEFAULT_BODY_COLOR;
  }

  getNodeLabel(): string {
    return this.data.getDefinition().name;
  }

  getNodeId(): string {
    return this.data.getDefinition().id.split('/', 2)[1];
  }

  isGitHubAction(): boolean {
    return this.data.getDefinition().registry === "github.com";
  }

  getPermission(): Permission {
    return this.gs.getPermission();
  }

  getIcon(): string | null {
    return getGhActionIcon(this.data.getDefinition().icon) ?? "featherFeather";
  }

  showOutput(portId: string): boolean {
    if (this.data.getSettings().folded) {
      return this.data.getOutgoingConnections(portId) > 0;
    }

    return true;
  }

  showOutputGroupButtons(port: BaseOutput): boolean {
    return this.gs.getPermission() === Permission.Writable && Boolean(port.def.group);
  }

  showInputGroupButtons(port: BaseInput): boolean {
    return this.gs.getPermission() === Permission.Writable && (Boolean(port.def.group) || (port.isArray() && Boolean(port.control && port.showControl)));
  }

  showInputControl(port: BaseInput): boolean {
    return !(port.def.group && port.control && port.showControl);
  }

  showInput(port: BaseInput): boolean {
    if (this.data.getSettings().folded) {
      // always show input exec ports
      return port.socket.isExec() || Boolean(port.control && !port.showControl);
    }

    return true;
  }

  showSocket(port: BaseOutput | BaseInput): boolean {
    return !port.def.group;
  }

  sortPorts(a: { key: string, value: BaseOutput | BaseInput }, b: { key: string, value: BaseOutput | BaseInput }): number {
    if (a.value.index !== undefined && b.value.index !== undefined) {
      return a.value.index - b.value.index;
    } else {
      return a.key.localeCompare(b.key);
    }
  }
}
