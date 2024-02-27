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

const typeToClassMap = new Map<string, string>([
  ["number", "num"],
  ["bool", "bool"],
  ["string", "str"],
  ["unknown", "unknown"],
  ["any", "[*]"],
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

  isArray = false;

  constructor() {
    this.cdr.detach();
  }

  ngOnInit(): void {
    this.isArray = this.data.getInferredType().startsWith('[]');
    this.cdr.detectChanges();
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
  }

  getSocketClass(): string {
    if (this.isArray) {
      return "array";
    } else {
      const type = this.data.getInferredType();
      return typeToClassMap.get(type) ?? "generic";
    }
  }

  @HostListener('mouseenter') onMouseEnter(): void {
    const type = this.data.getInferredType();
    this.tooltip.message = type === "unknown" ? "Type Forwarding" : this.data.name;
    this.tooltip.show();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.tooltip.hide();
  }
}
