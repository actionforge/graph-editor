import { ClassicPreset } from "rete";

export class BaseSocket extends ClassicPreset.Socket {

  getType(): string {
    return this.type;
  }

  isExec(): boolean {
    return this.exec;
  }

  constructor(args: { key: string, type: string, exec: boolean }) {
    super(args.key);
    this.type = args.type;
    this.exec = args.exec;
  }

  private exec: boolean;
  private type: string;
}
