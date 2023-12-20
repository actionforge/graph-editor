import {
  Component,
  Input,
  ChangeDetectorRef,
  OnChanges,
  HostListener,
  inject,
  HostBinding
} from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";
import { BaseSocket } from "src/app/helper/rete/basesocket";

@Component({
  templateUrl: `basesocket.component.html`,
  styleUrls: ["./basesocket.component.scss"],
  providers: [MatTooltip],
})
export class BaseSocketComponent implements OnChanges {

  tooltip = inject(MatTooltip)
  cdr = inject(ChangeDetectorRef);

  @Input() data!: BaseSocket;
  @Input() rendered!: () => void;

  constructor() {
    this.cdr.detach();
  }

  @HostBinding("class.isArray")
  get isArray(): boolean {
    return this.data.getType().startsWith('[]')
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
  }

  @HostListener('mouseenter') onMouseEnter(): void {
    this.tooltip.message = this.data.getType();
    this.tooltip.show();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.tooltip.hide();
  }
}
