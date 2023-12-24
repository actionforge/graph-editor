

export interface IGraph {
    description: string;
    entry: string;
    nodes: INode[];
    connections: IConnection[];
    executions: IExecution[];
    registries: string[];
    view?: IView;
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