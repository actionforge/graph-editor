import { Component, Input } from "@angular/core";
import { BaseConnection } from "src/app/helper/rete/baseconnection";
import { BaseNode } from "src/app/helper/rete/basenode";

@Component({
  selector: "app-connection",
  templateUrl: "./baseconnection.component.html",
  styleUrls: ["./baseconnection.component.scss"]
})
export class BaseConnectionComponent {

  isExec(): boolean {
    return this.data.sourceOutput.startsWith('exec') || this.data.targetInput.startsWith('exec');
  }

  @Input() data!: BaseConnection<BaseNode, BaseNode> | { isPseudo: true, sourceOutput: string, targetInput: string };
  @Input() start!: { x: number, y: number };
  @Input() end!: { x: number, y: number };
  @Input() path!: string;
}
