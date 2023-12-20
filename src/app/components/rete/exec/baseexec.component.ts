import {
  Component,
  Input,
  ChangeDetectorRef,
  OnChanges,
  inject
} from "@angular/core";

@Component({
  templateUrl: `./baseexec.component.html`,
  styleUrls: ["./baseexec.component.scss"]
})
export class BaseExecComponent implements OnChanges {

  cdr = inject(ChangeDetectorRef);

  @Input() data!: unknown;
  @Input() rendered!: () => void;

  constructor() {
    this.cdr.detach();
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
  }
}
