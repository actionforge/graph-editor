import { ClassicPreset } from "rete";
import { BaseSocket } from "./basesocket";
import { IInputDefinition, INodeTypeDefinitionFull, IOutputDefinition } from "./interfaces/nodes";
import { IInput, ISettings } from "src/app/schemas/graph";
import { BaseControl, BaseControlType } from "./basecontrol";
import { BaseInput } from "./baseinput";
import { BaseOutput } from "./baseoutput";
import { Subject } from "rxjs";

const portTypeToControlTypeMapping = new Map<string, BaseControlType>([
  ["bool", BaseControlType.bool],
  ["string", BaseControlType.string],
  ["number", BaseControlType.number],

  ["option", BaseControlType.option],

  ["[]bool", BaseControlType.array_bool],
  ["[]string", BaseControlType.array_string],
  ["[]number", BaseControlType.array_number],
]);

export class BaseNode extends ClassicPreset.Node {

  width = 64;
  height = 64;

  // Different from ClassicPreset.Node.
  // Similar to github/sebastianrath/node-js-examples/fibnode@v4
  private type: string;
  private name: string;
  private definition: INodeTypeDefinitionFull;

  private inputMap = new Map<string, BaseInput>();
  private outputMap = new Map<string, BaseOutput>();

  private settings: ISettings = {
    folded: false,
  };

  // Set of connection ids that are outgoing from this node.
  private outgoingConnections = new Map<string, number>();

  private inputValues = new Map<string, IInput>();

  constructor(id: string, type: string, name: string, definition: INodeTypeDefinitionFull) {
    super(name);
    this.id = id; // overwrite ClassicPreset.Node.id since we use our own id system
    this.type = type;
    this.name = name;
    this.definition = definition;
  }

  getOutputs(): Map<string, BaseOutput> {
    return this.outputMap;
  }

  getInputs(): Map<string, BaseInput> {
    return this.inputMap;
  }

  getOutgoingConnections(portId: string): number {
    return this.outgoingConnections.get(portId) || 0;
  }

  addOutgoingConnection(portId: string): void {
    this.outgoingConnections.set(portId, (this.outgoingConnections.get(portId) || 0) + 1);
  }

  removeOutgoingConnection(portId: string): void {
    this.outgoingConnections.set(portId, (this.outgoingConnections.get(portId) || 1 /* 1 to avoid <0 */) - 1);
  }

  getDefinition(): INodeTypeDefinitionFull {
    return this.definition;
  }

  getInputValues(): Map<string, IInput> {
    return this.inputValues;
  }

  getName(): string {
    return this.name;
  }

  getType(): string {
    return this.type;
  }

  getSettings(): ISettings {
    return this.settings;
  }

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  setInputValue(portId: string, portValue: unknown): void {
    this.inputValues.set(portId, portValue);
  }

  deleteInputValue(portId: string): void {
    this.inputValues.delete(portId);
  }

  getInput(key: string): BaseInput | undefined {
    return this.inputMap.get(key);
  }

  getOutput(key: string): BaseOutput | undefined {
    return this.outputMap.get(key);
  }

  setSettings(settings: ISettings): void {
    this.settings = settings;
  }

  addOutput2(outputName: string, outputDef: IOutputDefinition, sub: boolean): BaseOutput {
    const socket = new BaseSocket({
      key: outputName,
      type: outputDef.type,
      exec: Boolean(outputDef.exec),
    });

    const multipleConnections = !outputDef.exec;
    const output = new BaseOutput(socket, outputDef.name, multipleConnections, outputDef, sub);
    output.index = outputDef.index;

    super.addOutput(outputName, output);
    this.outputMap.set(outputName, output);
    return output;
  }

  addInput2(inputName: string, def: IInputDefinition, inputChangeEvent: Subject<unknown>, sub: boolean): BaseInput {
    const socket = new BaseSocket({
      key: inputName,
      type: def.type,
      exec: Boolean(def.exec),
    });

    const multipleConnections = Boolean(def.exec);
    const input = new BaseInput(socket, def.name, multipleConnections, def, sub);
    input.index = def.index;

    super.addInput(inputName, input);
    this.inputMap.set(inputName, input);

    if (!def.group) {
      const controlType = portTypeToControlTypeMapping.get(def.type);
      if (controlType) {
        input.addControl(new BaseControl(controlType, {
          default: def.default,
          required: def.required,
          step: def.step,
          hint: def.hint,
          group: def.group,
          options: def.options,
          multiline: def.multiline,
          setValue: (value: unknown) => {
            this.setInputValue(inputName, value);

            inputChangeEvent.next(value);
          },
          getValue: (): unknown => {
            return this.getInputValues().get(inputName) ?? def.default ?? undefined;
          }
        }));

        if (def.default) {
          this.setInputValue(inputName, def.default);
        }
      }
    }
    return input;
  }

