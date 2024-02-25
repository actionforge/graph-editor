import { ClassicPreset } from "rete";

export class BaseSocket extends ClassicPreset.Socket {

  getInferredType(): string {
    return this.inferredType ?? this.originalType;
  }

  getOriginalType(): string {
    return this.originalType;
  }

  setInferredType(type: string | null): void {
    this.inferredType = type;
  }

  setType(type: string): void {
    this.originalType = type;
  }

  isExec(): boolean {
    return this.exec;
  }

  constructor(args: { key: string, type: string, exec: boolean }) {
    super(args.key);
    this.originalType = args.type;
    this.exec = args.exec;
  }

  private exec: boolean;
  private originalType: string;
  private inferredType: string | null = null;
}
