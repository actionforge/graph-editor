import { getUID } from "rete";
import { InputOption } from "./interfaces/nodes";

export class Control {
    id: string
    index?: number

    constructor() {
        this.id = getUID()
    }
}

type InputControlOptions<N> = {
    readonly?: boolean;
    default?: N;
    required?: boolean;
    group?: boolean;
    multiline?: boolean;
    options?: InputOption[];
    hint?: string;
    setValue: (value?: N) => void;
    getValue: () => N;
    step?: number;
};

export enum BaseControlType {
    string = 'string',
    option = 'option',
    number = 'number',
    bool = 'bool',

    array_bool = 'array_bool',
    array_string = 'array_string',
    array_number = 'array_number',
}

export class BaseControl<T extends BaseControlType | unknown, N =
    T extends BaseControlType.bool ? boolean :
    T extends BaseControlType.string ? string :
    T extends BaseControlType.number ? number :
    T extends BaseControlType.option ? string :
    T extends BaseControlType.array_string ? string[] :
    T extends BaseControlType.array_bool ? boolean[] :
    T extends BaseControlType.array_number ? number[] :
    unknown
> extends Control {
    default?: N;
    required?: boolean;
    step?: number;
    options?: InputOption[];

    multiline?: boolean;
    hint?: string;

    constructor(public type: T, public opts: InputControlOptions<N>) {
        super()
        this.id = getUID()
        this.multiline = opts?.multiline;
        this.hint = opts?.hint;
        this.step = this.opts?.step;
        this.required = opts?.required;
        this.options = opts?.options;
        this.default = opts.default;

        if (typeof opts.default !== 'undefined') {
            this.setValue(opts.default);
        }
    }

    getValue(): N {
        return this.opts.getValue();
    }

    setValue(value?: N) {
        this.opts.setValue(value)
    }
}