  override removeOutput(key: string): void {
    this.outputMap.delete(key);
    super.removeOutput(key);
  }

  override removeInput(key: string): void {
    this.inputMap.delete(key);
    super.removeInput(key);
  }

  async appendOutputValue(output: BaseOutput): Promise<void> {
    if (output.def.group) {

      const outputCount = getHighestSubPortIndex(output.socket.name, [...this.getOutputs().keys()]);

      const newOutputId = `${output.socket.name}[${outputCount + 1}]`;
      this.addOutput2(newOutputId, {
        ...output.def,
        group: false,
        index: Number(output.index) + 1 /* +1 to be higher than highest output index */
          + outputCount + 1, /* another +1 as highestOutputIndex is -1 and first output index starts at 0, */
      }, true);
    }
  }

  async appendInputValue(input: BaseInput, inputChangeEvent: Subject<unknown>): Promise<void> {
    if (input.def.group) {

      const inputCount = getHighestSubPortIndex(input.socket.name, [...this.getInputValues().keys()]);
      let inputHint: string | undefined;
      if (input.def.hint) {
        inputHint = input.def.hint.replace(/{i}/g, `${inputCount + 1}`);
      }

      const newInputId = `${input.socket.name}[${inputCount + 1}]`;

      this.setInputValue(newInputId, input.def.default ?? null /* null is used to indicate that there is no value */);
      this.addInput2(newInputId, {
        ...input.def,
        group: false,
        hint: inputHint,
        index: Number(input.index) + 1 /* +1 to be higher than input index */
          + inputCount + 1, /* another +1 as highestInputIndex is -1 and first input index starts at 0, */
      }, inputChangeEvent, true);
    } else if (input.isArray()) {
      let v = this.inputValues.get(input.socket.name) as unknown[] | undefined;
      if (v === undefined) {
        v = [];
      }

      const control = input.control as BaseControl<BaseControlType> | null;
      if (control) {
        v.push(control.default || createZeroedArrayElement(control.type));
      }
      this.setInputValue(input.socket.name, v);
    }
  }

  async popOutputValue(output: BaseOutput): Promise<void> {
    if (output.def.group) {
      const inputCount = getHighestSubPortIndex(output.socket.name, [...this.getOutputs().keys()]);
      if (inputCount >= 0) {
        const valueId = `${output.socket.name}[${inputCount}]`;
        this.removeOutput(valueId);
      }
    } else {
      throw new Error(`Cannot pop output value for non-group outputs`);
    }
  }

  async popInputValue(input: BaseInput): Promise<void> {
    if (input.def.group) {
      const inputCount = getHighestSubPortIndex(input.socket.name, [...this.getInputs().keys()]);
      if (inputCount >= 0) {
        const valueId = `${input.socket.name}[${inputCount}]`;
        this.deleteInputValue(valueId);
        this.removeInput(valueId);
      }
    } else if (input.isArray()) {
      const v: unknown | undefined = this.inputValues.get(input.socket.name);
      if (Array.isArray(v)) {
        v.pop();
      }
    } else {
      throw new Error(`Cannot pop input value for non-group and non-array inputs`);
    }
  }
}

function getHighestSubPortIndex(prefix: string, portIds: string[]): number {
  let largestIndex = -1;
  const r = new RegExp(`^(${prefix})\\[([0-9]+)\\]$`);
  for (const portId of portIds) {
    const match = portId.match(r);
    if (match) {
      const portIndex = parseInt(match[2], 10);
      if (isNaN(portIndex)) {
        throw new Error(`Expected number, got ${match[2]}`);
      }

      largestIndex = Math.max(largestIndex, portIndex);
    }
  }
  // Inbetween ports there is space for 127 sub ports.
  // If this is not enough, increase this value here
  // and in the graph runner
  if (largestIndex >= 127) {
    throw new Error(`Cannot add more than 128 sub ports`);
  }

  return largestIndex;
}

function createZeroedArrayElement(type: BaseControlType): unknown {
  switch (type) {
    case BaseControlType.array_string:
      return "";
    case BaseControlType.array_number:
      return 0;
    case BaseControlType.array_bool:
      return false;
    default:
      throw new Error("expected array type");
  }
}
