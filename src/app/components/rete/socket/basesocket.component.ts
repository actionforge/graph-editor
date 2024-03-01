import {
  Component,
  Input,
  ChangeDetectorRef,
  OnChanges,
  HostListener,
  inject,
  OnInit
} from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";
import { BaseSocket } from "src/app/helper/rete/basesocket";

const typeToPortLabel = new Map<string, string>([
  ["bool", "bool"],
  ["number", "num"],
  ["string", "str"],
  ["option", "opt"],
  ["[]string", "str"],
  ["[]number", "num"],
  ["[]bool", "bool"],
  ["unknown", "unknown"],
  ["any", "any"],
]);

const typeToClassMap = new Map<string, string>([
  ["bool", "bool"],
  ["number", "number"],
  ["string", "string"],
  ["option", "option"],
  ["[]string", "string array"],
  ["[]number", "number array"],
  ["[]bool", "bool array"],
  ["unknown", "unknown"],
  ["any", "any"],
]);

@Component({
  templateUrl: `basesocket.component.html`,
  styleUrls: ["./basesocket.component.scss"],
  providers: [MatTooltip],
})
export class BaseSocketComponent implements OnInit, OnChanges {

  tooltip = inject(MatTooltip)
  cdr = inject(ChangeDetectorRef);

  @Input() data!: BaseSocket;
  @Input() rendered!: () => void;

  portClass = "";

  constructor() {
    this.cdr.detach();
  }

  ngOnInit(): void {
    const isArray = this.data.getInferredType().startsWith('[]');
    let inferedBaseType = this.data.getInferredType();
    if (isArray) {
      inferedBaseType = inferedBaseType.replace('[]', '');
    }
    this.portClass = `${inferedBaseType} ${isArray ? "array" : ""}`;

    this.cdr.detectChanges();
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
  }

  getPortClass(): string {
    return this.portClass;
  }

  getPortLabel(): string {
    const type = this.data.getInferredType();
    return typeToPortLabel.get(type) ?? "default";
  }

  @HostListener('mouseenter') onMouseEnter(): void {
    const type = this.data.getInferredType();
    this.tooltip.message = type === "unknown" ? "Type Forwarding" : type;
    this.tooltip.show();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.tooltip.hide();
  }
}
