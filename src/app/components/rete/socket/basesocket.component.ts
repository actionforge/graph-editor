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

const typeToClassMap = new Set<string>([
  "number",
  "bool",
  "string",
  "boolean",
  "any",
  "unknown"
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
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
  }

  getSocketClass(): string {
    return typeToClassMap.has(this.data.getInferredType()) ? this.data.getInferredType() : "default";
  }

  @HostListener('mouseenter') onMouseEnter(): void {
    this.tooltip.message = this.data.getInferredType();
    this.tooltip.show();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.tooltip.hide();
  }
}
