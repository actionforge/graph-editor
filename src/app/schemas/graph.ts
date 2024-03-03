import { IInputDefinition, IOutputDefinition } from "../helper/rete/interfaces/nodes";


export interface IGraph {
    description: string;
    entry: string;
    nodes: (INode | (INode & IGraph))[];
    connections: IConnection[];
    executions: IExecution[];
    registries: string[];
}

export type ISubGraph = IGraph & {
    outputs: {
        [key: string]: IOutputDefinition;
    },
    inputs: {
        [key: string]: IInputDefinition;
    }
}

export type IInput = unknown | string[] | number[] | boolean[] | string | number | boolean;
export type IOutput = string | null;

export interface IView {
    transform: {
        x: number;
        y: number;
        k: number;
    }

}

export type ISettings = {
    folded: boolean;
    [key: string]: unknown | string[] | number[] | boolean[] | string | number | boolean
};

export interface INode {
    id: string;
    type: string;
    graph?: IGraph & {
        outputs: {
            [key: string]: IOutputDefinition;
        };

        inputs: {
            [key: string]: IInputDefinition;
        };
    }
    position: { x: number; y: number };
    inputs?: { [key: string]: IInput };
    outputs?: { [key: string]: IOutput };
    settings?: ISettings;
}

export interface IExecution {
    src: {
        node: string;
        port: string;
    };
    dst: {
        node: string;
        port: string;
    };
}

export interface IConnection {
    src: {
        node: string;
        port: string;
    };
    dst: {
        node: string;
        port: string;
    };
}